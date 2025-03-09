
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://wkwlvbjnliddjqbuqzdp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indrd2x2YmpubGlkZGpxYnVxemRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NTI3MTIsImV4cCI6MjA1NTAyODcxMn0.QRt1-USUO2U-r_SK5WQPCJTzdvEGJq8FcZ1oDsqTXu0";

// Create a Supabase client with enhanced session persistence
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: {
      // Use local storage as the primary storage method
      getItem: (key) => {
        try {
          const value = localStorage.getItem(key);
          return value;
        } catch (error) {
          console.error('Error getting auth session from storage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Error storing auth session:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing auth session from storage:', error);
        }
      },
    }
  },
  global: {
    fetch: (url, options) => {
      return fetch(url, { 
        ...options,
        signal: AbortSignal.timeout(30000), // 30 seconds timeout
        // Add cache control headers to prevent caching of auth endpoints
        headers: {
          ...options?.headers,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }
  }
});

// Add a visibility change listener to refresh the session when tab becomes visible again
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      // When tab becomes visible again, refresh the session
      try {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('Failed to refresh session on visibility change:', error);
        } else {
          console.log('Session refreshed on visibility change');
        }
      } catch (err) {
        console.error('Error refreshing session on visibility change:', err);
      }
    }
  });
}
