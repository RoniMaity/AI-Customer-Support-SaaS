import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../db';

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    res.status(401).json({ error: 'Unauthorized: Missing tenant context' });
    return;
  }

  try {
    // ALWAYS ENFORCE TENANT ISOLATION
    // Never do `prisma.conversation.findMany()` without the where clause
    const conversations = await prisma.conversation.findMany({
      where: {
        tenant_id: tenantId,
      },
      orderBy: {
        id: 'desc', // Simple sorting, normally would use a created_at timestamp
      },
      take: 50, // Keep simple limit
    });

    res.json(conversations);
  } catch (error) {
    console.error('Fetch conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    res.status(401).json({ error: 'Unauthorized: Missing tenant context' });
    return;
  }

  try {
    // ALWAYS ENFORCE TENANT ISOLATION
    const tickets = await prisma.ticket.findMany({
      where: {
        tenant_id: tenantId,
      },
      orderBy: {
        id: 'desc',
      },
      take: 50,
    });

    res.json(tickets);
  } catch (error) {
    console.error('Fetch tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getConversationMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  const tenantId = req.user?.tenantId;
  const id = req.params.id as string;

  if (!tenantId || !id) {
    res.status(401).json({ error: 'Unauthorized or invalid request' });
    return;
  }

  try {
    const conversation = await prisma.conversation.findFirst({
      where: { session_id: id, tenant_id: tenantId }
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { conversation_id: conversation.id },
      orderBy: { timestamp: 'asc' }
    });

    res.json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
