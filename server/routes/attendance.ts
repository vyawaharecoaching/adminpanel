import { Router } from 'express';
import { getAttendance } from '../controllers/attendance';

const router = Router();

router.get('/', getAttendance);

export default router; 