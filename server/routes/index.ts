import express from 'express';
import { getAttendance } from '../api/attendance';

const router = express.Router();

router.get('/attendance', getAttendance);

export default router; 