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
  ChevronDown
} from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { Sidebar } from "@/components/layout/Sidebar";
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

type SortOption = "newest" | "oldest" | "name_asc" | "name_desc" | "status";
type DocumentType = 
  "all" | "transcript" | "certificate" | "certification" | "soa" | "others" | 
  "registration_form" | "com" | "coe" | "coa";

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
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [documentType, setDocumentType] = useState<DocumentType>("all");
  const [processor, setProcessor] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{
    from: string | null;
    to: string | null;
  }>({
    from: null,
    to: null
  });
  const [processors, setProcessors] = useState<{id: string, name: string}[]>([]);

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

  const matchesDocumentTypeFilter = (request: Request): boolean => {
    if (documentType === "all") return true;
    
    switch (documentType) {
      case "transcript": return request.transcript_selected;
      case "certificate": return request.certificate_selected;
      case "certification": return request.certification_selected;
      case "soa": return request.soa_selected;
      case "registration_form": return request.registration_form_selected;
      case "com": return request.com_selected;
      case "coe": return request.coe_selected;
      case "coa": return request.coa_selected;
      case "others": return request.others_selected;
      default: return true;
    }
  };

  const matchesProcessorFilter = (request: Request): boolean => {
    if (processor === "all") return true;
    return request.processed_by === processor;
  };

  const matchesDateFilter = (request: Request): boolean => {
    if (!dateRange.from && !dateRange.to) return true;
    
    const requestDate = new Date(request.created_at);
    
    if (dateRange.from && !dateRange.to) {
      const fromDate = new Date(dateRange.from);
      return requestDate >= fromDate;
    }
    
    if (!dateRange.from && dateRange.to) {
      const toDate = new Date(dateRange.to);
      return requestDate <= toDate;
    }
    
    const fromDate = new Date(dateRange.from!);
    const toDate = new Date(dateRange.to!);
    return requestDate >= fromDate && requestDate <= toDate;
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
        matchesProcessorFilter(request) &&
        matchesDateFilter(request);
    });
    
    return filtered.sort((a, b) => {
      switch (sortOption) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name_asc":
          return a.student_name.localeCompare(b.student_name);
        case "name_desc":
          return b.student_name.localeCompare(a.student_name);
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
    setDocumentType("all");
    setProcessor("all");
    setDateRange({ from: null, to: null });
    setSortOption("newest");
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

  return (
    <div className="min-h-screen flex">
      <Sidebar 
        userProfile={userProfile} 
        userRoles={userRoles} 
        loading={isLoading} 
      />
      
      <div className="flex-1 p-6 md:p-10">
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

        <div className="mb-6 flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
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
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              className="flex items-center whitespace-nowrap"
              onClick={() => setShowFilters(true)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center whitespace-nowrap">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortOption("newest")}>
                  {sortOption === "newest" && <CheckCircle className="w-4 h-4 mr-2" />}
                  Newest first
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("oldest")}>
                  {sortOption === "oldest" && <CheckCircle className="w-4 h-4 mr-2" />}
                  Oldest first
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("name_asc")}>
                  {sortOption === "name_asc" && <CheckCircle className="w-4 h-4 mr-2" />}
                  Name (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("name_desc")}>
                  {sortOption === "name_desc" && <CheckCircle className="w-4 h-4 mr-2" />}
                  Name (Z-A)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("status")}>
                  {sortOption === "status" && <CheckCircle className="w-4 h-4 mr-2" />}
                  Status
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {(documentType !== "all" || processor !== "all" || dateRange.from || dateRange.to) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {documentType !== "all" && (
              <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                {documentType === "transcript" && "Transcript"}
                {documentType === "certificate" && "Certificate"}
                {documentType === "certification" && "Certification"}
                {documentType === "soa" && "Statement of Account"}
                {documentType === "registration_form" && "Registration Form"}
                {documentType === "com" && "Certificate of Matriculation"}
                {documentType === "coe" && "Certificate of Enrollment"}
                {documentType === "coa" && "Certificate of No Availed Scholarship"}
                {documentType === "others" && "Others"}
                <button
                  onClick={() => setDocumentType("all")}
                  className="ml-2 focus:outline-none"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {processor !== "all" && (
              <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                Processor: {processors.find(p => p.id === processor)?.name}
                <button
                  onClick={() => setProcessor("all")}
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

        <Dialog open={showFilters} onOpenChange={setShowFilters}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Filter Requests</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Document Type</label>
                <ToggleGroup 
                  type="single"
                  variant="outline"
                  className="justify-start flex-wrap"
                  value={documentType}
                  onValueChange={(value) => {
                    if (value) setDocumentType(value as DocumentType);
                  }}
                >
                  <ToggleGroupItem value="all">All</ToggleGroupItem>
                  <ToggleGroupItem value="transcript">Transcript</ToggleGroupItem>
                  <ToggleGroupItem value="certificate">Certificate</ToggleGroupItem>
                  <ToggleGroupItem value="certification">Certification</ToggleGroupItem>
                  <ToggleGroupItem value="soa">Statement of Account</ToggleGroupItem>
                  <ToggleGroupItem value="registration_form">Registration Form</ToggleGroupItem>
                  <ToggleGroupItem value="com">Certificate of Matriculation</ToggleGroupItem>
                  <ToggleGroupItem value="coe">Certificate of Enrollment</ToggleGroupItem>
                  <ToggleGroupItem value="coa">Certificate of No Availed Scholarship</ToggleGroupItem>
                  <ToggleGroupItem value="others">Others</ToggleGroupItem>
                </ToggleGroup>
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium">Processor</label>
                <Select 
                  value={processor} 
                  onValueChange={setProcessor}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a processor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Processors</SelectItem>
                    {processors.map((proc) => (
                      <SelectItem key={proc.id} value={proc.id}>
                        {proc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium">Date Range</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">From</label>
                    <Input
                      type="date"
                      value={dateRange.from || ''}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value || null }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">To</label>
                    <Input
                      type="date"
                      value={dateRange.to || ''}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value || null }))}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={clearFilters}
              >
                Reset
              </Button>
              <DialogClose asChild>
                <Button className="bg-[#0047AB] hover:bg-[#00377e]">
                  Apply Filters
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
