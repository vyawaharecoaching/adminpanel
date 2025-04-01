import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_API_KEY || '';

// Validate that we have the required credentials
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your environment variables.');
  process.exit(1);
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Function to initialize Supabase
export async function initSupabase() {
  try {
    // Test the connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      throw error;
    }
    
    console.log('[supabase] Connected to Supabase successfully');
    return true;
  } catch (error) {
    console.error('[supabase] Error connecting to Supabase:', error);
    return false;
  }
}