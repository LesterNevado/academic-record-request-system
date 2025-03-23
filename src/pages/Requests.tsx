
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
  ArrowUpDown,
  Package,
  Calendar,
  MessageCircle
} from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { Sidebar } from "@/components/layout/Sidebar";

type Request = Tables<"requests"> & {
  transcript_selected: boolean;
  certificate_selected: boolean;
  certification_selected: boolean;
  others_selected: boolean;
  processor_name?: string | null;
};

const Requests: React.FC = () => {
  const navigate = useNavigate();
  const { session, userRoles = [] } = useContext(SessionContext);
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
  const [isLoading, setIsLoading] = useState(false);

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
  const { data: requests = [], isLoading: requestsLoading, error, refetch } = useQuery({
    queryKey: ['requests', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) {
        console.log("No user ID found for requests query");
        return [];
      }
      
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
        
        // Get processor names for approved requests
        const requestsWithProcessorNames = await Promise.all((data || []).map(async (request) => {
          if (request.processed_by) {
            const { data: processorName } = await supabase.rpc(
              'get_processor_name',
              { processor_id: request.processed_by }
            );
            return { ...request, processor_name: processorName };
          }
          return request;
        }));
        
        console.log("Requests data:", requestsWithProcessorNames);
        return (requestsWithProcessorNames || []) as Request[];
      } catch (err) {
        console.error("Failed to fetch requests:", err);
        toast.error("Failed to load your requests. Please try again.");
        return [];
      }
    },
    enabled: !!session?.user?.id,
    refetchOnWindowFocus: false, // Don't refetch on window focus
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
    refetch();
  }, [refetch]);

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

  // Filter requests based on search term - safely check for arrays and objects
  const filteredRequests = Array.isArray(requests) 
    ? requests.filter(request => 
        request.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        getRequestType(request).toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.student_number.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Add a manual refresh function
  const handleManualRefresh = async () => {
    try {
      refetch();
      toast.success("Refreshed successfully");
    } catch (err) {
      console.error("Failed to refresh:", err);
      toast.error("Failed to refresh. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar using the new component */}
      <Sidebar 
        userProfile={userProfile} 
        userRoles={userRoles} 
        loading={isLoading} 
      />
      
      {/* Main Content */}
      <div className="flex-1 p-10">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">My Requests</h1>
            <div className="flex gap-2">
              <Button 
                onClick={handleManualRefresh} 
                variant="outline"
                className="mr-2"
              >
                Refresh
              </Button>
              <Button 
                onClick={() => navigate("/request")} 
                className="bg-[#0047AB] hover:bg-[#00377e]"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </div>
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
        {requestsLoading ? (
          <div className="bg-white rounded-lg shadow p-10 border border-gray-200 text-center">
            <p>Loading your requests...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-10 border border-gray-200 text-center">
            <div className="text-red-500 mb-4">
              <XCircle className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Error loading requests</h3>
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
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{request.student_name}</h3>
                    <p className="text-gray-600 text-sm">Type: {getRequestType(request)}</p>
                    <p className="text-gray-600 text-sm">Student Number: {request.student_number}</p>
                    <p className="text-gray-600 text-sm">Submitted: {formatDate(request.created_at)}</p>
                    
                    {/* Show processor info and pickup date for approved requests */}
                    {request.status === 'approved' && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-gray-600 text-sm"><span className="font-medium">Processed by:</span> {request.processor_name || 'Staff Member'}</p>
                        {request.pickup_date && (
                          <p className="text-gray-600 text-sm"><span className="font-medium">Pickup Date:</span> {formatDate(request.pickup_date)}</p>
                        )}
                        {request.notes && (
                          <div className="mt-2">
                            <p className="text-gray-600 text-sm font-medium flex items-center">
                              <MessageCircle className="w-3 h-3 mr-1" /> Notes:
                            </p>
                            <p className="text-gray-600 text-sm pl-4 mt-1 italic">{request.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-start ml-4">
                    {request.status === 'pending' && (
                      <span className="flex items-center text-amber-600">
                        <Clock className="w-4 h-4 mr-1" />
                        Pending
                      </span>
                    )}
                    {request.status === 'awaiting_pickup' && (
                      <span className="flex flex-col items-end text-yellow-600">
                        <Package className="w-4 h-4 mb-1" />
                        <span>Payment Successful</span>
                        <span>Waiting for Approval</span>
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
