
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

// Create a more persistent query client with longer caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
      retryDelay: attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
    },
  },
});

// Create a session context to share session state across components
export const SessionContext = createContext<{
  session: Session | null;
  loading: boolean;
}>({ session: null, loading: true });

// Auth-aware route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session ? "Signed in" : "No session");
      setSession(session);
      setLoading(false);
    });

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

    // Add a periodic session refresh check every 3 minutes
    const refreshInterval = setInterval(async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.log("Periodic session refresh check");
          setSession(data.session);
        } else {
          console.log("No session found during periodic check");
          // If we suddenly don't have a session, make sure we update state correctly
          setSession(null);
        }
      } catch (error) {
        console.error("Error during session refresh:", error);
      }
    }, 3 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
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

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

// For public routes that redirect to dashboard when authenticated
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

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
