import { Router } from 'express';
import { handleChat, escalateToHuman, adminReply } from '../controllers/chatController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Endpoint for streaming chat responses from Grok
// Uses the authentication middleware to secure the endpoint
router.post('/', authenticateToken, handleChat);
router.post('/escalate', authenticateToken, escalateToHuman);
router.post('/admin/reply', authenticateToken, adminReply);

export default router;
