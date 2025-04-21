
import React, { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// Stripe publishable key - this is safe to include in frontend code
const STRIPE_PUBLISHABLE_KEY = "pk_test_51R2SPX4SH5jlvHudJgu05MgpuZ4xIV5RO5YlmQfbkXgpN4BpkDIwAKOicjXtmB6sw0nubD1hafbVS4E0qCppW5Eu00JgZ4yPGS";

export const LoginForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      console.log("Starting Google login...");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            hd: 'neu.edu.ph'
          }
        }
      });

      if (error) {
        toast.error(`Login failed: ${error.message}`);
        console.error("Google login error:", error);
      } else {
        // Only attempt to log activity for faculty users
        const session = await supabase.auth.getSession();
        console.log("Google sign-in success, checking session...", session);
        if (session.data.session?.user) {
          const userId = session.data.session.user.id;
          
          // Check if user has faculty role before attempting to log
          const { data: hasFacultyRole, error: facultyError } = await supabase.rpc(
            'has_role',
            { user_id: userId, role: 'faculty' }
          );
          console.log("Faculty role check result:", { hasFacultyRole, facultyError });
          
          if (hasFacultyRole && !facultyError) {
            try {
              console.log("User is faculty, attempting to log login activity...");
              const { data: logResult, error: logError } = await supabase.rpc(
                'log_activity',
                {
                  p_user_id: userId,
                  p_activity_type: 'login',
                  p_details: `User logged in - ${session.data.session.user.email}`,
                  p_related_user_id: null,
                  p_related_id: null
                }
              );
              if (logError) {
                console.error("Error logging login activity for faculty:", logError);
              } else {
                console.log("Successfully logged login activity for faculty user.", logResult);
              }
            } catch (logEx) {
              console.error("Exception during logging login activity:", logEx);
            }
          } else {
            console.log("User does NOT have 'faculty' role, skipping login activity logging.");
          }
        } else {
          console.log("Session has no user, cannot log activity.");
        }
      }
    } catch (err) {
      console.error("Unexpected error during login:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Make Stripe publishable key available globally
  React.useEffect(() => {
    // Use type assertion to avoid TypeScript error
    (window as any).STRIPE_PUBLISHABLE_KEY = STRIPE_PUBLISHABLE_KEY;
  }, []);

  return (
    <section className="w-6/12 max-md:w-full relative min-h-screen" aria-label="Login form">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0047AB] to-[#1CA9C9] scale-x-110 rounded-[40px_0px_0px_40px] max-md:rounded-none min-h-screen"></div>
      <div className="relative flex grow flex-col items-center justify-center px-20 py-[210.5px] max-md:max-w-full max-md:px-5 max-md:py-[100px] w-full min-h-screen">
        <div className="flex w-[400px] max-w-full flex-col items-center">
          <a href="https://www.neu.edu.ph/" target="_blank" rel="noopener noreferrer" className="self-center">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/e3c6b0ec50df45b58e99e24af78e19b0/496ecc137f8c0eeb6c4acc7eae1c9701ab567695346929631763cd049528af73?placeholderIfAbsent=true"
              alt="NEU Logo"
              className="aspect-[1] object-contain w-[100px] max-w-full cursor-pointer"
            />
          </a>

          <h1 className="text-white text-[35px] font-bold text-center mt-[100px] max-md:max-w-full max-md:mt-10 leading-tight">
            Welcome to
            <span className="block text-center whitespace-nowrap">Academic Record Request System</span>
            <span className="block text-center mt-0">(ARRS)</span>
          </h1>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="bg-white shadow-[0px_4px_4px_rgba(0,0,0,0.25)] border flex w-full flex-col text-xl text-black font-semibold justify-center mt-[80px] px-[47px] py-5 rounded-[20px] border-[rgba(0,0,0,0.2)] border-solid max-md:max-w-full max-md:mt-10 max-md:px-5 hover:bg-gray-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            aria-label="Sign in with Google"
          >
            <div className="flex items-stretch gap-[34px]">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/e3c6b0ec50df45b58e99e24af78e19b0/853685cd2d6bd5bcdb1e4bd4db33a67b0ac2f87224df786eb0451986d789067a?placeholderIfAbsent=true"
                alt="Google logo"
                className="aspect-[0.96] object-contain w-12 shrink-0"
              />
              <span className="basis-auto my-auto">
                {isLoading ? "Loading..." : "Continue with Google"}
              </span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};

