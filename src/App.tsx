import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import { toast } from "sonner";

const queryClient = new QueryClient();

// Auth-aware route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Check email domain on initial load
        const email = session.user?.email;
        if (email && !email.endsWith('@neu.edu.ph')) {
          console.log("Non-NEU email detected on initial load:", email);
          
          // First show toast
          toast.error("Only @neu.edu.ph email addresses are allowed to access this system.");
          
          // Then sign out - this must be in a timeout to ensure the toast is shown
          setTimeout(async () => {
            await supabase.auth.signOut();
            setSession(null);
          }, 100);
        } else {
          setSession(session);
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change event:", event);
        console.log("Session:", session?.user?.email);
        
        if (event === 'SIGNED_IN' && session) {
          const email = session.user?.email;
          
          if (email && !email.endsWith('@neu.edu.ph')) {
            console.log("Non-NEU email detected:", email);
            
            // First show toast
            toast.error("Only @neu.edu.ph email addresses are allowed to access this system.");
            
            // Then sign out - this must be in a timeout to ensure the toast is shown
            setTimeout(async () => {
              await supabase.auth.signOut();
              setSession(null);
            }, 100);
          } else {
            // Check if this user has a profile in the database
            const { error } = await supabase
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
        } else {
          setSession(session);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
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
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
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
      <Sonner position="top-center" closeButton={true} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
