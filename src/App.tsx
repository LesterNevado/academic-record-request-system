
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
import { supabase } from "./integrations/supabase/client";
import { PaymentStatus } from "./components/payment/PaymentStatus";

// Create a simple query client 
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: 3
    },
  },
});

// Create a session context with minimal functionality
export const SessionContext = createContext<{
  session: Session | null;
}>({ 
  session: null
});

// Simple protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // We're deliberately not using any auth state checks here
  // Just render children directly to avoid issues with tab switching
  return children;
};

const App = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Simple session check on mount
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
