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

// Fetch a single student by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('students').select('*').eq('id', id).single();
  if (error) return res.status(404).json({ error: error.message });
  res.json({ data });
});

// Insert a new student
router.post('/', async (req, res) => {
  const { data, error } = await supabase.from('students').insert([req.body]);
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ data });
});

export default router;
