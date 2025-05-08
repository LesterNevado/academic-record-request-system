import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FileText, 
  LogOut,
  ChevronRight,
  ChevronLeft,
  Package,
  ClipboardList,
  ShieldCheck
} from "lucide-react";
import { Button } from "../ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SidebarProps {
  userProfile: {
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
  userRoles: string[];
  onSignOut: () => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function getHighestRole(userRoles: string[]): string {
  if (userRoles.includes("admin")) return "Admin";
  if (userRoles.includes("faculty")) return "Employee";
  return "Student";
}

export function Sidebar({ userProfile, userRoles, onSignOut, collapsed, setCollapsed }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const highestRole = getHighestRole(userRoles);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear any local storage or state
      localStorage.clear();
      sessionStorage.clear();
      
      // Show success message
      toast.success('Successfully signed out');
      
      // Navigate to root path (login page)
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  // Determine menu items based on roles
  let menuItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" }
  ];
  if (userRoles.includes("faculty")) {
    menuItems.push(
      { title: "Employee Portal", icon: Package, href: "/employee" },
      { title: "Activity Logs", icon: ClipboardList, href: "/employee/logs" }
    );
  } else if (userRoles.includes("admin")) {
    menuItems.push(
      { title: "Admin Portal", icon: ShieldCheck, href: "/admin" }
    );
  } else {
    // Default/student
    menuItems.push(
      { title: "My Requests", icon: FileText, href: "/requests" }
    );
  }

  // Role badge color
  const roleBadgeColor = highestRole === "Admin"
    ? "bg-gradient-to-r from-green-500 to-green-700 text-white"
    : highestRole === "Employee"
    ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
    : "bg-gradient-to-r from-blue-400 to-blue-600 text-white";

  return (
    <div className={cn(
      "fixed left-0 top-0 h-screen border-r border-blue-100 transition-all duration-300 z-50 bg-gradient-to-b from-blue-700 to-blue-500 overflow-x-hidden",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className={cn(
          "border-b border-blue-100 transition-all duration-300",
          collapsed ? "p-0 flex flex-col items-center justify-center h-20" : "p-4"
        )}>
          <div className={cn(
            collapsed ? "flex flex-col items-center justify-center h-full w-full" : "flex items-center justify-between"
          )}>
            {!collapsed && (
              <div className="flex items-center gap-3">
                <img
                  src="/neu-logo.png"
                  alt="NEU Logo"
                  className="h-10 w-10 rounded-full border-2 border-gray-200 shadow bg-white"
                  style={{ background: 'white' }}
                />
                <span className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
                  NEU<span className="text-blue-200">-ARRS</span>
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-lg transition-all",
                collapsed
                  ? "mx-auto my-auto flex items-center justify-center hover:bg-white/20"
                  : "ml-auto hover:bg-white/20"
              )}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4 text-white transition-transform" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-blue-200 transition-transform" />
              )}
            </Button>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-blue-100">
          <div className={cn(
            "gap-3 flex flex-col items-center justify-center"
          )}>
            <div className="relative">
              {userProfile && userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt="Profile"
                  className="w-12 h-12 min-w-[3rem] min-h-[3rem] max-w-[3rem] max-h-[3rem] rounded-full object-cover border-2 border-white shadow"
                />
              ) : (
                <div className="w-12 h-12 min-w-[3rem] min-h-[3rem] max-w-[3rem] max-h-[3rem] rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white text-xl font-bold">
                  {userProfile && userProfile.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 text-center">
                <p className="text-base font-semibold text-white truncate">
                  {userProfile && userProfile.name || "User"}
                </p>
                <p className="text-xs text-blue-100 truncate">
                  {userProfile && userProfile.email || "user@example.com"}
                </p>
                <span className={cn(
                  "mt-1.5 inline-block px-3 py-0.5 rounded-full text-xs font-semibold shadow-sm",
                  roleBadgeColor
                )}>
                  {highestRole}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 p-4 space-y-1.5 overflow-y-auto overflow-x-hidden",
          collapsed ? "flex flex-col items-center" : ""
        )}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 font-medium",
                  collapsed ? "justify-center" : "",
                  isActive
                    ? "bg-white/20 text-white shadow-md"
                    : "text-white hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 min-w-[1.25rem] min-h-[1.25rem] text-white transition-colors duration-200",
                  isActive ? "text-white" : "text-white/80 group-hover:text-white"
                )} />
                {!collapsed && (
                  <span className="text-sm font-medium">{item.title}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={cn(
          "p-4 border-t border-blue-100 transition-all duration-300",
          "bg-gradient-to-r from-blue-700 to-blue-500",
          collapsed ? "flex justify-center items-center" : ""
        )}>
          <Button
            variant="ghost"
            className={cn(
              "gap-3 text-white transition-all text-sm py-2.5 font-medium rounded-lg px-4 hover:bg-white/20 hover:text-white focus:outline-none",
              collapsed ? "" : "w-[90%] mx-auto justify-start"
            )}
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 text-white transition-colors duration-200" />
            {!collapsed && <span className="text-sm font-medium text-white">Sign Out</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}
