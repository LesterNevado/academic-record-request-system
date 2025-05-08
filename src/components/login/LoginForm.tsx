import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const LoginForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const STRIPE_PUBLISHABLE_KEY = "pk_test_51R2SPX4SH5jlvHudJgu05MgpuZ4xIV5RO5YlmQfbkXgpN4BpkDIwAKOicjXtmB6sw0nubD1hafbVS4E0qCppW5Eu00JgZ4yPGS";

  // Check if we're on the login page
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear any local storage or state
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect to login page
      navigate('/login');
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            hd: 'neu.edu.ph'
          },
        },
      });

      if (error) {
        throw error;
      }

      // If the user cancels the sign-in, they'll stay on the login page
      if (!data?.url) {
        setIsLoading(false);
        return;
      }

      // Only redirect if we have a valid URL
      window.location.href = data.url;
      
    } catch (err) {
      console.error("Error during Google login:", err);
      toast.error("Failed to sign in with Google. Please try again.");
      setIsLoading(false);
    }
  };

  // Make Stripe publishable key available globally
  useEffect(() => {
    (window as any).STRIPE_PUBLISHABLE_KEY = STRIPE_PUBLISHABLE_KEY;
  }, []);

  return (
    <div className="relative flex items-center justify-center min-h-screen w-full">
      {/* Card Container */}
      <div className="w-full max-w-md relative">
        {/* Floating Shapes Background */}
        <div className="absolute -z-10 top-20 -left-20 w-40 h-40 bg-blue-500/20 rounded-full filter blur-xl animate-pulse"></div>
        <div className="absolute -z-10 bottom-10 right-0 w-32 h-32 bg-blue-600/10 rounded-full filter blur-xl animate-pulse delay-700"></div>
        <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-400/10 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        
        {/* Glass Card */}
        <div className="bg-white/5 backdrop-filter backdrop-blur-lg border border-blue-300/20 rounded-3xl overflow-hidden shadow-2xl">
          {/* Wave Pattern Top */}
          <div className="h-24 bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 relative">
            <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 120">
              <path fill="rgba(255,255,255,0.05)" d="M0,96L48,101.3C96,107,192,117,288,106.7C384,96,480,64,576,58.7C672,53,768,75,864,90.7C960,107,1056,117,1152,106.7C1248,96,1344,64,1392,48L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
          
          {/* Content */}
          <div className="px-8 pt-8 pb-10">
            {/* Logo */}
            <div className="flex justify-center -mt-16 mb-8">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-400 p-1 shadow-lg shadow-blue-500/20 rotate-3 transform hover:rotate-0 transition-transform duration-300">
                <div className="bg-blue-900 rounded-xl flex items-center justify-center h-full overflow-hidden">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets/e3c6b0ec50df45b58e99e24af78e19b0/496ecc137f8c0eeb6c4acc7eae1c9701ab567695346929631763cd049528af73?placeholderIfAbsent=true"
                    alt="NEU Logo"
                    className="w-16 h-16"
                  />
                </div>
              </div>
            </div>
            
            {/* Text Content */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-100 to-blue-300 bg-clip-text text-transparent">Welcome to NEU-ARRS!</h1>
              <p className="text-blue-200/60 mt-2">New Era University</p>
              <p className="text-blue-200/60 mt-2">Academic Records Request System</p>
            </div>
            
            {/* Divider */}
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-blue-300/10"></div>
              <span className="flex-shrink mx-3 text-blue-200/40 text-sm">Log in to continue</span>
              <div className="flex-grow border-t border-blue-300/10"></div>
            </div>
            
            {/* Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:translate-y-0 group relative overflow-hidden"
            >
              {/* Button Background Animation */}
              <div className="absolute inset-0 w-full h-full group-hover:animate-shine bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"></div>
              
              {/* Button Content */}
              <div className="flex items-center justify-center gap-3">
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#4285F4"/>
                        <path d="M3.15295 7.3455L6.43845 9.755C7.32745 7.554 9.48045 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15895 2 4.82795 4.1685 3.15295 7.3455Z" fill="#EA4335"/>
                        <path d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.5717 17.5742 13.3037 18.001 12 18C9.39903 18 7.19053 16.3415 6.35853 14.027L3.09753 16.5395C4.75253 19.778 8.11353 22 12 22Z" fill="#34A853"/>
                        <path d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#4285F4"/>
                      </svg>
                    </div>
                    <span>Sign in with Google</span>
                  </>
                )}
              </div>
            </button>
            
            {/* Policy Links */}
            <div className="mt-8 text-center text-xs text-blue-200/40 space-y-2">
              <p>Only accounts with @neu.edu.ph domain are allowed</p>
              <div className="flex justify-center space-x-3">
                <a href="#" className="hover:text-blue-300 transition-colors">Help</a>
                <span>•</span>
                <a href="#" className="hover:text-blue-300 transition-colors">Privacy</a>
                <span>•</span>
                <a href="#" className="hover:text-blue-300 transition-colors">Terms</a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="text-center mt-6 text-blue-200/30 text-xs">
          &copy; {new Date().getFullYear()} New Era University
        </div>
      </div>
    </div>
  );
};