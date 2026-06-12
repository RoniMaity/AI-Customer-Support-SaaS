import { Router } from 'express';
import { handleChat, escalateToHuman } from '../controllers/chatController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Endpoint for streaming chat responses from Grok
// Uses the authentication middleware to secure the endpoint
router.post('/', authenticateToken, handleChat);
router.post('/escalate', authenticateToken, escalateToHuman);

export default router;
