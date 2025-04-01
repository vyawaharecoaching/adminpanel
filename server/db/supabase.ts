import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Function to create and export Supabase client
function setupSupabase() {
  // Get Supabase credentials from environment variables
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_API_KEY || '';
  let client: any = null;
  
  // Check if Supabase credentials are available
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Please check your environment variables.');
    process.exit(1);
  }

  // Validate URL format - warn but don't exit if invalid
  if (!supabaseUrl.startsWith('https://')) {
    console.warn('Invalid Supabase URL format. URL must start with https://');
    console.warn('Current value:', supabaseUrl);
    console.warn('Continuing with in-memory storage...');
    // Set environment variable to use in-memory storage instead
    process.env.USE_SUPABASE = 'false';
    
    // Create a dummy client that will fail gracefully
    client = {
      from: () => ({ 
        select: () => ({ data: null, error: { message: 'Invalid Supabase URL' } })
      })
    };
  } else {
    // Create Supabase client
    // IMPORTANT: For this to work without RLS issues, SUPABASE_API_KEY must be a service role key
    client = createClient(supabaseUrl, supabaseKey, {
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
  }

  return client;
}

// Create client
export const supabase = setupSupabase();

// Function to initialize Supabase
export async function initSupabase() {
  try {
    // If we're using in-memory storage, return false
    if (process.env.USE_SUPABASE === 'false') {
      return false;
    }
    
    // Test the connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      throw error;
    }
    
    console.log('[supabase] Connected to Supabase successfully');
    return true;
  } catch (error) {
    console.error('[supabase] Error connecting to Supabase:', error);
    process.env.USE_SUPABASE = 'false';
    return false;
  }
}