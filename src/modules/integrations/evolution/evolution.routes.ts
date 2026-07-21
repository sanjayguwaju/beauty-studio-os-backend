import { Router } from 'express';
import { createInstance, getQRCode, sendMessage, webhookHandler, toggleBotStatus } from './evolution.controller';
import { authenticate } from '../../../middleware/auth.middleware';

const router = Router();

// Protected routes (Tenant Admin / Staff)
router.post('/instance/create', authenticate, createInstance);
router.get('/instance/qrcode', authenticate, getQRCode);
router.post('/messages/send', authenticate, sendMessage);
router.patch('/conversations/:conversationId/bot-status', authenticate, toggleBotStatus);

// Public Webhook route (Evolution API calls this)
router.post('/webhook', webhookHandler);

export default router;
