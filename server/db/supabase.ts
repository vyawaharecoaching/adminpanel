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

// Validate URL format - ensure it starts with https://
if (!supabaseUrl.startsWith('https://')) {
  console.error('Invalid Supabase URL format. URL must start with https://');
  console.error('Current value:', supabaseUrl);
  process.exit(1);
}

// Create Supabase client
// IMPORTANT: For this to work without RLS issues, SUPABASE_API_KEY must be a service role key
// If you're hitting RLS errors, make sure you're using the service role key, not the anon key
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  // Enable row-level security bypass
  // This works only with a service role key
  db: {
    schema: 'public'
  }
});

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