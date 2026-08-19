import { Router } from 'express';
import { getChannels, getChannelMessages, postChannelMessage, patchChannelMessage, clearChannelMessages } from '../controllers/channelController';
import { authenticateToken } from '../middlewares/auth';
import { apiLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.use(apiLimiter);

router.get('/', getChannels);
router.get('/:channelId/messages', getChannelMessages);
router.post('/:channelId/messages', authenticateToken, postChannelMessage);
router.patch('/:channelId/messages/:messageId', authenticateToken, patchChannelMessage);
router.delete('/:channelId/messages', authenticateToken, clearChannelMessages);

export default router;
