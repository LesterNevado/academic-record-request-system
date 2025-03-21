
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, User, FileText, LogOut, Package, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type UserRole = 'student' | 'faculty' | 'admin';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    // Simple function to get session once
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

        // Set user profile
        setUserProfile({
          name,
          email,
          avatarUrl
        });

        // Fetch user roles
        const { data: roles, error: rolesError } = await supabase.rpc(
          'get_user_roles',
          { user_id: user.id }
        );
        
        if (rolesError) {
          console.error("Error fetching roles:", rolesError);
          toast.error(`Error fetching roles: ${rolesError.message}`);
        } else {
          console.log("User roles:", roles);
          setUserRoles(roles || []);
        }

        // Fetch request count
        const { count, error } = await supabase
          .from('requests')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if (error) {
          console.error("Error fetching requests:", error);
        } else {
          setRequestCount(count || 0);
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
      console.error("Unexpected error during logout:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#0047AB] text-white p-6 flex flex-col">
        <div className="flex items-center mb-10">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/e3c6b0ec50df45b58e99e24af78e19b0/496ecc137f8c0eeb6c4acc7eae1c9701ab567695346929631763cd049528af73?placeholderIfAbsent=true"
            alt="NEU Logo"
            className="w-12 h-12 mr-3"
          />
          <h1 className="text-xl font-bold">NEU ARRS</h1>
        </div>
        
        {/* User Profile Section */}
        <div className="mb-6 flex flex-col items-center">
          {userProfile.avatarUrl ? (
            <img 
              src={userProfile.avatarUrl} 
              alt="Profile" 
              className="w-16 h-16 rounded-full mb-2 border-2 border-white"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-2">
              <User className="w-8 h-8" />
            </div>
          )}
          <p className="text-sm font-semibold text-center">{userProfile.name || "User"}</p>
          <p className="text-xs text-white/70 text-center">{userProfile.email}</p>
          <div className="mt-2 flex flex-wrap gap-1 justify-center">
            {userRoles.map((role) => (
              <span key={role} className={`px-2 py-1 text-xs rounded-full ${
                role === 'admin' ? 'bg-red-500' : 
                role === 'faculty' ? 'bg-amber-500' : 
                'bg-blue-500'
              }`}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
            ))}
            {userRoles.length === 0 && (
              <span className="px-2 py-1 bg-blue-500 text-xs rounded-full">
                Student
              </span>
            )}
          </div>
        </div>
        
        <nav className="flex-1">
          <ul className="space-y-4">
            <li>
              <Link to="/dashboard" className="flex items-center p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <LayoutDashboard className="w-5 h-5 mr-3" />
                Dashboard
              </Link>
            </li>
            
            {userRoles.includes('faculty') && (
              <li>
                <Link to="/faculty" className="flex items-center p-2 rounded-lg hover:bg-white/20 transition-colors">
                  <Package className="w-5 h-5 mr-3" />
                  Faculty Portal
                </Link>
              </li>
            )}
            
            {userRoles.includes('admin') && (
              <li>
                <Link to="/admin" className="flex items-center p-2 rounded-lg hover:bg-white/20 transition-colors">
                  <ShieldCheck className="w-5 h-5 mr-3" />
                  Admin Portal
                </Link>
              </li>
            )}
            
            <li>
              <Link to="/requests" className="flex items-center p-2 rounded-lg hover:bg-white/20 transition-colors">
                <FileText className="w-5 h-5 mr-3" />
                Requests
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="mt-auto">
          <Button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-center text-white bg-[#0047AB] border-2 border-white hover:bg-[#003d91]"
            disabled={loading}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {loading ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-10">
        <header className="mb-10">
          <h1 className="text-3xl font-bold">Welcome{userProfile.name ? `, ${userProfile.name.split(' ')[0]}` : ''}!</h1>
          <p className="text-gray-600 mt-2">Manage and track your academic record requests</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  ? `You have ${requestCount} request${requestCount !== 1 ? 's' : ''}`
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
          
          {/* Role-specific cards */}
          {userRoles.includes('faculty') && (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Faculty Portal</h2>
                  <Package className="w-6 h-6 text-amber-500" />
                </div>
                
                <p className="text-gray-600">
                  Process student requests and schedule pickups
                </p>
                
                <Button 
                  onClick={() => navigate("/faculty")} 
                  className="mt-4 w-full bg-amber-500 hover:bg-amber-600"
                >
                  Go to Faculty Portal
                </Button>
              </CardContent>
            </Card>
          )}
          
          {userRoles.includes('admin') && (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Admin Portal</h2>
                  <ShieldCheck className="w-6 h-6 text-red-500" />
                </div>
                
                <p className="text-gray-600">
                  Manage users, roles, and system settings
                </p>
                
                <Button 
                  onClick={() => navigate("/admin")} 
                  className="mt-4 w-full bg-red-500 hover:bg-red-600"
                >
                  Go to Admin Portal
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
