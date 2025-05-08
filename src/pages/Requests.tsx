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
  MessageCircle,
  X,
  ChevronDown,
  RefreshCw,
  Check,
  Loader2,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from "@/components/ui/toggle-group";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Request = Tables<"requests"> & {
  transcript_selected: boolean;
  certificate_selected: boolean;
  certification_selected: boolean;
  others_selected: boolean;
  soa_selected: boolean;
  registration_form_selected: boolean;
  com_selected: boolean;
  coe_selected: boolean;
  coa_selected: boolean;
  processor_name?: string | null;
};

type SortOption = "date" | "name" | "status";
type DocumentType = 
  "all" | "certificate" | "certification" | "soa" | "others" | 
  "registration_form" | "com" | "coe" | "coa";

const getRequestType = (request: Request): string => {
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

const RequestCard: React.FC<{ request: Request }> = ({ request }) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  return (
    <Card 
      className={`rounded-2xl border shadow-xl bg-white hover:shadow-2xl transition-transform hover:scale-[1.02] ${
        request.status === 'approved' 
          ? 'border-green-100 hover:border-green-300' 
          : request.status === 'awaiting_pickup'
          ? 'border-yellow-100 hover:border-yellow-300'
          : request.status === 'rejected'
          ? 'border-red-100 hover:border-red-300'
          : 'border-blue-100 hover:border-blue-300'
      }`}
    >
      <CardHeader className={`rounded-t-2xl p-6 flex flex-row items-center justify-between ${
        request.status === 'approved' 
          ? 'bg-green-50' 
          : request.status === 'awaiting_pickup'
          ? 'bg-yellow-50'
          : request.status === 'rejected'
          ? 'bg-red-50'
          : 'bg-blue-50'
      }`}>
        <div>
          <CardTitle className={`text-xl font-bold flex items-center gap-2 ${
            request.status === 'approved' 
              ? 'text-green-700' 
              : request.status === 'awaiting_pickup'
              ? 'text-yellow-700'
              : request.status === 'rejected'
              ? 'text-red-700'
              : 'text-blue-700'
          }`}>
            {request.status === 'approved' && <Check className="w-5 h-5 text-green-500" />}
            {request.status === 'awaiting_pickup' && <Clock className="w-5 h-5 text-yellow-500" />}
            {request.status === 'rejected' && <X className="w-5 h-5 text-red-500" />}
            {request.status === 'pending' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
            {request.student_name}
          </CardTitle>
          <CardDescription className={`mt-1 ${
            request.status === 'approved' 
              ? 'text-green-700/80' 
              : request.status === 'awaiting_pickup'
              ? 'text-yellow-700/80'
              : request.status === 'rejected'
              ? 'text-red-700/80'
              : 'text-blue-700/80'
          }`}>
            Student Number: {request.student_number}
          </CardDescription>
        </div>
        <span className={`px-4 py-1 rounded-full text-sm font-semibold shadow ${
          request.status === 'approved' 
            ? 'bg-green-200 text-green-900' 
            : request.status === 'awaiting_pickup'
            ? 'bg-yellow-200 text-yellow-900'
            : request.status === 'rejected'
            ? 'bg-red-200 text-red-900'
            : 'bg-blue-200 text-blue-900'
        }`}>
          {request.status === 'approved' && 'Ready for Pickup'}
          {request.status === 'awaiting_pickup' && 'Pending'}
          {request.status === 'rejected' && 'Rejected'}
          {request.status === 'pending' && 'Pending'}
        </span>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileText className="h-4 w-4" />
              <span className="font-medium">Request Type:</span>
            </div>
            <ul className="text-gray-600 text-sm ml-8 list-disc">
              {request.certificate_selected && (
                <li>Certificate of Grades (COG):
                  <span className="inline-flex items-center ml-2 mr-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs">{request.certificate_copies || 1} {((request.certificate_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                  <span className={`inline-flex items-center ml-1 px-2 py-0.5 rounded-full ${request.certificate_ctc ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'} font-semibold text-xs`}>CTC/Dry Seal: {request.certificate_ctc ? 'Yes' : 'No'}</span>
                </li>
              )}
              {request.registration_form_selected && (
                <li>Registration Form:
                  <span className="inline-flex items-center ml-2 mr-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs">{request.registration_form_copies || 1} {((request.registration_form_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                  <span className={`inline-flex items-center ml-1 px-2 py-0.5 rounded-full ${request.registration_form_ctc ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'} font-semibold text-xs`}>CTC/Dry Seal: {request.registration_form_ctc ? 'Yes' : 'No'}</span>
                </li>
              )}
              {request.com_selected && (
                <li>Certificate of Matriculation (COM):
                  <span className="inline-flex items-center ml-2 mr-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs">{request.com_copies || 1} {((request.com_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                  <span className={`inline-flex items-center ml-1 px-2 py-0.5 rounded-full ${request.com_ctc ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'} font-semibold text-xs`}>CTC/Dry Seal: {request.com_ctc ? 'Yes' : 'No'}</span>
                </li>
              )}
              {request.coe_selected && (
                <li>Certificate of Enrollment (COE):
                  <span className="inline-flex items-center ml-2 mr-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs">{request.coe_copies || 1} {((request.coe_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                  <span className={`inline-flex items-center ml-1 px-2 py-0.5 rounded-full ${request.coe_ctc ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'} font-semibold text-xs`}>CTC/Dry Seal: {request.coe_ctc ? 'Yes' : 'No'}</span>
                </li>
              )}
              {request.coa_selected && (
                <li>Certificate of No Availed Scholarship (COA):
                  <span className="inline-flex items-center ml-2 mr-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs">{request.coa_copies || 1} {((request.coa_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                  <span className={`inline-flex items-center ml-1 px-2 py-0.5 rounded-full ${request.coa_ctc ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'} font-semibold text-xs`}>CTC/Dry Seal: {request.coa_ctc ? 'Yes' : 'No'}</span>
                </li>
              )}
              {request.soa_selected && (
                <li>Statement of Account (SOA):
                  <span className="inline-flex items-center ml-2 mr-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs">{request.soa_copies || 1} {((request.soa_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                  <span className={`inline-flex items-center ml-1 px-2 py-0.5 rounded-full ${request.soa_ctc ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'} font-semibold text-xs`}>CTC/Dry Seal: {request.soa_ctc ? 'Yes' : 'No'}</span>
                </li>
              )}
              {request.certification_selected && (
                <li>Certification:
                  <span className="inline-flex items-center ml-2 mr-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs">{request.certification_copies || 1} {((request.certification_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                  <span className={`inline-flex items-center ml-1 px-2 py-0.5 rounded-full ${request.certification_ctc ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'} font-semibold text-xs`}>CTC/Dry Seal: {request.certification_ctc ? 'Yes' : 'No'}</span>
                </li>
              )}
              {request.others_selected && (
                <li>Others:
                  <span className="inline-flex items-center ml-2 mr-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs">{request.others_copies || 1} {((request.others_copies || 1) === 1 ? 'copy' : 'copies')}</span>
                  <span className={`inline-flex items-center ml-1 px-2 py-0.5 rounded-full ${request.others_ctc ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'} font-semibold text-xs`}>CTC/Dry Seal: {request.others_ctc ? 'Yes' : 'No'}</span>
                </li>
              )}
            </ul>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Request Date:</span>
              <span>{formatDate(request.created_at)}</span>
            </div>
          </div>
          {request.status === 'approved' && (
            <div className="mt-2 pt-4 border-t border-gray-100">
              <p className="text-gray-600 text-sm">
                <span className="font-medium">Processed by:</span> {request.processor_name || 'Staff Member'}
              </p>
              {request.pickup_date && (
                <p className="text-gray-600 text-sm">
                  <span className="font-medium">Pickup Date:</span> {formatDate(request.pickup_date)}
                </p>
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
      </CardContent>
    </Card>
  );
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [documentType, setDocumentType] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("all");
  const [processor, setProcessor] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{
    from: string | null;
    to: string | null;
  }>({
    from: null,
    to: null
  });
  const [processors, setProcessors] = useState<{id: string, name: string}[]>([]);
  const [sortPopoverOpen, setSortPopoverOpen] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }

    const { user } = session;
    const name = user.user_metadata.name || user.user_metadata.full_name;
    const email = user.email;
    const avatarUrl = user.user_metadata.avatar_url;

    setUserProfile({
      name,
      email,
      avatarUrl
    });
  }, [session, navigate]);

  useEffect(() => {
    const fetchProcessors = async () => {
      try {
        const { data: processorData, error } = await supabase
          .from('requests')
          .select('processed_by, auth.users!processed_by(raw_user_meta_data)')
          .not('processed_by', 'is', null)
          .filter('status', 'eq', 'approved');
        
        if (error) throw error;
        
        const uniqueProcessors = new Map();
        processorData.forEach((request: any) => {
          if (request.processed_by && request.users && request.users.raw_user_meta_data) {
            const processorId = request.processed_by;
            const processorName = request.users.raw_user_meta_data.name || 'Unknown';
            
            if (!uniqueProcessors.has(processorId)) {
              uniqueProcessors.set(processorId, { id: processorId, name: processorName });
            }
          }
        });
        
        const formattedProcessors = Array.from(uniqueProcessors.values());
        setProcessors(formattedProcessors);
      } catch (err) {
        console.error("Failed to fetch processors:", err);
      }
    };

    if (session?.user?.id) {
      fetchProcessors();
    }
  }, [session?.user?.id]);

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
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to load your requests. Please try again.");
      console.error("Request fetch error:", error);
    }
  }, [error]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const matchesDocumentTypeFilter = (request: Request): boolean => {
    if (documentType.length === 0) return true;
    const typeChecks = [
      { key: 'certificate', selected: request.certificate_selected },
      { key: 'certification', selected: request.certification_selected },
      { key: 'soa', selected: request.soa_selected },
      { key: 'registration_form', selected: request.registration_form_selected },
      { key: 'com', selected: request.com_selected },
      { key: 'coe', selected: request.coe_selected },
      { key: 'coa', selected: request.coa_selected },
      { key: 'others', selected: request.others_selected },
    ];
    return documentType.some(type => typeChecks.find(tc => tc.key === type && tc.selected));
  };

  const matchesStatusFilter = (request: Request): boolean => {
    if (status === "all") return true;
    if (status === "pending") return request.status === "pending" || request.status === "awaiting_pickup";
    if (status === "approved") return request.status === "approved";
    return true;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  const getFilteredAndSortedRequests = () => {
    if (!Array.isArray(requests)) return [];
    
    const filtered = requests.filter(request => {
      const matchesSearch = 
        request.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        getRequestType(request).toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.student_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch && 
        matchesDocumentTypeFilter(request) && 
        matchesStatusFilter(request);
    });
    
    return filtered.sort((a, b) => {
      switch (sortOption) {
        case "date":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "name":
          return a.student_name.localeCompare(b.student_name);
        case "status":
          const statusOrder = { 
            'approved': 1, 
            'awaiting_pickup': 2, 
            'pending': 3, 
            'rejected': 4 
          };
          return (statusOrder[a.status as keyof typeof statusOrder] || 5) - 
                 (statusOrder[b.status as keyof typeof statusOrder] || 5);
        default:
          return 0;
      }
    });
  };

  const filteredRequests = getFilteredAndSortedRequests();

  const clearFilters = () => {
    setDocumentType([]);
    setProcessor("all");
    setDateRange({ from: null, to: null });
    setSortOption("date");
    setSortDirection("asc");
    setSearchTerm("");
    setShowFilters(false);
  };

  const handleManualRefresh = async () => {
    try {
      refetch();
      toast.success("Refreshed successfully");
    } catch (err) {
      console.error("Failed to refresh:", err);
      toast.error("Failed to refresh. Please try again.");
    }
  };

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
    <div className="min-h-screen bg-white flex">
      <div className="w-full">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 lg:px-12">
          <header className="mb-0 px-0 pt-8">
            <div className="flex items-center gap-4 mb-2 -ml-4">
              <div className="w-1.5 h-10 bg-gradient-to-b from-blue-500 to-blue-400 rounded-full" />
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">My Requests</h1>
                <p className="mt-1 text-lg text-slate-500 font-medium">View and manage your academic record requests</p>
              </div>
            </div>
            <div className="border-b border-blue-100 shadow-sm" />
          </header>
          <div className="w-full px-4 sm:px-8 lg:px-12 mb-12 mt-10">
            <div className="bg-white/80 rounded-2xl shadow-2xl border border-blue-100 p-7 flex flex-col sm:flex-row gap-4 items-center transition-all">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400 pointer-events-none" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-4 rounded-full border border-blue-100 shadow focus:ring-2 focus:ring-blue-200 bg-white/90 focus:outline-none transition-all w-full text-base hover:shadow-lg focus:shadow-lg placeholder:text-blue-400"
                />
              </div>
              <div className="hidden sm:block h-10 w-px bg-blue-100 mx-2 rounded-full" />
              <div className="flex gap-2 w-full sm:w-auto">
                <Popover open={showFilters} onOpenChange={setShowFilters}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="rounded-full h-11 gap-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow hover:scale-105 transition border-0">
                      <Filter className="h-5 w-5" />
                      Filter
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-6" align="end">
                    <div className="space-y-6">
                      <h3 className="text-base font-semibold mb-2">Filter Requests</h3>
                      <div className="border-b border-gray-200 mb-4" />
                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="text-base font-semibold mb-2 block">Document Types</label>
                          <ToggleGroup
                            type="multiple"
                            variant="outline"
                            className="justify-start flex-wrap gap-2"
                            value={documentType}
                            onValueChange={(value) => setDocumentType(value)}
                          >
                            <ToggleGroupItem value="certificate">Certificate of Grades (COG)</ToggleGroupItem>
                            <ToggleGroupItem value="certification">Certification</ToggleGroupItem>
                            <ToggleGroupItem value="soa">Statement of Account (SOA)</ToggleGroupItem>
                            <ToggleGroupItem value="registration_form">Registration Form</ToggleGroupItem>
                            <ToggleGroupItem value="com">Certificate of Matriculation (COM)</ToggleGroupItem>
                            <ToggleGroupItem value="coe">Certificate of Enrollment (COE)</ToggleGroupItem>
                            <ToggleGroupItem value="coa">Certificate of No Availed Scholarship (COA)</ToggleGroupItem>
                            <ToggleGroupItem value="others">Others</ToggleGroupItem>
                          </ToggleGroup>
                        </div>
                        <div>
                          <label className="text-base font-semibold mb-2 block">Status</label>
                          <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
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
                        { key: 'date', label: 'Date' },
                        { key: 'name', label: 'Name' },
                        { key: 'status', label: 'Status' }
                      ].map((item) => (
                        <Button
                          key={item.key}
                          variant="ghost"
                          className={cn(
                            "w-full justify-start",
                            sortOption === item.key && "bg-accent"
                          )}
                          onClick={() => {
                            if (sortOption === item.key) {
                              setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                            } else {
                              setSortOption(item.key as SortOption);
                              setSortDirection(item.key === "date" ? "desc" : "asc");
                            }
                            setSortPopoverOpen(false);
                          }}
                        >
                          {item.label}
                          {sortOption === item.key && (
                            <span className="ml-auto text-blue-600 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Button onClick={handleManualRefresh} variant="outline" className="rounded-full h-11 gap-2 border-blue-200 text-blue-700 bg-white hover:bg-blue-50 shadow-sm">
                  <RefreshCw className="h-5 w-5" />
                  Refresh
                </Button>
                <Button onClick={() => navigate("/request")} className="rounded-full h-11 gap-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow hover:scale-105 transition border-0">
                  <PlusCircle className="h-5 w-5" />
                  New Request
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {(documentType.length > 0 || status !== "all") && (
              <div className="flex flex-wrap gap-2">
                {documentType.length > 0 && (
                  <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                    {documentType.map(type => (
                      <span key={type} className="mr-2">
                        {type === "certificate" && "Certificate of Grades (COG)"}
                        {type === "certification" && "Certification"}
                        {type === "soa" && "Statement of Account (SOA)"}
                        {type === "registration_form" && "Registration Form"}
                        {type === "com" && "Certificate of Matriculation (COM)"}
                        {type === "coe" && "Certificate of Enrollment (COE)"}
                        {type === "coa" && "Certificate of No Availed Scholarship (COA)"}
                        {type === "others" && "Others"}
                      </span>
                    ))}
                    <button
                      onClick={() => setDocumentType([])}
                      className="ml-2 focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {status !== "all" && (
                  <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                    Status: {status === "pending" ? "Pending" : "Approved"}
                    <button
                      onClick={() => setStatus("all")}
                      className="ml-2 focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {(dateRange.from || dateRange.to) && (
                  <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                    Date: {dateRange.from ? formatDate(dateRange.from) : 'Any'} - {dateRange.to ? formatDate(dateRange.to) : 'Any'}
                    <button
                      onClick={() => setDateRange({ from: null, to: null })}
                      className="ml-2 focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 underline ml-2"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {requestsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <XCircle className="w-12 h-12 text-red-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">Error loading requests</h3>
                <p className="text-gray-500 mt-1">There was a problem loading your requests.</p>
                <Button 
                  onClick={() => refetch()} 
                  className="mt-4 bg-gradient-to-r from-blue-500 to-blue-400 text-white"
                >
                  Try Again
                </Button>
              </div>
            ) : filteredRequests.length > 0 ? (
              <div className="flex flex-col gap-8 items-center mb-16">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="w-full max-w-7xl mx-auto">
                    <RequestCard request={request} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">No requests found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search or filters to find what you're looking for.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Requests;
