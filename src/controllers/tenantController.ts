import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../db';

export const getBotConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    res.status(401).json({ error: 'Unauthorized access' });
    return;
  }

  try {
    const config = await prisma.botConfig.findUnique({
      where: { tenant_id: tenantId },
    });

    if (!config) {
      res.status(404).json({ error: 'Bot configuration not found' });
      return;
    }

    res.json(config);
  } catch (error) {
    console.error('Fetch config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
