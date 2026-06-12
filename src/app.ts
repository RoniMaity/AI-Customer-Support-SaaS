import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';
import tenantRoutes from './routes/tenantRoutes';
import ragRoutes from './routes/ragRoutes';
import chatRoutes from './routes/chatRoutes';
import webhookRoutes from './routes/webhookRoutes';
import { getConversations, getTickets } from './controllers/dashboardController';
import { authenticateToken } from './middleware/auth';

const app = express();

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Required for Twilio webhooks!

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/webhooks', webhookRoutes);

// Dashboard Routes
app.get('/api/conversations', authenticateToken, getConversations);
app.get('/api/tickets', authenticateToken, getTickets);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running smoothly' });
});

export default app;
