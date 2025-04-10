// server/api/student/route.ts
import { Router } from 'express';
import { supabase } from 'server/db/connection';

const router = Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('students').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

router.post('/', async (req, res) => {
  const { data, error } = await supabase.from('students').insert([req.body]);
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ data });
});

export default router;
