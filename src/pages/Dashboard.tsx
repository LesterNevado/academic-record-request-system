
import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Layout, 
  LayoutDashboard, 
  User, 
  FileText, 
  Settings, 
  LogOut 
} from "lucide-react";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
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

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#0047AB] text-white p-6">
        <div className="flex items-center mb-10">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/e3c6b0ec50df45b58e99e24af78e19b0/496ecc137f8c0eeb6c4acc7eae1c9701ab567695346929631763cd049528af73?placeholderIfAbsent=true"
            alt="NEU Logo"
            className="w-12 h-12 mr-3"
          />
          <h1 className="text-xl font-bold">NEU ARRS</h1>
        </div>
        
        <nav>
          <ul className="space-y-4">
            <li>
              <a href="#" className="flex items-center p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <LayoutDashboard className="w-5 h-5 mr-3" />
                Dashboard
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center p-2 rounded-lg hover:bg-white/20 transition-colors">
                <User className="w-5 h-5 mr-3" />
                Profile
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center p-2 rounded-lg hover:bg-white/20 transition-colors">
                <FileText className="w-5 h-5 mr-3" />
                Requests
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center p-2 rounded-lg hover:bg-white/20 transition-colors">
                <Settings className="w-5 h-5 mr-3" />
                Settings
              </a>
            </li>
          </ul>
        </nav>
        
        <div className="mt-auto pt-20">
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="w-full flex items-center justify-center text-white border-white hover:bg-white/20 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-10">
        <header className="mb-10">
          <h1 className="text-3xl font-bold">Welcome to the Academic Record Request System</h1>
          <p className="text-gray-600 mt-2">Manage and track your academic record requests</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Pending Requests</h2>
              <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center font-bold">0</div>
            </div>
            <p className="text-gray-600">You have no pending requests</p>
            <Button className="mt-4 w-full bg-[#0047AB] hover:bg-[#00377e]">New Request</Button>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Approved Requests</h2>
              <div className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center font-bold">0</div>
            </div>
            <p className="text-gray-600">You have no approved requests</p>
            <Button className="mt-4 w-full bg-[#0047AB] hover:bg-[#00377e]">View History</Button>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Account</h2>
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600">Complete your profile to speed up future requests</p>
            <Button className="mt-4 w-full bg-[#0047AB] hover:bg-[#00377e]">Edit Profile</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
