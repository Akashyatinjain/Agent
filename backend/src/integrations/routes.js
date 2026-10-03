import { Router } from 'express';
import { getConnectedChannels, startChannelLink, disconnectChannel } from './controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/channels', getConnectedChannels);
router.post('/channels/link', startChannelLink);
router.delete('/channels/:channelType', disconnectChannel);

export default router;
