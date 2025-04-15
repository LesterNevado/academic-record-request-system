
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
import EmployeePortal from "./pages/EmployeePortal";
import EmployeeLogs from "./pages/EmployeeLogs";
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

// Update UserRole to match the database enum - we don't have 'employee' in the DB
export type UserRole = 'student' | 'faculty' | 'admin';
// We'll use this internally to represent both 'faculty' and 'employee' as the same role for display
export type DisplayRole = 'student' | 'employee' | 'admin';

export const SessionContext = createContext<{
  session: Session | null;
  userRoles?: UserRole[];
}>({ 
  session: null
});

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: UserRole; // Using the DB enum type for role checks
  restrictedRoles?: UserRole[]; // Using the DB enum type for role checks
};

const ProtectedRoute = ({ children, requiredRole, restrictedRoles }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasRole, setHasRole] = useState<boolean | null>(null);
  const [isRestricted, setIsRestricted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        // Check if user is authenticated
        const { data: sessionData } = await supabase.auth.getSession();
        const isAuth = !!sessionData.session;
        setIsAuthenticated(isAuth);
        
        if (isAuth && sessionData.session) {
          // Fetch all user roles
          const { data: roles, error: rolesError } = await supabase.rpc(
            'get_user_roles',
            { user_id: sessionData.session.user.id }
          );
          
          if (rolesError) {
            console.error("Error fetching roles:", rolesError);
            toast.error(`Error fetching roles: ${rolesError.message}`);
            setUserRoles([]);
          } else {
            console.log("User roles for route protection:", roles);
            setUserRoles(roles || []);
          }
          
          // Handle required role check
          if (requiredRole) {
            // Specifically check for the required role
            const hasRequiredRole = roles ? roles.includes(requiredRole) : false;
            setHasRole(hasRequiredRole);
          } else {
            // If no specific role is required, set hasRole to true
            setHasRole(true);
          }
          
          // Check if user has any restricted roles
          if (restrictedRoles && restrictedRoles.length > 0) {
            const hasRestrictedRole = roles ? 
              restrictedRoles.some(role => roles.includes(role)) : 
              false;
            setIsRestricted(hasRestrictedRole);
          } else {
            setIsRestricted(false);
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        setHasRole(false);
        setIsRestricted(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [requiredRole, restrictedRoles]);
  
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
  
  if (isRestricted) {
    toast.error(`This page is not accessible with your current role`);
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
};

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      
      if (data.session) {
        // Fetch user roles
        const { data: roles, error } = await supabase.rpc(
          'get_user_roles',
          { user_id: data.session.user.id }
        );
        
        if (error) {
          console.error("Error fetching roles:", error);
        } else {
          setUserRoles(roles || []);
        }
      }
    };
    
    checkSession();
  }, []);

  return (
    <SessionContext.Provider value={{ session, userRoles }}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/request" element={
                <ProtectedRoute restrictedRoles={['faculty', 'admin']}>
                  <RequestForm />
                </ProtectedRoute>
              } />
              <Route path="/requests" element={
                <ProtectedRoute restrictedRoles={['faculty', 'admin']}>
                  <Requests />
                </ProtectedRoute>
              } />
              <Route path="/employee" element={<ProtectedRoute requiredRole="faculty"><EmployeePortal /></ProtectedRoute>} />
              <Route path="/employee/logs" element={<ProtectedRoute requiredRole="faculty"><EmployeeLogs /></ProtectedRoute>} />
              <Route path="/faculty" element={<Navigate to="/employee" replace />} />
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminPage /></ProtectedRoute>} />
              <Route path="/payment-status" element={
                <ProtectedRoute restrictedRoles={['faculty', 'admin']}>
                  <PaymentStatus />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </SessionContext.Provider>
  );
};

export default App;
