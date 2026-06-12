import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export interface AuthRequest extends Request {
  user?: {
    userId?: string;
    tenantId: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  // 1. Check for API Key in headers or query parameters (used by Widget/Public API)
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (apiKey && typeof apiKey === 'string') {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { api_key: apiKey },
      });

      if (!tenant) {
        res.status(401).json({ error: 'Invalid API key' });
        return;
      }

      // Attach tenantId to the request object
      req.user = { tenantId: tenant.id };
      return next();
    } catch (error) {
      console.error('API Key validation error:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
  }

  // 2. Fallback to JWT validation (used by Dashboard/Admin API)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access denied, token or API key missing!' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; tenantId: string };
    
    if (!decoded.tenantId) {
      res.status(403).json({ error: 'Invalid token: missing tenant identification' });
      return;
    }

    req.user = decoded;
    return next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
    return;
  }
};
