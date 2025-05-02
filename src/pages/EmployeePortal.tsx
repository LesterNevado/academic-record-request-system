import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SessionContext } from "../App";
import { useQuery } from "@tanstack/react-query";
import { 
  Package,
  Calendar as CalendarIcon,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  Mail,
  X,
  Check
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type RequestWithTransaction = {
  id: string;
  user_id: string;
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
  soa_selected: boolean;
  registration_form_selected: boolean;
  com_selected: boolean;
  coe_selected: boolean;
  coa_selected: boolean;
  others_selected: boolean;
  
  transaction?: {
    id: string;
    amount: number;
    payment_status: string;
    payment_method: string | null;
    created_at: string;
  };
};

type FilterState = {
  requestType: string[];
  paymentMethod: string | null;
};

const EmployeePortal: React.FC = () => {
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
  const [selectedRequest, setSelectedRequest] = useState<RequestWithTransaction | null>(null);
  const [pickupDate, setPickupDate] = useState<Date | undefined>(undefined);
  const [processingNotes, setProcessingNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [sortPopoverOpen, setSortPopoverOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    requestType: [],
    paymentMethod: null,
  });
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({
    key: 'created_at',
    direction: 'desc',
  });
  const [activeFilters, setActiveFilters] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  useEffect(() => {
    let count = 0;
    if (filters.requestType.length > 0) count++;
    if (filters.paymentMethod) count++;
    setActiveFilters(count);
  }, [filters]);

  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }

    const checkUserRole = async () => {
      setIsLoading(true);
      const { user } = session;
      
      const name = user.user_metadata.name || user.user_metadata.full_name;
      const email = user.email;
      const avatarUrl = user.user_metadata.avatar_url;
      
      const { data: hasFacultyRole, error: facultyError } = await supabase.rpc(
        'has_role',
        { user_id: user.id, role: 'faculty' }
      );
      
      if (facultyError) {
        console.error("Error checking faculty role:", facultyError);
        toast.error("Failed to verify employee access");
        navigate('/dashboard');
        return;
      }
      
      if (!hasFacultyRole) {
        toast.error("You don't have employee access");
        navigate('/dashboard');
        return;
      }
      
      setUserProfile({
        name,
        email,
        avatarUrl
      });
      
      setIsLoading(false);
    };
    
    checkUserRole();
  }, [session, navigate]);

  const { data: employeeRequests = [], isLoading: requestsLoading, error, refetch } = useQuery({
    queryKey: ['employee-requests-all'],
    queryFn: async () => {
      try {
        const { data: requestsData, error: requestsError } = await supabase
          .from('requests')
          .select('*')
          .in('status', ['awaiting_pickup', 'approved'])
          .order('created_at', { ascending: false });

        if (requestsError) throw requestsError;

        const requestIds = requestsData.map(req => req.id);

        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .in('request_id', requestIds);

        if (transactionsError) throw transactionsError;

        const requestsWithTransactions = requestsData.map(request => {
          const transaction = transactionsData.find(t => t.request_id === request.id);
          return {
            ...request,
            transaction
          };
        });

        return requestsWithTransactions as RequestWithTransaction[];
      } catch (err) {
        console.error("Failed to fetch employee requests:", err);
        toast.error("Failed to load requests. Please try again.");
        return [];
      }
    },
    enabled: !!session?.user?.id,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to load requests. Please try again.");
      console.error("Request fetch error:", error);
    }
  }, [error]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getRequestType = (request: RequestWithTransaction): string => {
    const types = [];
    if (request.transcript_selected) types.push("Transcript of Records");
    if (request.certificate_selected) types.push("Certificate of Grades");
    if (request.certification_selected) types.push("Certification");
    if (request.soa_selected) types.push("Statement of Account");
    if (request.registration_form_selected) types.push("Registration Form");
    if (request.com_selected) types.push("Certificate of Matriculation");
    if (request.coe_selected) types.push("Certificate of Enrollment");
    if (request.coa_selected) types.push("Certificate of No Availed Scholarship");
    if (request.others_selected) types.push("Others");
    
    return types.join(", ");
  };

  const applyFilters = (requests: RequestWithTransaction[]): RequestWithTransaction[] => {
    return requests.filter(request => {
      const matchesSearch = 
        request.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        getRequestType(request).toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.student_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      if (filters.requestType.length > 0) {
        const requestTypes = [];
        if (request.transcript_selected) requestTypes.push("transcript");
        if (request.certificate_selected) requestTypes.push("certificate");
        if (request.certification_selected) requestTypes.push("certification");
        if (request.soa_selected) requestTypes.push("statement");
        if (request.registration_form_selected) requestTypes.push("registration_form");
        if (request.com_selected) requestTypes.push("com");
        if (request.coe_selected) requestTypes.push("coe");
        if (request.coa_selected) requestTypes.push("coa");
        if (request.others_selected) requestTypes.push("others");
        
        const hasMatchingType = filters.requestType.some(type => requestTypes.includes(type));
        if (!hasMatchingType) return false;
      }
      
      if (filters.paymentMethod && request.transaction?.payment_method !== filters.paymentMethod) {
        return false;
      }
      
      return true;
    });
  };

  const applySorting = (requests: RequestWithTransaction[]): RequestWithTransaction[] => {
    return [...requests].sort((a, b) => {
      if (sortConfig.key === 'student_name') {
        return sortConfig.direction === 'asc' 
          ? a.student_name.localeCompare(b.student_name)
          : b.student_name.localeCompare(a.student_name);
      }
      
      if (sortConfig.key === 'created_at') {
        return sortConfig.direction === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const resetFilters = () => {
    setFilters({
      requestType: [],
      paymentMethod: null,
    });
    setFilterPopoverOpen(false);
  };

  const toggleRequestTypeFilter = (type: string) => {
    if (filters.requestType.includes(type)) {
      setFilters({
        ...filters,
        requestType: filters.requestType.filter(t => t !== type)
      });
    } else {
      setFilters({
        ...filters,
        requestType: [...filters.requestType, type]
      });
    }
  };

  const handleSortChange = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
    setSortPopoverOpen(false);
  };

  const filteredAndSortedRequests = applySorting(applyFilters(employeeRequests || []));

  const processRequest = (request: RequestWithTransaction) => {
    setSelectedRequest(request);
    setProcessingNotes("");
    setPickupDate(undefined);
    setDialogOpen(true);
  };

  const confirmProcessing = async () => {
    if (!selectedRequest || !pickupDate) {
      toast.error("Please select a pickup date");
      return;
    }

    try {
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

      if (session?.user?.id) {
        try {
          await supabase.rpc(
            'log_activity',
            { 
              p_user_id: session.user.id, 
              p_activity_type: 'schedule_pickup',
              p_details: `Scheduled pickup for request #${selectedRequest.id} - ${selectedRequest.student_name}`,
              p_related_id: selectedRequest.id,
              p_related_user_id: selectedRequest.user_id
            }
          );
        } catch (logError) {
          console.error("Error logging scheduling activity:", logError);
        }
      }
      
      toast("Sending email notification...", {
        description: "Processing notification email..."
      });
      
      try {
        await sendApprovalEmail(selectedRequest.id);
        
        toast.success("Email notification sent successfully");
      } catch (err) {
        toast.error("Failed to send email notification");
      }
      
      toast.success("Request processed successfully");
      setDialogOpen(false);
      refetch();
    } catch (err) {
      console.error("Error processing request:", err);
      toast.error("Failed to process request. Please try again.");
    }
  };

  const sendApprovalEmail = async (requestId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-approval-email', {
        body: { requestId }
      });
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Failed to send email notification:", err);
      throw err;
    }
  };

  const pendingRequests = employeeRequests.filter(r => r.status === 'awaiting_pickup');
  const approvedRequests = employeeRequests.filter(r => r.status === 'approved');

  return (
    <div className="min-h-screen flex">
      <Sidebar 
        userProfile={userProfile}
        userRoles={userRoles}
        loading={isLoading}
      />

      <div className="flex-1 p-10">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Employee Portal</h1>
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

        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'pending' | 'approved')} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Yet to be Approved</TabsTrigger>
            <TabsTrigger value="approved">Approved Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
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
              
              <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                    {activeFilters > 0 && (
                      <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium rounded-full px-2 py-0.5">
                        {activeFilters}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Filter Requests</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={resetFilters} 
                        className="text-xs"
                      >
                        Reset all
                      </Button>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Request Type</h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Checkbox 
                            id="type-transcript" 
                            checked={filters.requestType.includes('transcript')} 
                            onCheckedChange={() => toggleRequestTypeFilter('transcript')}
                          />
                          <label htmlFor="type-transcript" className="ml-2 text-sm cursor-pointer">
                            Transcript of Records
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox 
                            id="type-certificate" 
                            checked={filters.requestType.includes('certificate')} 
                            onCheckedChange={() => toggleRequestTypeFilter('certificate')}
                          />
                          <label htmlFor="type-certificate" className="ml-2 text-sm cursor-pointer">
                            Certificate of Grades
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox 
                            id="type-certification" 
                            checked={filters.requestType.includes('certification')} 
                            onCheckedChange={() => toggleRequestTypeFilter('certification')}
                          />
                          <label htmlFor="type-certification" className="ml-2 text-sm cursor-pointer">
                            Certification
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox 
                            id="type-statement" 
                            checked={filters.requestType.includes('statement')} 
                            onCheckedChange={() => toggleRequestTypeFilter('statement')}
                          />
                          <label htmlFor="type-statement" className="ml-2 text-sm cursor-pointer">
                            Statement of Account
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox 
                            id="type-registration_form" 
                            checked={filters.requestType.includes('registration_form')} 
                            onCheckedChange={() => toggleRequestTypeFilter('registration_form')}
                          />
                          <label htmlFor="type-registration_form" className="ml-2 text-sm cursor-pointer">
                            Registration Form
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox 
                            id="type-com" 
                            checked={filters.requestType.includes('com')} 
                            onCheckedChange={() => toggleRequestTypeFilter('com')}
                          />
                          <label htmlFor="type-com" className="ml-2 text-sm cursor-pointer">
                            Certificate of Matriculation
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox 
                            id="type-coe" 
                            checked={filters.requestType.includes('coe')} 
                            onCheckedChange={() => toggleRequestTypeFilter('coe')}
                          />
                          <label htmlFor="type-coe" className="ml-2 text-sm cursor-pointer">
                            Certificate of Enrollment
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox 
                            id="type-coa" 
                            checked={filters.requestType.includes('coa')} 
                            onCheckedChange={() => toggleRequestTypeFilter('coa')}
                          />
                          <label htmlFor="type-coa" className="ml-2 text-sm cursor-pointer">
                            Certificate of No Availed Scholarship
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox 
                            id="type-others" 
                            checked={filters.requestType.includes('others')} 
                            onCheckedChange={() => toggleRequestTypeFilter('others')}
                          />
                          <label htmlFor="type-others" className="ml-2 text-sm cursor-pointer">
                            Others
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Payment Method</h4>
                      <RadioGroup 
                        value={filters.paymentMethod || ""} 
                        onValueChange={(value) => setFilters({
                          ...filters,
                          paymentMethod: value || null
                        })}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="" id="payment-all" />
                          <Label htmlFor="payment-all" className="text-sm">All methods</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="card" id="payment-card" />
                          <Label htmlFor="payment-card" className="text-sm">Card</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cash" id="payment-cash" />
                          <Label htmlFor="payment-cash" className="text-sm">Cash</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200 flex justify-end">
                      <Button 
                        onClick={() => setFilterPopoverOpen(false)}
                        className="bg-[#0047AB] hover:bg-[#00377e]"
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Popover open={sortPopoverOpen} onOpenChange={setSortPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    Sort
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48" align="end">
                  <div className="space-y-2 p-2">
                    <h3 className="text-sm font-medium mb-2">Sort by</h3>
                    
                    <div 
                      className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-100 ${
                        sortConfig.key === 'created_at' ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleSortChange('created_at')}
                    >
                      <span className="text-sm">Date Requested</span>
                      {sortConfig.key === 'created_at' && (
                        <span className="text-blue-600">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                    
                    <div 
                      className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-100 ${
                        sortConfig.key === 'student_name' ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleSortChange('student_name')}
                    >
                      <span className="text-sm">Student Name</span>
                      {sortConfig.key === 'student_name' && (
                        <span className="text-blue-600">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {requestsLoading ? (
              <div className="bg-white rounded-lg shadow p-10 border border-gray-200 text-center">
                <p>Loading requests...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg shadow p-10 border border-gray-200 text-center">
                <div className="text-red-500 mb-4">
                  <X className="w-16 h-16 mx-auto" />
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
            ) : pendingRequests.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {pendingRequests.map((request) => (
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
                            <span className="font-medium">Amount:</span> ₱{request.transaction?.amount?.toFixed(2) || 'N/A'}
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
                <p className="text-gray-600 mb-6">
                  {activeFilters > 0 ? 
                    "No requests match your current filters. Try adjusting your filters or resetting them." : 
                    "There are no pending requests waiting for pickup scheduling."}
                </p>
                {activeFilters > 0 && (
                  <Button 
                    onClick={resetFilters} 
                    variant="outline" 
                    className="mx-auto"
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
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
              
              <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                    {activeFilters > 0 && (
                      <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium rounded-full px-2 py-0.5">
                        {activeFilters}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Filter Requests</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={resetFilters} 
                        className="text-xs"
                      >
                        Reset all
                      </Button>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Request Type</h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Checkbox 
                            id="type-transcript" 
                            checked={filters.requestType.includes('transcript')} 
                            onCheckedChange={() => toggleRequestTypeFilter('transcript')}
                          />
                          <label htmlFor="type-transcript" className="ml-2 text-sm cursor-pointer">
                            Transcript of Records
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox 
                            id="type-certificate" 
                            checked={filters.requestType.includes('certificate')} 
                            onCheckedChange={() => toggleRequestTypeFilter('certificate')}
                          />
                          <label htmlFor="type-certificate" className="ml-2 text-sm cursor-pointer">
                            Certificate of Grades
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox 
                            id="type-certification" 
                            checked={filters.requestType.includes('certification')} 
                            onCheckedChange={() => toggleRequestTypeFilter('certification')}
                          />
                          <label htmlFor="type-certification" className="ml-2 text-sm cursor-pointer">
                            Certification
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox 
                            id="type-statement" 
                            checked={filters.requestType.includes('statement')} 
                            onCheckedChange={() => toggleRequestTypeFilter('statement')}
                          />
                          <label htmlFor="type-statement" className="ml-2 text-sm cursor-pointer">
                            Statement of Account
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox 
                            id="type-registration_form" 
                            checked={filters.requestType.includes('registration_form')} 
                            onCheckedChange={() => toggleRequestTypeFilter('registration_form')}
                          />
                          <label htmlFor="type-registration_form" className="ml-2 text-sm cursor-pointer">
                            Registration Form
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox 
                            id="type-com" 
                            checked={filters.requestType.includes('com')} 
                            onCheckedChange={() => toggleRequestTypeFilter('com')}
                          />
                          <label htmlFor="type-com" className="ml-2 text-sm cursor-pointer">
                            Certificate of Matriculation
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox 
                            id="type-coe" 
                            checked={filters.requestType.includes('coe')} 
                            onCheckedChange={() => toggleRequestTypeFilter('coe')}
                          />
                          <label htmlFor="type-coe" className="ml-2 text-sm cursor-pointer">
                            Certificate of Enrollment
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox 
                            id="type-coa" 
                            checked={filters.requestType.includes('coa')} 
                            onCheckedChange={() => toggleRequestTypeFilter('coa')}
                          />
                          <label htmlFor="type-coa" className="ml-2 text-sm cursor-pointer">
                            Certificate of No Availed Scholarship
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox 
                            id="type-others" 
                            checked={filters.requestType.includes('others')} 
                            onCheckedChange={() => toggleRequestTypeFilter('others')}
                          />
                          <label htmlFor="type-others" className="ml-2 text-sm cursor-pointer">
                            Others
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Payment Method</h4>
                      <RadioGroup 
                        value={filters.paymentMethod || ""} 
                        onValueChange={(value) => setFilters({
                          ...filters,
                          paymentMethod: value || null
                        })}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="" id="payment-all" />
                          <Label htmlFor="payment-all" className="text-sm">All methods</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="card" id="payment-card" />
                          <Label htmlFor="payment-card" className="text-sm">Card</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cash" id="payment-cash" />
                          <Label htmlFor="payment-cash" className="text-sm">Cash</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200 flex justify-end">
                      <Button 
                        onClick={() => setFilterPopoverOpen(false)}
                        className="bg-[#0047AB] hover:bg-[#00377e]"
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Popover open={sortPopoverOpen} onOpenChange={setSortPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    Sort
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48" align="end">
                  <div className="space-y-2 p-2">
                    <h3 className="text-sm font-medium mb-2">Sort by</h3>
                    
                    <div 
                      className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-100 ${
                        sortConfig.key === 'created_at' ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleSortChange('created_at')}
                    >
                      <span className="text-sm">Date Requested</span>
                      {sortConfig.key === 'created_at' && (
                        <span className="text-blue-600">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                    
                    <div 
                      className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-100 ${
                        sortConfig.key === 'student_name' ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleSortChange('student_name')}
                    >
                      <span className="text-sm">Student Name</span>
                      {sortConfig.key === 'student_name' && (
                        <span className="text-blue-600">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {requestsLoading ? (
              <div className="bg-white rounded-lg shadow p-10 border border-gray-200 text-center">
                <p>Loading approved requests...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg shadow p-10 border border-gray-200 text-center">
                <div className="text-red-500 mb-4">
                  <X className="w-16 h-16 mx-auto" />
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
            ) : approvedRequests.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {approvedRequests.map((request) => (
                  <Card key={request.id} className="overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{request.student_name}</CardTitle>
                          <CardDescription>Student Number: {request.student_number}</CardDescription>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          <Check className="w-3 h-3 mr-1" />
                          Approved
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
                            <span className="font-medium">Amount:</span> ₱{request.transaction?.amount?.toFixed(2) || 'N/A'}
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
                    <CardFooter className="pt-0 flex-col items-start">
                      {request.pickup_date && (
                        <p className="text-sm text-gray-500 mb-2">
                          <strong>Pickup Date:</strong> {formatDate(request.pickup_date)}
                        </p>
                      )}
                      {request.notes && (
                        <p className="text-sm text-gray-500 italic">
                          <strong>Notes:</strong> {request.notes}
                        </p>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-10 border border-gray-200 text-center">
                <Check className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No approved requests</h3>
                <p className="text-gray-600 mb-6">
                  There are no requests that have been approved yet.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

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
                  className="rounded-md border pointer-events-auto"
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
            
            <div className="text-sm text-gray-500 flex items-center mt-2">
              <Mail className="w-4 h-4 mr-2" />
              An email notification will be sent to the student when approved.
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

export default EmployeePortal;
