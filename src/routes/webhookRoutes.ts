import { Router } from 'express';
import { handleWhatsappWebhook, handleEmailWebhook } from '../controllers/webhookController';

const router = Router();

// Twilio will hit this endpoint when a WhatsApp message is received
// Note: We don't use 'authenticateToken' here because Twilio doesn't send our JWT or API key natively
// We identify the tenant via the URL parameter instead
router.post('/whatsapp/:tenantId', handleWhatsappWebhook);

// Email Providers (Resend/SendGrid/Postmark) will hit this endpoint
router.post('/email', handleEmailWebhook);

export default router;
