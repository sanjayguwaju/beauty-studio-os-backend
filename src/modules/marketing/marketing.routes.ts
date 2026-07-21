import { Router } from 'express';
import { listCampaigns, createAndSendCampaign } from './marketing.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// All marketing routes require admin authentication
router.use(authenticate);

router.get('/', listCampaigns);
router.post('/', createAndSendCampaign);

export default router;
