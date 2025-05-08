import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Check,
  User,
  FileText,
  CreditCard,
  Building2,
  MapPin,
  Phone,
  Mail as MailIcon,
  ChevronDown,
  ChevronUp,
  BookOpen,
  RefreshCw,
  Banknote,
  CheckCircle
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

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
  certificate_copies?: number | null;
  certificate_ctc?: boolean | null;
  certification_selected: boolean;
  certification_copies?: number | null;
  certification_ctc?: boolean | null;
  soa_selected: boolean;
  soa_copies?: number | null;
  soa_ctc?: boolean | null;
  registration_form_selected: boolean;
  registration_form_copies?: number | null;
  registration_form_ctc?: boolean | null;
  com_selected: boolean;
  com_copies?: number | null;
  com_ctc?: boolean | null;
  coe_selected: boolean;
  coe_copies?: number | null;
  coe_ctc?: boolean | null;
  coa_selected: boolean;
  coa_copies?: number | null;
  coa_ctc?: boolean | null;
  others_selected: boolean;
  others_copies?: number | null;
  others_ctc?: boolean | null;
  
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
  const location = useLocation();
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'approved') {
      setActiveTab('approved');
    } else {
      setActiveTab('pending');
    }
  }, [location.search]);

  const formatDate = (dateString: string): string => {
    if (!dateString || typeof dateString !== 'string') return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      // Always treat as local date, not UTC!
      const [year, month, day] = parts.map(Number);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        // Use Date(year, monthIndex, day) which is local time
        const localDate = new Date(year, month - 1, day);
        return localDate.toLocaleDateString('en-PH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    }
    // fallback for other formats
    const fallbackDate = new Date(dateString);
    if (isNaN(fallbackDate.getTime())) return dateString;
    return fallbackDate.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRequestType = (request: RequestWithTransaction): string => {
    const types = [];
    if (request.transcript_selected) types.push("Transcript of Records (TOR)");
    if (request.certificate_selected) types.push("Certificate of Grades (COG)");
    if (request.certification_selected) types.push("Certification");
    if (request.soa_selected) types.push("Statement of Account (SOA)");
    if (request.registration_form_selected) types.push("Registration Form");
    if (request.com_selected) types.push("Certificate of Matriculation (COM)");
    if (request.coe_selected) types.push("Certificate of Enrollment (COE)");
    if (request.coa_selected) types.push("Certificate of No Availed Scholarship (COA)");
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
        if (request.transcript_selected) requestTypes.push("Transcript of Records (TOR)");
        if (request.certificate_selected) requestTypes.push("Certificate of Grades (COG)");
        if (request.certification_selected) requestTypes.push("Certification");
        if (request.soa_selected) requestTypes.push("Statement of Account (SOA)");
        if (request.registration_form_selected) requestTypes.push("Registration Form");
        if (request.com_selected) requestTypes.push("Certificate of Matriculation (COM)");
        if (request.coe_selected) requestTypes.push("Certificate of Enrollment (COE)");
        if (request.coa_selected) requestTypes.push("Certificate of No Availed Scholarship (COA)");
        if (request.others_selected) requestTypes.push("Others");
        
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
        // For approved requests, sort by pickup date
        if (a.status === 'approved' && b.status === 'approved') {
          const dateA = a.pickup_date ? new Date(a.pickup_date).getTime() : 0;
          const dateB = b.pickup_date ? new Date(b.pickup_date).getTime() : 0;
          return sortConfig.direction === 'asc'
            ? dateA - dateB
            : dateB - dateA;
        }
        // For pending requests, sort by created date
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
      // Format the date in YYYY-MM-DD format without timezone conversion
      const formattedDate = pickupDate.toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('requests')
        .update({
          status: 'approved',
          pickup_date: formattedDate,
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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-start justify-center pt-8">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 lg:px-12">
        <header className="bg-transparent mb-4">
          <div className="w-full px-4 sm:px-8 lg:px-12 mt-8 mb-8">
            <div className="flex items-center gap-4 mb-2 -ml-4">
              <div className="w-1.5 h-10 bg-gradient-to-b from-blue-500 to-blue-400 rounded-full" />
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 flex items-center gap-2">Employee Portal</h1>
                <p className="mt-1 text-base text-slate-500 font-medium">Manage and process student document requests</p>
              </div>
            </div>
            <div className="border-b border-blue-100 shadow-sm" />
          </div>
        </header>
        <main className="w-full px-4 sm:px-8 lg:px-12 pb-10">
          {/* Search and Filter Section */}
          <div className="w-full px-4 sm:px-8 lg:px-12 mb-12">
            <div className="bg-white/80 rounded-2xl shadow-2xl border border-blue-100 p-7 flex flex-col sm:flex-row gap-4 items-center transition-all">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400 pointer-events-none" />
                <Input
                  placeholder="Search by name, request type, or student number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-4 rounded-full border border-blue-100 shadow focus:ring-2 focus:ring-blue-200 bg-white/90 focus:outline-none transition-all w-full text-base hover:shadow-lg focus:shadow-lg"
                />
              </div>
              <div className="hidden sm:block h-10 w-px bg-blue-100 mx-2 rounded-full" />
              <div className="flex gap-2 w-full sm:w-auto">
                <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="rounded-full h-11 gap-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow hover:scale-105 transition border-0">
                      <Filter className="h-5 w-5" />
                      Filters
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="end">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Request Types</h4>
                        <div className="border-b border-gray-200 mb-2" />
                        <div className="space-y-4">
                          {['Certificate of Grades (COG)', 'Certification', 'Statement of Account (SOA)', 'Registration Form', 'Certificate of Matriculation (COM)', 'Certificate of Enrollment (COE)', 'Certificate of No Availed Scholarship (COA)', 'Others'].map((type) => (
                            <div key={type} className="flex items-center space-x-2">
                              <Checkbox
                                id={`filter-${type}`}  // Make sure this is unique
                                checked={filters.requestType.includes(type)}
                                onCheckedChange={() => toggleRequestTypeFilter(type)}
                                className="pointer-events-auto"  // Ensure pointer events are enabled
                              />
                              <Label htmlFor={`filter-${type}`} className="text-sm cursor-pointer">
                                {type}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-400 text-white font-semibold rounded-full px-6 py-2 shadow"
                        onClick={resetFilters}
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Popover open={sortPopoverOpen} onOpenChange={setSortPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="rounded-full h-11 gap-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow hover:scale-105 transition border-0">
                      <ArrowUpDown className="h-5 w-5" />
                      Sort
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="end">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium mb-2">Sort by</h3>
                      <div className="border-b border-gray-200 mb-4" />
                      {[
                        { key: 'created_at', label: 'Date' },
                        { key: 'student_name', label: 'Name' }
                      ].map((item) => (
                        <Button
                          key={item.key}
                          variant="ghost"
                          className={cn(
                            "w-full justify-start",
                            sortConfig.key === item.key && "bg-accent"
                          )}
                          onClick={() => handleSortChange(item.key)}
                        >
                          {item.label}
                          {sortConfig.key === item.key && (
                            <span className="ml-auto text-blue-600 font-bold">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Button onClick={() => refetch()} variant="outline" className="rounded-full h-11 gap-2 border-blue-200 text-blue-700 bg-white hover:bg-blue-50 shadow-sm">
                  <RefreshCw className="h-5 w-5" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pending' | 'approved')} className="space-y-4">
            <TabsList className="flex w-full justify-center gap-4 bg-transparent rounded-full p-1 mb-8">
              <TabsTrigger value="pending" className="rounded-full px-6 py-2 text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-yellow-300 data-[state=active]:text-white data-[state=active]:shadow">
                Pending Requests
              </TabsTrigger>
              <TabsTrigger value="approved" className="rounded-full px-6 py-2 text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-400 data-[state=active]:text-white data-[state=active]:shadow">
                Approved Requests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-8">
              {requestsLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {applyFilters(applySorting(employeeRequests.filter(req => req.status === 'awaiting_pickup'))).map((request) => (
                    <Card key={request.id} className="rounded-2xl border border-yellow-100 shadow-xl bg-white hover:shadow-2xl hover:border-yellow-300 transition-transform hover:scale-[1.025]">
                      <CardHeader className="bg-yellow-50 rounded-t-2xl p-6 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-xl font-bold text-yellow-700 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-yellow-500" />
                            {request.student_name}
                          </CardTitle>
                          <CardDescription className="mt-1 text-yellow-700/80">
                            Student Number: {request.student_number}
                          </CardDescription>
                        </div>
                        <span className="px-4 py-1 rounded-full text-sm font-semibold bg-yellow-200 text-yellow-900 shadow">Pending</span>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <FileText className="h-4 w-4" />
                              <span className="font-medium">Request Type:</span>
                            </div>
                            <ul className="text-gray-600 text-sm ml-8 list-disc">
                              {request.certificate_selected && (
                                <li>Certificate of Grades (COG):
                                  <span className="inline-flex items-center ml-2 mr-1 rounded px-2 py-0.5 font-semibold text-white bg-blue-500 text-xs">{request.certificate_copies || 1} {((request.certificate_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                                  <span className={`inline-flex items-center ml-1 rounded px-2 py-0.5 font-semibold text-xs text-white ${request.certificate_ctc ? 'bg-green-500' : 'bg-gray-400'}`}>CTC/Dry Seal: {request.certificate_ctc ? 'Yes' : 'No'}</span>
                                </li>
                              )}
                              {request.registration_form_selected && (
                                <li>Registration Form:
                                  <span className="inline-flex items-center ml-2 mr-1 rounded px-2 py-0.5 font-semibold text-white bg-blue-500 text-xs">{request.registration_form_copies || 1} {((request.registration_form_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                                  <span className={`inline-flex items-center ml-1 rounded px-2 py-0.5 font-semibold text-xs text-white ${request.registration_form_ctc ? 'bg-green-500' : 'bg-gray-400'}`}>CTC/Dry Seal: {request.registration_form_ctc ? 'Yes' : 'No'}</span>
                                </li>
                              )}
                              {request.com_selected && (
                                <li>Certificate of Matriculation (COM):
                                  <span className="inline-flex items-center ml-2 mr-1 rounded px-2 py-0.5 font-semibold text-white bg-blue-500 text-xs">{request.com_copies || 1} {((request.com_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                                  <span className={`inline-flex items-center ml-1 rounded px-2 py-0.5 font-semibold text-xs text-white ${request.com_ctc ? 'bg-green-500' : 'bg-gray-400'}`}>CTC/Dry Seal: {request.com_ctc ? 'Yes' : 'No'}</span>
                                </li>
                              )}
                              {request.coe_selected && (
                                <li>Certificate of Enrollment (COE):
                                  <span className="inline-flex items-center ml-2 mr-1 rounded px-2 py-0.5 font-semibold text-white bg-blue-500 text-xs">{request.coe_copies || 1} {((request.coe_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                                  <span className={`inline-flex items-center ml-1 rounded px-2 py-0.5 font-semibold text-xs text-white ${request.coe_ctc ? 'bg-green-500' : 'bg-gray-400'}`}>CTC/Dry Seal: {request.coe_ctc ? 'Yes' : 'No'}</span>
                                </li>
                              )}
                              {request.coa_selected && (
                                <li>Certificate of No Availed Scholarship (COA):
                                  <span className="inline-flex items-center ml-2 mr-1 rounded px-2 py-0.5 font-semibold text-white bg-blue-500 text-xs">{request.coa_copies || 1} {((request.coa_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                                  <span className={`inline-flex items-center ml-1 rounded px-2 py-0.5 font-semibold text-xs text-white ${request.coa_ctc ? 'bg-green-500' : 'bg-gray-400'}`}>CTC/Dry Seal: {request.coa_ctc ? 'Yes' : 'No'}</span>
                                </li>
                              )}
                              {request.soa_selected && (
                                <li>Statement of Account (SOA):
                                  <span className="inline-flex items-center ml-2 mr-1 rounded px-2 py-0.5 font-semibold text-white bg-blue-500 text-xs">{request.soa_copies || 1} {((request.soa_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                                  <span className={`inline-flex items-center ml-1 rounded px-2 py-0.5 font-semibold text-xs text-white ${request.soa_ctc ? 'bg-green-500' : 'bg-gray-400'}`}>CTC/Dry Seal: {request.soa_ctc ? 'Yes' : 'No'}</span>
                                </li>
                              )}
                              {request.certification_selected && (
                                <li>Certification:
                                  <span className="inline-flex items-center ml-2 mr-1 rounded px-2 py-0.5 font-semibold text-white bg-blue-500 text-xs">{request.certification_copies || 1} {((request.certification_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                                  <span className={`inline-flex items-center ml-1 rounded px-2 py-0.5 font-semibold text-xs text-white ${request.certification_ctc ? 'bg-green-500' : 'bg-gray-400'}`}>CTC/Dry Seal: {request.certification_ctc ? 'Yes' : 'No'}</span>
                                </li>
                              )}
                              {request.others_selected && (
                                <li>Others:
                                  <span className="inline-flex items-center ml-2 mr-1 rounded px-2 py-0.5 font-semibold text-white bg-blue-500 text-xs">{request.others_copies || 1} {((request.others_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                                  <span className={`inline-flex items-center ml-1 rounded px-2 py-0.5 font-semibold text-xs text-white ${request.others_ctc ? 'bg-green-500' : 'bg-gray-400'}`}>CTC/Dry Seal: {request.others_ctc ? 'Yes' : 'No'}</span>
                                </li>
                              )}
                            </ul>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <CalendarIcon className="h-4 w-4" />
                              <span className="font-medium">Request Date:</span>
                              <span>{formatDate(request.created_at)}</span>
                            </div>
                            {request.pickup_date && (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">Pickup Date:</span>
                                <span>{formatDate(request.pickup_date)}</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <MapPin className="h-4 w-4" />
                              <span className="font-medium">Address:</span>
                              <span>{request.home_address}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Phone className="h-4 w-4" />
                              <span className="font-medium">Contact:</span>
                              <span>{request.contact_number}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Building2 className="h-4 w-4" />
                              <span className="font-medium">Purpose:</span>
                              <span>{request.purpose}</span>
                            </div>
                            {request.transaction && (
                              <div>
                                <div className="my-4 border-b border-gray-200" />
                                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-1">Payment Information:</div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <CreditCard className="h-4 w-4" />
                                    <span className="font-medium">Amount:</span>
                                    <span>₱{Number(request.transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Banknote className="h-4 w-4" />
                                    <span className="font-medium">Payment Method:</span>
                                    <span>{request.transaction.payment_method || '-'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="font-medium">Payment Status:</span>
                                    <span className={`rounded px-2 py-0.5 font-semibold text-white ${['paid', 'successful'].includes((request.transaction.payment_status || '').toLowerCase()) ? 'bg-green-500' : 'bg-red-500'}`}>{['paid', 'successful'].includes((request.transaction.payment_status || '').toLowerCase()) ? (request.transaction.payment_status.charAt(0).toUpperCase() + request.transaction.payment_status.slice(1)) : (request.transaction.payment_status || 'Unpaid')}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <CalendarIcon className="h-4 w-4" />
                                    <span className="font-medium">Payment Date:</span>
                                    <span>{request.transaction.created_at ? formatDate(request.transaction.created_at) : '-'}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-yellow-50 rounded-b-2xl p-6 flex justify-end gap-2">
                        <Button
                          variant="outline"
                          className="rounded-full border-yellow-300 text-yellow-800 hover:bg-yellow-100 hover:scale-105 transition"
                          onClick={() => {
                            setSelectedRequest(request);
                            setDialogOpen(true);
                          }}
                        >
                          Process Request
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-8">
              {requestsLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
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
              ) : (
                <div className="flex flex-col gap-8">
                  {applyFilters(applySorting(employeeRequests.filter(req => req.status === 'approved'))).map((request) => (
                    <Card key={request.id} className="rounded-2xl border border-green-100 shadow-xl bg-white hover:shadow-2xl hover:border-green-300 transition-transform hover:scale-[1.025]">
                      <CardHeader className="bg-green-50 rounded-t-2xl p-6 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-xl font-bold text-green-700 flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-500" />
                            {request.student_name}
                          </CardTitle>
                          <CardDescription className="mt-1 text-green-700/80">
                            Student Number: {request.student_number}
                          </CardDescription>
                        </div>
                        <span className="px-4 py-1 rounded-full text-sm font-semibold bg-green-200 text-green-900 shadow">Approved</span>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <FileText className="h-4 w-4" />
                              <span className="font-medium">Request Type:</span>
                            </div>
                            <ul className="text-gray-600 text-sm ml-8 list-disc">
                              {request.certificate_selected && (
                                <li>Certificate of Grades (COG):
                                  <span className="inline-flex items-center ml-2 mr-1 rounded px-2 py-0.5 font-semibold text-white bg-blue-500 text-xs">{request.certificate_copies || 1} {((request.certificate_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                                  <span className={`inline-flex items-center ml-1 rounded px-2 py-0.5 font-semibold text-xs text-white ${request.certificate_ctc ? 'bg-green-500' : 'bg-gray-400'}`}>CTC/Dry Seal: {request.certificate_ctc ? 'Yes' : 'No'}</span>
                                </li>
                              )}
                              {request.registration_form_selected && (
                                <li>Registration Form:
                                  <span className="inline-flex items-center ml-2 mr-1 rounded px-2 py-0.5 font-semibold text-white bg-blue-500 text-xs">{request.registration_form_copies || 1} {((request.registration_form_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                                  <span className={`inline-flex items-center ml-1 rounded px-2 py-0.5 font-semibold text-xs text-white ${request.registration_form_ctc ? 'bg-green-500' : 'bg-gray-400'}`}>CTC/Dry Seal: {request.registration_form_ctc ? 'Yes' : 'No'}</span>
                                </li>
                              )}
                              {request.com_selected && (
                                <li>Certificate of Matriculation (COM):
                                  <span className="inline-flex items-center ml-2 mr-1 rounded px-2 py-0.5 font-semibold text-white bg-blue-500 text-xs">{request.com_copies || 1} {((request.com_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                                  <span className={`inline-flex items-center ml-1 rounded px-2 py-0.5 font-semibold text-xs text-white ${request.com_ctc ? 'bg-green-500' : 'bg-gray-400'}`}>CTC/Dry Seal: {request.com_ctc ? 'Yes' : 'No'}</span>
                                </li>
                              )}
                              {request.coe_selected && (
                                <li>Certificate of Enrollment (COE):
                                  <span className="inline-flex items-center ml-2 mr-1 rounded px-2 py-0.5 font-semibold text-white bg-blue-500 text-xs">{request.coe_copies || 1} {((request.coe_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                                  <span className={`inline-flex items-center ml-1 rounded px-2 py-0.5 font-semibold text-xs text-white ${request.coe_ctc ? 'bg-green-500' : 'bg-gray-400'}`}>CTC/Dry Seal: {request.coe_ctc ? 'Yes' : 'No'}</span>
                                </li>
                              )}
                              {request.coa_selected && (
                                <li>Certificate of No Availed Scholarship (COA):
                                  <span className="inline-flex items-center ml-2 mr-1 rounded px-2 py-0.5 font-semibold text-white bg-blue-500 text-xs">{request.coa_copies || 1} {((request.coa_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                                  <span className={`inline-flex items-center ml-1 rounded px-2 py-0.5 font-semibold text-xs text-white ${request.coa_ctc ? 'bg-green-500' : 'bg-gray-400'}`}>CTC/Dry Seal: {request.coa_ctc ? 'Yes' : 'No'}</span>
                                </li>
                              )}
                              {request.soa_selected && (
                                <li>Statement of Account (SOA):
                                  <span className="inline-flex items-center ml-2 mr-1 rounded px-2 py-0.5 font-semibold text-white bg-blue-500 text-xs">{request.soa_copies || 1} {((request.soa_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                                  <span className={`inline-flex items-center ml-1 rounded px-2 py-0.5 font-semibold text-xs text-white ${request.soa_ctc ? 'bg-green-500' : 'bg-gray-400'}`}>CTC/Dry Seal: {request.soa_ctc ? 'Yes' : 'No'}</span>
                                </li>
                              )}
                              {request.certification_selected && (
                                <li>Certification:
                                  <span className="inline-flex items-center ml-2 mr-1 rounded px-2 py-0.5 font-semibold text-white bg-blue-500 text-xs">{request.certification_copies || 1} {((request.certification_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                                  <span className={`inline-flex items-center ml-1 rounded px-2 py-0.5 font-semibold text-xs text-white ${request.certification_ctc ? 'bg-green-500' : 'bg-gray-400'}`}>CTC/Dry Seal: {request.certification_ctc ? 'Yes' : 'No'}</span>
                                </li>
                              )}
                              {request.others_selected && (
                                <li>Others:
                                  <span className="inline-flex items-center ml-2 mr-1 rounded px-2 py-0.5 font-semibold text-white bg-blue-500 text-xs">{request.others_copies || 1} {((request.others_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                                  <span className={`inline-flex items-center ml-1 rounded px-2 py-0.5 font-semibold text-xs text-white ${request.others_ctc ? 'bg-green-500' : 'bg-gray-400'}`}>CTC/Dry Seal: {request.others_ctc ? 'Yes' : 'No'}</span>
                                </li>
                              )}
                            </ul>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <CalendarIcon className="h-4 w-4" />
                              <span className="font-medium">Request Date:</span>
                              <span>{formatDate(request.created_at)}</span>
                            </div>
                            {request.pickup_date && (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">Pickup Date:</span>
                                <span>{formatDate(request.pickup_date)}</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <MapPin className="h-4 w-4" />
                              <span className="font-medium">Address:</span>
                              <span>{request.home_address}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Phone className="h-4 w-4" />
                              <span className="font-medium">Contact:</span>
                              <span>{request.contact_number}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Building2 className="h-4 w-4" />
                              <span className="font-medium">Purpose:</span>
                              <span>{request.purpose}</span>
                            </div>
                            {request.transaction && (
                              <div>
                                <div className="my-4 border-b border-gray-200" />
                                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-1">Payment Information:</div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <CreditCard className="h-4 w-4" />
                                    <span className="font-medium">Amount:</span>
                                    <span>₱{Number(request.transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Banknote className="h-4 w-4" />
                                    <span className="font-medium">Payment Method:</span>
                                    <span>{request.transaction.payment_method || '-'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="font-medium">Payment Status:</span>
                                    <span className={`rounded px-2 py-0.5 font-semibold text-white ${['paid', 'successful'].includes((request.transaction.payment_status || '').toLowerCase()) ? 'bg-green-500' : 'bg-red-500'}`}>{['paid', 'successful'].includes((request.transaction.payment_status || '').toLowerCase()) ? (request.transaction.payment_status.charAt(0).toUpperCase() + request.transaction.payment_status.slice(1)) : (request.transaction.payment_status || 'Unpaid')}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <CalendarIcon className="h-4 w-4" />
                                    <span className="font-medium">Payment Date:</span>
                                    <span>{request.transaction.created_at ? formatDate(request.transaction.created_at) : '-'}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-green-50 rounded-b-2xl p-6 flex justify-end gap-2">
                        <Button
                          variant="outline"
                          className="rounded-full border-green-300 text-green-800 hover:bg-green-100 hover:scale-105 transition"
                          onClick={() => {
                            setSelectedRequest(request);
                            setDialogOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>

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
    </div>
  );
};

export default EmployeePortal;