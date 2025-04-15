
import React, { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, User, FileText, LogOut, Package, ShieldCheck, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SessionContext } from "@/App";

type SidebarProps = {
  userProfile: {
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
  userRoles: string[];
  loading: boolean;
};

export const Sidebar: React.FC<SidebarProps> = ({ userProfile, userRoles, loading }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useContext(SessionContext);

  // Check if user is a student (no special roles or only has 'student' role)
  const isStudent = userRoles.length === 0 || (userRoles.length === 1 && userRoles.includes('student'));
  // Check if user is an employee/faculty
  const isEmployee = userRoles.includes('faculty');
  // Check if user is an admin
  const isAdmin = userRoles.includes('admin');

  const handleSignOut = async () => {
    try {
      // Only attempt to log sign out activity for faculty users
      if (session?.user?.id && isEmployee) {
        try {
          await supabase.rpc(
            'log_activity',
            { 
              p_user_id: session.user.id, 
              p_activity_type: 'sign_out',
              p_details: `User signed out - ${userProfile.email || 'Unknown email'}`
            }
          );
        } catch (logError) {
          console.error("Error logging sign out activity:", logError);
          // Continue with sign out even if logging fails
        }
      }
      
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
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Helper function to display role name correctly
  const displayRoleName = (role: string): string => {
    if (role === 'faculty') return 'Employee';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="w-64 bg-[#0047AB] text-white p-6 flex flex-col min-h-screen h-full sticky top-0">
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
        
        {/* Role badges - Always displayed prominently */}
        <div className="mt-2 flex flex-wrap gap-1 justify-center">
          {userRoles.map((role) => (
            <span key={role} className={`px-2 py-1 text-xs rounded-full ${
              role === 'admin' ? 'bg-red-500' : 
              role === 'faculty' ? 'bg-amber-500' : 
              'bg-blue-500'
            }`}>
              {displayRoleName(role)}
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
            <Link 
              to="/dashboard" 
              className={`flex items-center p-2 rounded-lg hover:bg-white/20 transition-colors ${
                isActive('/dashboard') ? 'bg-white/10' : ''
              }`}
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
          </li>
          
          {/* Employee links */}
          {isEmployee && (
            <>
              <li>
                <Link 
                  to="/employee" 
                  className={`flex items-center p-2 rounded-lg hover:bg-white/20 transition-colors ${
                    isActive('/employee') || isActive('/faculty') ? 'bg-white/10' : ''
                  }`}
                >
                  <Package className="w-5 h-5 mr-3" />
                  Employee Portal
                </Link>
              </li>
              {/* Always show Activity Logs for employees */}
              <li>
                <Link 
                  to="/employee/logs" 
                  className={`flex items-center p-2 rounded-lg hover:bg-white/20 transition-colors ${
                    isActive('/employee/logs') ? 'bg-white/10' : ''
                  }`}
                >
                  <ClipboardList className="w-5 h-5 mr-3" />
                  Activity Logs
                </Link>
              </li>
            </>
          )}
          
          {isAdmin && (
            <li>
              <Link 
                to="/admin" 
                className={`flex items-center p-2 rounded-lg hover:bg-white/20 transition-colors ${
                  isActive('/admin') ? 'bg-white/10' : ''
                }`}
              >
                <ShieldCheck className="w-5 h-5 mr-3" />
                Admin Portal
              </Link>
            </li>
          )}
          
          {/* Only show Requests link for students */}
          {isStudent && (
            <li>
              <Link 
                to="/requests" 
                className={`flex items-center p-2 rounded-lg hover:bg-white/20 transition-colors ${
                  isActive('/requests') ? 'bg-white/10' : ''
                }`}
              >
                <FileText className="w-5 h-5 mr-3" />
                Requests
              </Link>
            </li>
          )}
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
  );
};
