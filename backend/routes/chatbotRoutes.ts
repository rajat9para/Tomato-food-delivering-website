import { Router } from 'express';
import * as chatbotController from '../controllers/chatbotController';

const router = Router();

// Public endpoints – no auth required so all users can chat
router.post('/chat', chatbotController.chatWithBot);
router.get('/health', chatbotController.chatbotHealth);

export default router;
