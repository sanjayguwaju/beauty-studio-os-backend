import { Router } from 'express';
import { getServices, getCourses, bookAppointment, enrollAcademy } from './public.controller';

const router = Router();

// Publicly accessible endpoints (No JWT required)
router.get('/services', getServices);
router.get('/courses', getCourses);
router.post('/book', bookAppointment);
router.post('/enroll', enrollAcademy);

export default router;
