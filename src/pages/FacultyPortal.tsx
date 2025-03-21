
import React, { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SessionContext } from "../App";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  User, 
  FileText, 
  LogOut,
  Package,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  ArrowUpDown
} from "lucide-react";

// Type for request with related transaction
type RequestWithTransaction = {
  id: string;
  student_name: string;
  student_number: string;
  contact_number: string;
  home_address: string;
  purpose: string;
  status: string;
  created_at: string;
  pickup_date: string | null;
  processed_by: string | null;
  notes: string | null;
  
  transcript_selected: boolean;
  certificate_selected: boolean;
  certification_selected: boolean;
  others_selected: boolean;
  
  // Transaction data
  transaction?: {
    id: string;
    amount: number;
    payment_status: string;
    payment_method: string | null;
    created_at: string;
  };
};

const FacultyPortal: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useContext(SessionContext);
  const [userProfile, setUserProfile] = useState<{
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    isFaculty: boolean;
  }>({
    name: null,
    email: null,
    avatarUrl: null,
    isFaculty: false
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<RequestWithTransaction | null>(null);
  const [pickupDate, setPickupDate] = useState<Date | undefined>(undefined);
  const [processingNotes, setProcessingNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Check if user is faculty
  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }

    const checkUserRole = async () => {
      const { user } = session;
      
      // Get user metadata from session
      const name = user.user_metadata.name || user.user_metadata.full_name;
      const email = user.email;
      const avatarUrl = user.user_metadata.avatar_url;
      
      // Check if user has faculty role
      const { data, error } = await supabase.rpc(
        'has_role',
        { user_id: user.id, role: 'faculty' }
      );
      
      if (error) {
        console.error("Error checking faculty role:", error);
        toast.error("Failed to verify faculty access");
        navigate('/dashboard');
        return;
      }
      
      const isFaculty = data || false;
      
      if (!isFaculty) {
        toast.error("You don't have faculty access");
        navigate('/dashboard');
        return;
      }
      
      // Set user profile
      setUserProfile({
        name,
        email,
        avatarUrl,
        isFaculty
      });
    };
    
    checkUserRole();
  }, [session, navigate]);

  // Fetch requests with payment status "awaiting_pickup"
  const { data: requests = [], isLoading, error, refetch } = useQuery({
    queryKey: ['faculty-requests'],
    queryFn: async () => {
      try {
        const { data: requestsData, error: requestsError } = await supabase
          .from('requests')
          .select('*')
          .eq('status', 'awaiting_pickup')
          .order('created_at', { ascending: false });
        
        if (requestsError) throw requestsError;
        
        // Fetch transactions for these requests
        const requestIds = requestsData.map(req => req.id);
        
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .in('request_id', requestIds);
        
        if (transactionsError) throw transactionsError;
        
        // Combine requests with their transactions
        const requestsWithTransactions = requestsData.map(request => {
          const transaction = transactionsData.find(t => t.request_id === request.id);
          return {
            ...request,
            transaction
          };
        });
        
        return requestsWithTransactions as RequestWithTransaction[];
      } catch (err) {
        console.error("Failed to fetch faculty requests:", err);
        toast.error("Failed to load requests. Please try again.");
        return [];
      }
    },
    enabled: !!userProfile.isFaculty,
    refetchOnWindowFocus: false,
  });

  // Handle errors from React Query
  useEffect(() => {
    if (error) {
      toast.error("Failed to load requests. Please try again.");
      console.error("Request fetch error:", error);
    }
  }, [error]);

  // Force refetch when visiting the page
  useEffect(() => {
    refetch();
  }, [refetch]);

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

  // Format date to a more readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get request type as a formatted string
  const getRequestType = (request: RequestWithTransaction): string => {
    const types = [];
    if (request.transcript_selected) types.push("Transcript of Records");
    if (request.certificate_selected) types.push("Certificate of Grades");
    if (request.certification_selected) types.push("Certification");
    if (request.others_selected) types.push("Others");
    
    return types.join(", ");
  };

  // Filter requests based on search term
  const filteredRequests = requests.filter(request => 
    request.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    getRequestType(request).toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.student_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle processing a request
  const processRequest = (request: RequestWithTransaction) => {
    setSelectedRequest(request);
    setProcessingNotes("");
    setPickupDate(undefined);
    setDialogOpen(true);
  };

  // Handle confirming the pickup date and processing
  const confirmProcessing = async () => {
    if (!selectedRequest || !pickupDate) {
      toast.error("Please select a pickup date");
      return;
    }

    try {
      // Update the request status
      const { error } = await supabase
        .from('requests')
        .update({
          status: 'approved',
          pickup_date: pickupDate.toISOString().split('T')[0],
          processed_by: session?.user?.id,
          notes: processingNotes || null
        })
        .eq('id', selectedRequest.id);
      
      if (error) throw error;
      
      toast.success("Request processed successfully");
      setDialogOpen(false);
      refetch();
    } catch (err) {
      console.error("Error processing request:", err);
      toast.error("Failed to process request. Please try again.");
    }
  };

  if (!userProfile.isFaculty) {
    return <div>Checking faculty access...</div>;
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
          <span className="mt-1 px-2 py-1 bg-amber-500 text-xs rounded-full">Faculty</span>
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
              <Link to="/faculty" className="flex items-center p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <Package className="w-5 h-5 mr-3" />
                Faculty Portal
              </Link>
            </li>
            <li>
              <Link to="/requests" className="flex items-center p-2 rounded-lg hover:bg-white/20 transition-colors">
                <FileText className="w-5 h-5 mr-3" />
                My Requests
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
            <h1 className="text-3xl font-bold">Faculty Portal</h1>
            <div className="flex gap-2">
              <Button 
                onClick={() => refetch()} 
                variant="outline"
                className="mr-2"
              >
                Refresh
              </Button>
            </div>
          </div>
          <p className="text-gray-600 mt-2">Process and schedule pickups for student record requests</p>
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
            <p>Loading requests...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-10 border border-gray-200 text-center">
            <div className="text-red-500 mb-4">
              <XCircle className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Error loading requests</h3>
            <p className="text-gray-600 mb-6">There was a problem loading the requests.</p>
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
              <Card key={request.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{request.student_name}</CardTitle>
                      <CardDescription>Student Number: {request.student_number}</CardDescription>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      <Package className="w-3 h-3 mr-1" />
                      Awaiting Pickup Schedule
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Request Details</h4>
                      <p className="text-sm mb-1"><span className="font-medium">Type:</span> {getRequestType(request)}</p>
                      <p className="text-sm mb-1"><span className="font-medium">Purpose:</span> {request.purpose}</p>
                      <p className="text-sm mb-1"><span className="font-medium">Requested:</span> {formatDate(request.created_at)}</p>
                      <p className="text-sm mb-1"><span className="font-medium">Contact:</span> {request.contact_number}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Payment Information</h4>
                      <p className="text-sm mb-1">
                        <span className="font-medium">Amount:</span> ₱{request.transaction?.amount.toFixed(2) || 'N/A'}
                      </p>
                      <p className="text-sm mb-1">
                        <span className="font-medium">Payment Method:</span> {request.transaction?.payment_method || 'N/A'}
                      </p>
                      <p className="text-sm mb-1">
                        <span className="font-medium">Payment Status:</span> 
                        <span className="text-green-600 ml-1">
                          {request.transaction?.payment_status === 'successful' ? 'Paid' : request.transaction?.payment_status || 'N/A'}
                        </span>
                      </p>
                      <p className="text-sm mb-1">
                        <span className="font-medium">Payment Date:</span> {request.transaction ? formatDate(request.transaction.created_at) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-end">
                  <Button 
                    onClick={() => processRequest(request)} 
                    className="bg-[#0047AB] hover:bg-[#00377e]"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Schedule Pickup
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-10 border border-gray-200 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No requests to process</h3>
            <p className="text-gray-600 mb-6">There are no pending requests waiting for pickup scheduling.</p>
          </div>
        )}
      </div>

      {/* Processing Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Schedule Pickup</DialogTitle>
            <DialogDescription>
              Set a pickup date for the student to collect their documents.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Student: {selectedRequest?.student_name}</h4>
              <p className="text-sm text-gray-500">Request: {selectedRequest ? getRequestType(selectedRequest) : ''}</p>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="pickupDate">Select Pickup Date</Label>
              <div className="border rounded-md mt-1">
                <Calendar
                  mode="single"
                  selected={pickupDate}
                  onSelect={setPickupDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
              </div>
              {pickupDate && (
                <p className="text-sm text-gray-500 mt-2">
                  Pickup scheduled for: {format(pickupDate, 'PPP')}
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <Label htmlFor="notes">Processing Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Add notes for this request..."
                className="mt-1"
                value={processingNotes}
                onChange={(e) => setProcessingNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmProcessing} className="bg-[#0047AB] hover:bg-[#00377e]">
              Confirm Pickup Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacultyPortal;
