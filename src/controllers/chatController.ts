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
    // 1. Check for Human Handoff Interception
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (conversation?.is_human_takeover) {
      console.log(`[HANDOFF] Bypassing AI for Conversation ${conversationId}. Emitting to human admin.`);
      
      const io = getIo();
      io.to(tenantId).emit('new_customer_message', {
        conversationId,
        content: query
      });

      // Return immediately so the client doesn't wait for a stream
      res.status(200).json({ message: 'Message routed to live agent' });
      return;
    }

    // 2. Convert user query into an embedding
    const queryEmbedding = await generateEmbedding(query);

    // 2. Retrieve top K similar chunks from Pinecone (Isolated by tenant)
    const matches = await queryPinecone(queryEmbedding, tenantId, 3);

    // 3. Extract text from metadata and construct the context string
    const contextChunks = matches
      .map((match) => match.metadata?.text as string)
      .filter(Boolean); // removes undefined/null

    const contextString = contextChunks.join('\n\n');

    // 4. Construct the simple prompt
    const prompt = `Answer the question based only on the provided context.

Context:
${contextString}

Question:
${query}`;

    // 5. Send to Groq API using basic fetch (User is using console.groq.com)
    const grokApiKey = process.env.GROK_API_KEY || '';
    
    // We use the OpenAI-compatible endpoint provided by Groq
    const grokResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Using the modern Groq model standard
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

    // 6. Setup headers for streaming response back to the client
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Use native web streams to parse the SSE text stream
    const reader = grokResponse.body.getReader();
    const decoder = new TextDecoder('utf-8');

    // Linear loop to read chunks and stream them via res.write()
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            // Extract the JSON payload from the SSE format
            const dataStr = line.slice(6);
            const data = JSON.parse(dataStr);
            const content = data.choices[0]?.delta?.content;
            
            if (content) {
              // Write just the plain text content back to our client
              res.write(content);
            }
          } catch (e) {
            // Ignore partial/invalid JSON from chunk splitting
          }
        }
      }
    }

    // End the stream once complete
    res.end();
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: 'Internal server error processing chat' });
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

    // Broadcast to the tenant admin room that a conversation needs help
    const io = getIo();
    io.to(tenantId).emit('handoff_requested', {
      conversationId,
      message: 'A customer requires human assistance'
    });

    res.json({ message: 'Conversation escalated to human agent', conversation: updatedConversation });
  } catch (error) {
    console.error('Escalation error:', error);
    res.status(500).json({ error: 'Internal server error during escalation' });
  }
};
