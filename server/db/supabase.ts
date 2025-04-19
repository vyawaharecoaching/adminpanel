import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Function to create and export Supabase client
function setupSupabase() {
  // Get Supabase credentials from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xbsocbjsmrnkwntmfere.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhic29jYmpzbXJua3dudG1mZXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2ODgyMTgsImV4cCI6MjA1OTI2NDIxOH0.H__Dla0lmkv8RKsR2jUzPUQX12QM5phsLhC1vWEQEmc';
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
    client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
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