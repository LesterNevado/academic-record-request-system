
import React, { useEffect, useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/Sidebar";
import { SessionContext } from "@/App";

// FIXED: Lucide icon imports should be PascalCase
import { Activity, ListTodo } from "lucide-react";

type UserRole = 'student' | 'faculty' | 'admin';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useContext(SessionContext);

  const [userProfile, setUserProfile] = useState<{
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  }>({
    name: null,
    email: null,
    avatarUrl: null
  });
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestCount, setRequestCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          navigate('/');
          return;
        }
        // Get user metadata from session
        const { user } = data.session;
        const name = user.user_metadata.name || user.user_metadata.full_name;
        const email = user.email;
        const avatarUrl = user.user_metadata.avatar_url;

        setUserProfile({ name, email, avatarUrl });

        // Fetch user roles
        const { data: roles, error: rolesError } = await supabase.rpc(
          'get_user_roles',
          { user_id: user.id }
        );
        if (rolesError) {
          toast.error(`Error fetching roles: ${rolesError.message}`);
        } else {
          setUserRoles(roles || []);
        }

        // Only fetch request count for students
        if (!roles || (!roles.includes('faculty') && !roles.includes('admin'))) {
          const { count, error } = await supabase
            .from('requests')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (!error) {
            setRequestCount(count || 0);
          }
        } else {
          // For employee/admin, fetch counts for all requests (for summary)
          const [{ count: pending = 0 } = {}, { count: approved = 0 } = {}] = await Promise.all([
            supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
          ]);
          setPendingCount(pending ?? 0);
          setApprovedCount(approved ?? 0);
        }
      } catch (error) {
        console.error("Error getting session:", error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    getSession();
  }, [navigate]);

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

  // Check if user is a student
  const isStudent = userRoles.length === 0 || (userRoles.length === 1 && userRoles.includes('student'));
  const isEmployee = userRoles.includes('faculty');
  const isAdmin = userRoles.includes('admin');

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
    <div className="min-h-screen flex w-full">
      {/* Sidebar: use shared Sidebar component (per-app sidebar) */}
      <Sidebar userProfile={userProfile} userRoles={userRoles} loading={loading} />

      {/* Main Content */}
      <div className="flex-1 p-10">
        <header className="mb-10">
          <h1 className="text-3xl font-bold">Welcome{userProfile.name ? `, ${userProfile.name.split(' ')[0]}` : ''}!</h1>
          <p className="text-gray-600 mt-2">
            {isAdmin
              ? "Manage users and view requests in the system"
              : isEmployee
              ? "Process and verify student requests"
              : "Manage and track your academic record requests"}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Only show Requests card for students */}
          {isStudent && (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">My Requests</h2>
                  <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    {requestCount}
                  </div>
                </div>
                <p className="text-gray-600">
                  {requestCount > 0
                    ? `You have ${requestCount} request${requestCount !== 1 ? "s" : ""}`
                    : "You have no requests yet"}
                </p>
                <Button
                  onClick={() => navigate("/request")}
                  className="mt-4 w-full bg-[#0047AB] hover:bg-[#00377e]"
                >
                  New Request
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Employee/admin summary cards: show counts of pending and approved requests */}
          {(isEmployee || isAdmin) && (
            <>
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6 flex flex-col gap-3">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <span>Pending Requests</span>
                    </h2>
                    <div className="bg-yellow-100 text-yellow-800 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      {pendingCount}
                    </div>
                  </div>
                  <p className="text-gray-600">Requests awaiting approval</p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() =>
                      navigate(isEmployee ? '/employee' : '/admin')
                    }
                  >
                    View Requests
                  </Button>
                </CardContent>
              </Card>
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6 flex flex-col gap-3">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <span>Approved Requests</span>
                    </h2>
                    <div className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      {approvedCount}
                    </div>
                  </div>
                  <p className="text-gray-600">Requests that have been approved</p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() =>
                      navigate(isEmployee ? '/employee' : '/admin')
                    }
                  >
                    View Approved
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
