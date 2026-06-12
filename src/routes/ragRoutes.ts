import { Router } from 'express';
import multer from 'multer';
import { uploadDocument } from '../controllers/ragController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Configure multer to store file in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Using authenticateToken so only logged-in users/tenants can upload
router.post('/upload', authenticateToken, upload.single('file'), uploadDocument);

export default router;
