import { Router } from 'express';
import evolutionRoutes from './evolution/evolution.routes';

const router = Router();

router.use('/evolution', evolutionRoutes);
// router.use('/meta', metaRoutes); // To be implemented later

export default router;
