import { Router } from 'express';
import {
  sendMessage,
  getConversations,
  getConversationById,
  renameConversation,
  deleteConversation
} from './controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/message', sendMessage);
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversationById);
router.patch('/conversations/:id', renameConversation);
router.delete('/conversations/:id', deleteConversation);

export default router;
