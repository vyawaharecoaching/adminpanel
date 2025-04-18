import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xbsocbjsmrnkwntmfere.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhic29jYmpzbXJua3dudG1mZXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2ODgyMTgsImV4cCI6MjA1OTI2NDIxOH0.H__Dla0lmkv8RKsR2jUzPUQX12QM5phsLhC1vWEQEmc" ;

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 