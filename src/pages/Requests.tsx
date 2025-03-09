
import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SessionContext } from "../App";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  User, 
  FileText, 
  LogOut,
  PlusCircle,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpDown
} from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

// Define the Request type properly
type Request = {
  id: string;
  student_name: string;
  student_number: string;
  contact_number: string;
  home_address: string;
  purpose: string;
  created_at: string;
  status: string;
  user_id: string;
  transcript_selected: boolean;
  transcript_copies: number | null;
  certificate_selected: boolean;
  certificate_copies: number | null;
  certification_selected: boolean;
  certification_copies: number | null;
  certification_details: string | null;
  others_selected: boolean;
  others_copies: number | null;
  others_details: string | null;
};

const Requests: React.FC = () => {
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
  const [searchTerm, setSearchTerm] = useState("");

  // Update user profile whenever session changes
  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }

    // Get user metadata from session
    const { user } = session;
    const name = user.user_metadata.name || user.user_metadata.full_name;
    const email = user.email;
    const avatarUrl = user.user_metadata.avatar_url;

    // Set user profile
    setUserProfile({
      name,
      email,
      avatarUrl
    });
  }, [session, navigate]);

  // Use React Query to fetch requests, which handles caching and refetching
  const { data: requests = [], isLoading, error, refetch } = useQuery({
    queryKey: ['requests', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      try {
        console.log("Fetching requests for user:", session.user.id);
        const { data, error } = await supabase
          .from('requests')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching requests:", error);
          throw error;
        }
        
        console.log("Fetched requests:", data);
        return data as Request[];
      } catch (err) {
        console.error("Error in request fetch function:", err);
        throw err;
      }
    },
    enabled: !!session?.user?.id,
    refetchOnWindowFocus: true,
    staleTime: 30000 // Consider data stale after 30 seconds
  });

  // Handle errors from React Query
  useEffect(() => {
    if (error) {
      toast.error("Failed to load your requests. Please try again.");
      console.error("Request fetch error:", error);
    }
  }, [error]);

  // Force refetch when visiting the page
  useEffect(() => {
    if (session?.user?.id) {
      console.log("Refetching requests on page load");
      refetch();
    }
  }, [refetch, session]);

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

  // Get request type as a formatted string
  const getRequestType = (request: Request): string => {
    const types = [];
    if (request.transcript_selected) types.push("Transcript of Records");
    if (request.certificate_selected) types.push("Certificate of Grades");
    if (request.certification_selected) types.push("Certification");
    if (request.others_selected) types.push("Others");
    
    return types.join(", ");
  };

  // Format date to a more readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Filter requests based on search term
  const filteredRequests = requests.filter(request => 
    request.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    getRequestType(request).toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.student_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        </div>
        
        <nav className="flex-1">
          <ul className="space-y-4">
            <li>
              <Link to="/dashboard" className="flex items-center p-2 rounded-lg hover:bg-white/20 transition-colors">
                <LayoutDashboard className="w-5 h-5 mr-3" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/requests" className="flex items-center p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
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
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-10">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">My Requests</h1>
            <Button 
              onClick={() => navigate("/request")} 
              className="bg-[#0047AB] hover:bg-[#00377e]"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </div>
          <p className="text-gray-600 mt-2">View and manage your academic record requests</p>
        </header>

        {/* Search and filter */}
        <div className="mb-6 flex space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0047AB]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" className="flex items-center">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            Sort
          </Button>
        </div>

        {/* Request Cards */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-10 border border-gray-200 text-center">
            <p>Loading your requests...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-10 border border-gray-200 text-center">
            <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Error Loading Requests</h3>
            <p className="text-gray-600 mb-6">There was a problem loading your requests.</p>
            <Button 
              onClick={() => refetch()} 
              className="bg-[#0047AB] hover:bg-[#00377e]"
            >
              Try Again
            </Button>
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredRequests.map((request) => (
              <div 
                key={request.id} 
                className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:border-[#0047AB] transition-colors"
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{request.student_name}</h3>
                    <p className="text-gray-600 text-sm">Type: {getRequestType(request)}</p>
                    <p className="text-gray-600 text-sm">Student Number: {request.student_number}</p>
                    <p className="text-gray-600 text-sm">Submitted: {formatDate(request.created_at)}</p>
                  </div>
                  <div className="flex items-center">
                    {request.status === 'pending' && (
                      <span className="flex items-center text-amber-600">
                        <Clock className="w-4 h-4 mr-1" />
                        Pending
                      </span>
                    )}
                    {request.status === 'approved' && (
                      <span className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approved
                      </span>
                    )}
                    {request.status === 'rejected' && (
                      <span className="flex items-center text-red-600">
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-10 border border-gray-200 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No requests found</h3>
            <p className="text-gray-600 mb-6">You haven't submitted any record requests yet.</p>
            <Button 
              onClick={() => navigate("/request")} 
              className="bg-[#0047AB] hover:bg-[#00377e]"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Your First Request
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Requests;
