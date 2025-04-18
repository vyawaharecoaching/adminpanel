import { Request, Response } from 'express';
import { prisma } from '../db';

export const getAttendance = async (req: Request, res: Response) => {
  try {
    const attendance = await prisma.attendance.findMany({
      include: {
        student: true,
        course: true
      }
    });
    
    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
}; 