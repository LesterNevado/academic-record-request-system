import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, createContext } from "react";
import { supabase } from "./integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import RequestForm from "./pages/RequestForm";
import Requests from "./pages/Requests";
import { toast } from "sonner";

// Create a more persistent query client with longer caching and better retry logic
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
      retryDelay: attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
      refetchOnReconnect: true,
      keepPreviousData: true,
    },
  },
});

// Create a session context to share session state across components
export const SessionContext = createContext<{
  session: Session | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
}>({ 
  session: null, 
  loading: true,
  refreshSession: async () => {}
});

// Auth-aware route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const refreshSession = async () => {
    try {
      setLoading(true);
      console.log("Manually refreshing session...");
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Error refreshing session:", error);
        setSessionError(error);
        return;
      }
      
      if (data.session) {
        console.log("Session successfully refreshed");
        setSession(data.session);
        setSessionError(null);
      } else {
        console.log("No session found during refresh");
        setSession(null);
      }
    } catch (error) {
      console.error("Unexpected error during session refresh:", error);
      setSessionError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Keep track of the last active time to detect long inactivity periods
    let lastActiveTime = Date.now();
    const INACTIVITY_THRESHOLD = 10 * 60 * 1000; // 10 minutes
    
    const updateLastActiveTime = () => {
      lastActiveTime = Date.now();
    };

    // Get initial session
    const initializeSession = async () => {
      try {
        console.log("Initializing session...");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting initial session:", error);
          setSessionError(error);
          setLoading(false);
          return;
        }
        
        if (data.session) {
          console.log("Initial session found:", data.session.user.email);
          setSession(data.session);
        } else {
          console.log("No initial session found");
          setSession(null);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Unexpected error during session initialization:", error);
        setSessionError(error as Error);
        setLoading(false);
      }
    };

    initializeSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change event:", event);
        
        if (event === 'SIGNED_IN' && session) {
          const email = session.user?.email;
          
          if (email && !email.endsWith('@neu.edu.ph')) {
            console.log("Non-NEU email detected:", email);
            toast.error("Only @neu.edu.ph email addresses are allowed to access this system.");
            await supabase.auth.signOut();
            setSession(null);
          } else {
            // Check if this user has a profile in the database
            const { data, error } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', session.user.id)
              .maybeSingle();

            if (error) {
              console.error("Error checking user profile:", error);
              toast.error("An error occurred while verifying your account.");
              await supabase.auth.signOut();
              setSession(null);
            } else if (!data) {
              console.error("User profile not found");
              toast.error("Your account is not registered in the system.");
              await supabase.auth.signOut();
              setSession(null);
            } else {
              setSession(session);
              toast.success(`Welcome ${session.user.user_metadata.name || session.user.email}`);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          toast.info("You have been signed out.");
          // When signing out, invalidate all queries to force a refetch when signing back in
          queryClient.invalidateQueries();
        } else if (event === 'TOKEN_REFRESHED') {
          // Update the session when the token is refreshed
          console.log("Token refreshed, updating session");
          setSession(session);
        } else {
          setSession(session);
        }
        setLoading(false);
      }
    );

    // Add a visibility change listener to refresh session when tab becomes visible
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // Check if session should be refreshed due to inactivity
        const currentTime = Date.now();
        const inactiveTime = currentTime - lastActiveTime;
        
        if (inactiveTime > INACTIVITY_THRESHOLD) {
          console.log(`Tab visible after ${inactiveTime/1000}s inactivity, refreshing session`);
          await refreshSession();
        } else {
          console.log(`Tab visible after ${inactiveTime/1000}s, no refresh needed`);
        }
        
        updateLastActiveTime();
      }
    };

    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      window.addEventListener(event, updateLastActiveTime);
    });
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Add a periodic session refresh check every 4 minutes
    const refreshInterval = setInterval(async () => {
      try {
        // Only refresh if the page is visible and user is active
        if (document.visibilityState === 'visible') {
          console.log("Performing periodic session refresh check");
          await refreshSession();
        }
      } catch (error) {
        console.error("Error during periodic session refresh:", error);
      }
    }, 4 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateLastActiveTime);
      });
    };
  }, []);

  // Auto-retry session initialization when there's an error
  useEffect(() => {
    if (sessionError && retryCount < MAX_RETRIES) {
      const timer = setTimeout(() => {
        console.log(`Retrying session initialization (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        setRetryCount(prev => prev + 1);
        refreshSession();
      }, 1000 * (retryCount + 1)); // Exponential backoff

      return () => clearTimeout(timer);
    }
  }, [sessionError, retryCount]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0047AB] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">Reconnecting... (attempt {retryCount}/{MAX_RETRIES})</p>
          )}
        </div>
      </div>
    );
  }

  // Handle persistent session errors
  if (sessionError && retryCount >= MAX_RETRIES) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-4">Connection Error</h2>
          <p className="text-gray-600 mb-6">
            We're having trouble connecting to the authentication service. This could be due to network issues.
          </p>
          <div className="space-y-4">
            <button 
              onClick={() => {
                setRetryCount(0);
                setSessionError(null);
                refreshSession();
              }}
              className="w-full px-4 py-2 bg-[#0047AB] text-white rounded-lg hover:bg-[#003d91] transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return (
    <SessionContext.Provider value={{ session, loading, refreshSession }}>
      {children}
    </SessionContext.Provider>
  );
};

// For public routes that redirect to dashboard when authenticated
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error checking session on public route:", error);
        }
        setSession(data.session);
        setLoading(false);
      } catch (error) {
        console.error("Unexpected error checking session on public route:", error);
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0047AB] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/request" element={<ProtectedRoute><RequestForm /></ProtectedRoute>} />
          <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
