import { Router } from 'express';
import { getProfile, updateSettings, getMemories, removeMemory } from './controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/profile', getProfile);
router.get('/me', getProfile);
router.put('/settings', updateSettings);
router.get('/memories', getMemories);
router.delete('/memories/:id', removeMemory);

export default router;
