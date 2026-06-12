import { Request, Response } from 'express';
import { queryPinecone } from '../services/ragService';
import { generateEmbedding } from '../services/embeddingService';
import { getIo } from '../socket';
import prisma from '../db';
import { AuthRequest } from '../middleware/auth';

export const handleChat = async (req: AuthRequest, res: Response): Promise<void> => {
  const { query, conversationId } = req.body;
  const tenantId = req.user?.tenantId;

  if (!query || !conversationId || !tenantId) {
    res.status(400).json({ error: 'Query, conversationId, and tenant context are required' });
    return;
  }

  try {
    // 1. Check or Create Conversation
    let conversation = await prisma.conversation.findUnique({
      where: { session_id: conversationId }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          tenant_id: tenantId,
          session_id: conversationId,
          customer_name: "Website Visitor"
        }
      });
    }

    // Save user message to database
    await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        tenant_id: tenantId,
        sender: 'user',
        content: query
      }
    });

    if (conversation.is_human_takeover) {
      console.log(`[HANDOFF] Bypassing AI for Conversation ${conversationId}. Emitting to human admin.`);
      
      const io = getIo();
      io.to(`tenant_${tenantId}`).emit('customer_message', {
        conversationId,
        content: query
      });

      // Return immediately as a JSON response (handled gracefully by frontend)
      res.status(200).json({ status: "sent_to_agent" });
      return;
    }

    // Keyword-based Escalation Detection
    const escalationTriggers = ["human", "agent", "talk to someone", "real person", "support"];
    if (escalationTriggers.some(trigger => query.toLowerCase().includes(trigger))) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { is_human_takeover: true }
      });

      const io = getIo();
      io.to(`tenant_${tenantId}`).emit('handoff_requested', {
        conversationId,
        message: 'A customer requires human assistance'
      });

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.write("I am transferring you to a human agent now. They will be with you shortly.");
      res.end();
      return;
    }

    // 2. Convert user query into an embedding
    const queryEmbedding = await generateEmbedding(query);

    // 3. Retrieve top K similar chunks from Pinecone (Isolated by tenant)
    const matches = await queryPinecone(queryEmbedding, tenantId, 3);

    // 4. Extract text from metadata and construct the context string
    const contextChunks = matches
      .map((match) => match.metadata?.text as string)
      .filter(Boolean); // removes undefined/null

    const contextString = contextChunks.join('\n\n');

    // 5. Construct the simple prompt
    const prompt = `Answer the question based only on the provided context.

Context:
${contextString}

Question:
${query}`;

    // 6. Send to Groq API using basic fetch
    const grokApiKey = process.env.GROK_API_KEY || '';
    
    const grokResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      }),
    });

    if (!grokResponse.ok || !grokResponse.body) {
      const errText = await grokResponse.text();
      console.error('Groq API Error:', errText);
      res.status(500).json({ error: 'Failed to connect to Grok/Groq API', details: errText });
      return;
    }

    // 7. Setup headers for streaming response back to the client
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const reader = grokResponse.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let fullAiResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const dataStr = line.slice(6);
            const data = JSON.parse(dataStr);
            const content = data.choices[0]?.delta?.content;
            
            if (content) {
              fullAiResponse += content;
              res.write(content);
            }
          } catch (e) {}
        }
      }
    }

    // Save AI response to DB
    if (fullAiResponse) {
      await prisma.message.create({
        data: {
          conversation_id: conversation.id,
          tenant_id: tenantId,
          sender: 'ai',
          content: fullAiResponse
        }
      });
    }

    res.end();
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: 'Internal server error processing chat' });
  }
};

export const adminReply = async (req: AuthRequest, res: Response): Promise<void> => {
  const { conversationId, message } = req.body;
  const tenantId = req.user?.tenantId;

  if (!conversationId || !message || !tenantId) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const conversation = await prisma.conversation.findFirst({
      where: { session_id: conversationId, tenant_id: tenantId }
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        tenant_id: tenantId,
        sender: 'admin',
        content: message
      }
    });

    const io = getIo();
    io.to(`conversation_${conversationId}`).emit('admin_message', {
      id: Date.now(),
      sender: 'admin',
      text: message
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Admin Reply Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const escalateToHuman = async (req: AuthRequest, res: Response): Promise<void> => {
  const { conversationId } = req.body;
  const tenantId = req.user?.tenantId;

  if (!conversationId || !tenantId) {
    res.status(400).json({ error: 'Conversation ID required' });
    return;
  }

  try {
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { is_human_takeover: true }
    });

    const io = getIo();
    io.to(`tenant_${tenantId}`).emit('handoff_requested', {
      conversationId,
      message: 'A customer requires human assistance'
    });

    res.json({ message: 'Conversation escalated to human agent', conversation: updatedConversation });
  } catch (error) {
    console.error('Escalation error:', error);
    res.status(500).json({ error: 'Internal server error during escalation' });
  }
};
