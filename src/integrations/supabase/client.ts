
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://wkwlvbjnliddjqbuqzdp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indrd2x2YmpubGlkZGpxYnVxemRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NTI3MTIsImV4cCI6MjA1NTAyODcxMn0.QRt1-USUO2U-r_SK5WQPCJTzdvEGJq8FcZ1oDsqTXu0";

// Create a Supabase client with simple, reliable configuration
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'neu-arrs-auth-storage-key' // Use a specific storage key
  },
  global: {
    headers: {
      'Content-Type': 'application/json' // Always set Content-Type header
    }
  }
});
