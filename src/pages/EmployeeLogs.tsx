
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { SessionContext } from "../App";
import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Clock, 
  Search, 
  CalendarClock, 
  LogIn, 
  Filter, 
  ArrowUpDown,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Define types for our activity logs
type ActivityLog = {
  id: string;
  user_id: string;
  activity_type: string;
  details: string | null;
  related_id: string | null;
  created_at: string;
};

// For simplicity, we'll simulate log data since we don't have an actual logs table
// In a real implementation, you would fetch this from a logs table in Supabase
const generateMockLogs = (userId: string): ActivityLog[] => {
  const now = new Date();
  
  return [
    {
      id: "1",
      user_id: userId,
      activity_type: "login",
      details: "User logged in successfully",
      related_id: null,
      created_at: new Date(now.getTime() - 7200000).toISOString() // 2 hours ago
    },
    {
      id: "2",
      user_id: userId,
      activity_type: "schedule_pickup",
      details: "Scheduled pickup for request from John Smith (2023-00123)",
      related_id: "req-123",
      created_at: new Date(now.getTime() - 5400000).toISOString() // 1.5 hours ago
    },
    {
      id: "3",
      user_id: userId,
      activity_type: "approve_request",
      details: "Approved request from Maria Garcia (2023-00456)",
      related_id: "req-456",
      created_at: new Date(now.getTime() - 3600000).toISOString() // 1 hour ago
    },
    {
      id: "4",
      user_id: userId,
      activity_type: "login",
      details: "User logged in successfully",
      related_id: null,
      created_at: new Date(now.getTime() - 86400000).toISOString() // 1 day ago
    },
    {
      id: "5",
      user_id: userId,
      activity_type: "schedule_pickup",
      details: "Scheduled pickup for request from Sam Wilson (2023-00789)",
      related_id: "req-789",
      created_at: new Date(now.getTime() - 172800000).toISOString() // 2 days ago
    }
  ];
};

const EmployeeLogs: React.FC = () => {
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
  
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [sortPopoverOpen, setSortPopoverOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({
    key: 'created_at',
    direction: 'desc'
  });

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

      // In a real app, fetch logs from the database
      // For now, we'll use mock data
      const mockLogs = generateMockLogs(user.id);
      setLogs(mockLogs);
      setFilteredLogs(mockLogs);
      
      setIsLoading(false);
    };
    
    checkUserRole();
  }, [session, navigate]);

  // Apply filters and search to logs
  useEffect(() => {
    let result = [...logs];
    
    // Apply activity type filter
    if (activityFilter) {
      result = result.filter(log => log.activity_type === activityFilter);
    }
    
    // Apply search
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      result = result.filter(log => 
        log.details?.toLowerCase().includes(lowercaseSearch) || 
        log.activity_type.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    // Apply sorting
    result = result.sort((a, b) => {
      if (sortConfig.key === 'created_at') {
        return sortConfig.direction === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });
    
    setFilteredLogs(result);
  }, [logs, searchTerm, activityFilter, sortConfig]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy HH:mm');
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'login':
        return <LogIn className="h-4 w-4 text-blue-500" />;
      case 'schedule_pickup':
        return <CalendarClock className="h-4 w-4 text-green-500" />;
      case 'approve_request':
        return <CheckCircle2 className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityName = (activityType: string): string => {
    switch (activityType) {
      case 'login':
        return 'Login';
      case 'schedule_pickup':
        return 'Schedule Pickup';
      case 'approve_request':
        return 'Approve Request';
      default:
        return activityType.replace('_', ' ');
    }
  };

  const handleSortChange = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
    setSortPopoverOpen(false);
  };

  const resetFilters = () => {
    setActivityFilter(null);
    setSearchTerm('');
    setFilterPopoverOpen(false);
  };

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
            <h1 className="text-3xl font-bold">Activity Logs</h1>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  // In a real app, this would refresh logs from the database
                  toast.success("Logs refreshed");
                }} 
                variant="outline"
                className="mr-2"
              >
                Refresh
              </Button>
            </div>
          </div>
          <p className="text-gray-600 mt-2">View your recent activities in the system</p>
        </header>

        <div className="mb-6 flex space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
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
                {activityFilter && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium rounded-full px-2 py-0.5">
                    1
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="bg-white p-4 rounded-lg border border-gray-200 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Filter Activities</h3>
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
                  <h4 className="text-sm font-medium mb-2">Activity Type</h4>
                  <RadioGroup 
                    value={activityFilter || ""} 
                    onValueChange={(value) => setActivityFilter(value || null)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="" id="activity-all" />
                      <Label htmlFor="activity-all" className="text-sm">All activities</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="login" id="activity-login" />
                      <Label htmlFor="activity-login" className="text-sm">Login</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="schedule_pickup" id="activity-schedule" />
                      <Label htmlFor="activity-schedule" className="text-sm">Schedule Pickup</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="approve_request" id="activity-approve" />
                      <Label htmlFor="activity-approve" className="text-sm">Approve Request</Label>
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
                  <span className="text-sm">Date & Time</span>
                  <span className="text-blue-600">
                    {sortConfig.key === 'created_at' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-10 border border-gray-200 text-center">
            <p>Loading activity logs...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Date & Time</TableHead>
                  <TableHead className="w-[150px]">Activity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getActivityIcon(log.activity_type)}
                        <span className="ml-2">{getActivityName(log.activity_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-10 border border-gray-200 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No activity logs found</h3>
            <p className="text-gray-600 mb-6">
              {activityFilter ? 
                "No logs match your current filters. Try adjusting your filters or resetting them." : 
                "There are no activity logs recorded for your account yet."}
            </p>
            {activityFilter && (
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
      </div>
    </div>
  );
};

export default EmployeeLogs;
