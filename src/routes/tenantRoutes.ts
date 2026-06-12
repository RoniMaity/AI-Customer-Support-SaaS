import { Router } from 'express';
import { getBotConfig } from '../controllers/tenantController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Secure all tenant routes with JWT middleware
router.use(authenticateToken);

router.get('/config', getBotConfig);

export default router;
