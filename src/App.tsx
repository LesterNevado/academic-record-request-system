
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, createContext, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import RequestForm from "./pages/RequestForm";
import Requests from "./pages/Requests";
import FacultyPortal from "./pages/FacultyPortal";
import AdminPage from "./pages/AdminPage";
import { supabase } from "./integrations/supabase/client";
import { PaymentStatus } from "./components/payment/PaymentStatus";
import { toast } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: 3
    },
  },
});

export const SessionContext = createContext<{
  session: Session | null;
}>({ 
  session: null
});

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: 'faculty' | 'admin'; // Optional role requirement
};

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasRole, setHasRole] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        // Check if user is authenticated
        const { data: sessionData } = await supabase.auth.getSession();
        const isAuth = !!sessionData.session;
        setIsAuthenticated(isAuth);
        
        // If a specific role is required and user is authenticated, check for that role
        if (requiredRole && isAuth && sessionData.session) {
          const { data, error } = await supabase.rpc(
            'has_role',
            { user_id: sessionData.session.user.id, role: requiredRole }
          );
          
          if (error) {
            console.error("Error checking role:", error);
            toast.error(`Error checking role: ${error.message}`);
            setHasRole(false);
          } else {
            console.log(`Has ${requiredRole} role:`, data);
            setHasRole(!!data);
          }
        } else if (!requiredRole) {
          // If no specific role is required, set hasRole to true
          setHasRole(true);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        setHasRole(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [requiredRole]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0047AB] mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  if (requiredRole && !hasRole) {
    toast.error(`You don't have ${requiredRole} access`);
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
};

const App = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    
    checkSession();
  }, []);

  return (
    <SessionContext.Provider value={{ session }}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/request" element={<ProtectedRoute><RequestForm /></ProtectedRoute>} />
              <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
              <Route path="/faculty" element={<ProtectedRoute requiredRole="faculty"><FacultyPortal /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminPage /></ProtectedRoute>} />
              <Route path="/payment-status" element={<ProtectedRoute><PaymentStatus /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </SessionContext.Provider>
  );
};

export default App;
