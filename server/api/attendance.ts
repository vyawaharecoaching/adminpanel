import { supabase } from "../db/connection";
import { Request, Response } from "express";

export const getAttendance = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', date);

    if (error) {
      console.error('Error fetching attendance:', error);
      return res.status(500).json({ error: 'Failed to fetch attendance data' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error in attendance endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 