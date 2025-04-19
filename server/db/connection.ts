import { createClient } from '@supabase/supabase-js';
import { log } from '../vite';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xbsocbjsmrnkwntmfere.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhic29jYmpzbXJua3dudG1mZXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2ODgyMTgsImV4cCI6MjA1OTI2NDIxOH0.H__Dla0lmkv8RKsR2jUzPUQX12QM5phsLhC1vWEQEmc';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Connect to Supabase
export async function connectToDatabase() {
  try {
    // Test the connection by making a simple query
    const { data, error } = await supabase.from('_tables').select('*').limit(1);
    
    if (error) {
      throw error;
    }
    
    log('Connected to Supabase database', 'supabase');
    return supabase;
  } catch (error) {
    log(`Supabase connection error: ${error}`, 'supabase');
    throw error;
  }
}

// No need for disconnect function as Supabase handles connections automatically
export async function disconnectFromDatabase() {
  log('Supabase connection is managed automatically', 'supabase');
}