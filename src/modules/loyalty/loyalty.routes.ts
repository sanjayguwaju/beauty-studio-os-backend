import { Router } from 'express';
import { getLoyaltyDashboard } from './loyalty.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/dashboard', getLoyaltyDashboard);

export default router;
