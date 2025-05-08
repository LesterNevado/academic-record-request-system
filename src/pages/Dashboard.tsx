import React, { useContext, useEffect, useRef, useState } from "react";
import { SessionContext } from "@/App";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, ListTodo } from "lucide-react";
import { DashboardCards } from "@/components/dashboard/DashboardCards";

type UserRole = 'student' | 'faculty' | 'admin';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { session, userRoles } = useContext(SessionContext);

  // Local state for user profile and loading + counts.
  const [userProfile, setUserProfile] = useState<{
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  }>({
    name: null,
    email: null,
    avatarUrl: null,
  });
  const [loading, setLoading] = useState(true);
  const [requestCount, setRequestCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);

  // Local state to hold roles fetched in this component from supabase rpc.
  const [roles, setRoles] = useState<UserRole[]>(userRoles || []);

  // Use a ref to keep previous session user id to detect new login
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          navigate('/');
          return;
        }
        const { user } = data.session;
        const name = user.user_metadata.name || user.user_metadata.full_name || null;
        const email = user.email || null;
        const avatarUrl = user.user_metadata.avatar_url || null;

        setUserProfile({ name, email, avatarUrl });

        const { data: fetchedRoles, error: rolesError } = await supabase.rpc(
          'get_user_roles',
          { user_id: user.id }
        );
        if (rolesError) {
          toast.error(`Error fetching roles: ${rolesError.message}`);
        } else {
          setRoles(fetchedRoles || []);
        }

        if (
          !fetchedRoles ||
          (!fetchedRoles.includes('faculty') && !fetchedRoles.includes('admin'))
        ) {
          const { count, error } = await supabase
            .from('requests')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (!error) {
            setRequestCount(count || 0);
          }
        } else {
          const [{ count: pending = 0 } = {}, { count: approved = 0 } = {}] =
            await Promise.all([
              supabase
                .from('requests')
                .select('*', { count: 'exact', head: true })
                .in('status', ['pending', 'awaiting_pickup']),
              supabase
                .from('requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'approved'),
            ]);
          setPendingCount(pending ?? 0);
          setApprovedCount(approved ?? 0);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    getSession();
  }, [navigate]);

  useEffect(() => {
    async function logLoginActivity() {
      if (session?.user) {
        const loggedKey = `login_logged_${session.user.id}`;
        const alreadyLogged = sessionStorage.getItem(loggedKey);
        if (!alreadyLogged && prevUserIdRef.current !== session.user.id) {
          prevUserIdRef.current = session.user.id;
          try {
            const { data: logResult, error: logError } = await supabase.rpc(
              'log_activity',
              {
                p_user_id: session.user.id,
                p_activity_type: 'login',
                p_details: `User logged in - ${session.user.email}`,
                p_related_user_id: null,
                p_related_id: null,
              }
            );
            if (!logError) {
              sessionStorage.setItem(loggedKey, 'true');
            }
          } catch (err) {
            // Optionally handle error
          }
        }
      }
    }
    logLoginActivity();
  }, [session]);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(`Logout failed: ${error.message}`);
      } else {
        toast.success("Successfully logged out");
        navigate("/");
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Use local fetched roles `roles` for logic instead of context userRoles.
  const isStudent = roles.length === 0 || (roles.length === 1 && roles.includes('student'));
  const isEmployee = roles.includes('faculty');
  const isAdmin = roles.includes('admin');

  // Helper function to display role name correctly
  const displayRoleName = (role: string): string => {
    if (role === 'faculty') return 'Employee';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

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

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 lg:px-12">
        <header className="mb-10 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-6 mb-1">
            <div className="flex flex-col items-start">
              <h1 className="text-4xl font-black flex items-end gap-2 flex-wrap">
                <span className="text-black">Welcome,</span>
                <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent font-black">{userProfile.name || ''}</span>
                <span className="text-black">!</span>
              </h1>
            </div>
          </div>
          <p className="text-base text-slate-600 font-medium mt-3 tracking-wide">
            {isAdmin
              ? "Access the admin portal to manage users, roles, and system settings."
              : isEmployee
              ? "Process and verify student requests"
              : "Manage and track your academic record requests"}
          </p>
        </header>
        <div className="mt-8">
          <DashboardCards
            isStudent={isStudent}
            isEmployee={isEmployee}
            isAdmin={isAdmin}
            requestCount={requestCount}
            pendingCount={pendingCount}
            approvedCount={approvedCount}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
