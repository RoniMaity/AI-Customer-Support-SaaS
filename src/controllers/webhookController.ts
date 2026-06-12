import { Request, Response } from 'express';
import { queryPinecone } from '../services/ragService';
import { generateEmbedding } from '../services/embeddingService';
import prisma from '../db';
import { v4 as uuidv4 } from 'uuid';

export const handleWhatsappWebhook = async (req: Request, res: Response): Promise<void> => {
  const { tenantId } = req.params;
  
  // Twilio sends data as urlencoded by default
  const { From, Body } = req.body;

  if (!From || !Body || !tenantId) {
    res.status(400).send('Missing required parameters');
    return;
  }

  try {
    // 1. Conversation Mapping
    // Look for an existing conversation using the phone number as the session_id
    let conversation = await prisma.conversation.findUnique({
      where: { session_id: From }
    });

    if (!conversation) {
      // Create a new conversation if this is a new WhatsApp user
      conversation = await prisma.conversation.create({
        data: {
          tenant_id: tenantId as string,
          session_id: From as string, // Using phone number as session identifier
          customer_name: 'WhatsApp User',
        }
      });
    }

    // Optional: Log the incoming message to DB
    await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        tenant_id: tenantId as string,
        sender: 'user',
        content: Body as string
      }
    });

    // 2. Message Processing (RAG Pipeline)
    const queryEmbedding = await generateEmbedding(Body as string);
    const matches = await queryPinecone(queryEmbedding, tenantId as string, 3);
    
    const contextString = matches
      .map((match) => match.metadata?.text as string)
      .filter(Boolean)
      .join('\n\n');

    const prompt = `Answer the question based only on the provided context.

Context:
${contextString}

Question:
${Body}`;

    // 3. Groq API Call (Non-streaming for Webhook)
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
        stream: false, // Must be false for Webhook so we can get the full reply
      }),
    });

    if (!grokResponse.ok) {
      throw new Error('Failed to get response from Grok');
    }

    const grokData = await grokResponse.json();
    const aiReply = grokData.choices[0]?.message?.content || 'Sorry, I am unable to respond at this time.';

    // Optional: Log the outgoing message
    await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        tenant_id: tenantId as string,
        sender: 'ai',
        content: aiReply as string
      }
    });

    // 4. Send Response (Simple TwiML)
    // Twilio expects Content-Type text/xml for TwiML
    const twimlResponse = `
      <Response>
        <Message>${aiReply}</Message>
      </Response>
    `;

    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twimlResponse.trim());

  } catch (error) {
    console.error('WhatsApp Webhook Error:', error);
    // Even on error, return valid TwiML so the user gets feedback
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(`
      <Response>
        <Message>We are experiencing technical difficulties. Please try again later.</Message>
      </Response>
    `.trim());
  }
};

export const handleEmailWebhook = async (req: Request, res: Response): Promise<void> => {
  // Webhooks from services like SendGrid or Postmark usually send JSON
  const { from, subject, text, to } = req.body;

  if (!from || !subject || !text || !to) {
    res.status(400).json({ error: 'Missing required email fields' });
    return;
  }

  try {
    // 1. Tenant Identification
    // Assuming 'to' email contains a specific tenant identifier, e.g. support+tenant_api_key@yoursaas.com
    // Or we could map domain to tenant
    // For simplicity, let's say the tenant's ID is passed in the URL (like WhatsApp)
    // OR we just find the first tenant (if single tenant demo) or rely on a routing query parameter
    const tenantId = req.query.tenantId as string;
    
    if (!tenantId) {
      res.status(400).json({ error: 'Missing tenantId query parameter' });
      return;
    }

    // 2. Conversation Handling
    // Using sender email as the session identifier
    let conversation = await prisma.conversation.findUnique({
      where: { session_id: from }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          tenant_id: tenantId,
          session_id: from,
          customer_name: from.split('@')[0], // Quick guess at name
          customer_email: from
        }
      });
    }

    // Save the raw email as a message in the conversation
    await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        tenant_id: tenantId,
        sender: 'user',
        content: `Subject: ${subject}\n\n${text}`
      }
    });

    // 3. Ticket Creation
    // All incoming emails are escalated to tickets by default
    const ticket = await prisma.ticket.create({
      data: {
        tenant_id: tenantId,
        conversation_id: conversation.id,
        query_summary: `[EMAIL] ${subject}: ${text.substring(0, 200)}`,
        priority: "high", // Emails treated as high priority
        status: "open"
      }
    });

    // 4. (Optional) AI Handling:
    // We could run RAG here and auto-reply, but since it's an email, 
    // it's safer to just log the ticket for human review to avoid spamming the user.
    // Setting is_human_takeover ensures the dashboard picks it up properly.
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { is_human_takeover: true }
    });

    res.status(200).json({ message: 'Email processed and ticket created', ticketId: ticket.id });
  } catch (error) {
    console.error('Email Webhook Error:', error);
    res.status(500).json({ error: 'Internal server error processing email' });
  }
};
