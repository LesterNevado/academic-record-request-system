
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
  AlertCircle,
  UserIcon,
  LogOut
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Update type definition to better handle related user info
type ActivityLog = {
  id: string;
  user_id: string;
  activity_type: string;
  details: string | null;
  related_id: string | null;
  related_user_id: string | null;
  created_at: string;
  related_user_name?: string | null;
  related_user_avatar?: string | null;
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
      try {
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
        
        fetchActivityLogs();
      } catch (error) {
        console.error("Auth check error:", error);
        toast.error("An error occurred while checking access");
        navigate('/dashboard');
      }
    };
    
    checkUserRole();
  }, [session, navigate]);

  const fetchActivityLogs = async () => {
    try {
      console.log("Fetching activity logs...");
      
      // Fetch ALL logs without filtering by user or activity type
      const { data: logsData, error: logsError } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (logsError) {
        console.error("Error fetching activity logs:", logsError);
        toast.error("Failed to load activity logs");
        setLogs([]);
        setFilteredLogs([]);
        setIsLoading(false);
        return;
      } 
      
      console.log("Retrieved logs data:", logsData);
      
      // Process logs to include user profiles information
      const processedLogs: ActivityLog[] = [];
      
      for (const log of logsData) {
        let relatedUserAvatar = null;
        let relatedUserName = null;
        let userName = null;
        
        // Get the user who performed the action
        if (log.user_id) {
          const { data: userProfileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', log.user_id)
            .maybeSingle();
            
          if (userProfileData) {
            userName = userProfileData.full_name;
          }
        }
        
        // If there's a related user (e.g., student for pickup scheduling), fetch their profile info
        if (log.related_user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', log.related_user_id)
            .maybeSingle();
            
          if (profileData) {
            relatedUserAvatar = profileData.avatar_url;
            relatedUserName = profileData.full_name;
          }
        }
        
        // For schedule pickup activities, update the details to include the processor's name
        let details = log.details;
        if (log.activity_type === 'schedule_pickup' && userName) {
          details = `${userName} scheduled pickup for request ${log.related_id} - ${relatedUserName || 'Unknown Student'}`;
        }
        
        processedLogs.push({
          ...log,
          details,
          related_user_avatar: relatedUserAvatar,
          related_user_name: relatedUserName
        });
      }
      
      console.log("Processed logs:", processedLogs);
      setLogs(processedLogs);
      setFilteredLogs(processedLogs);
    } catch (error) {
      console.error("Unexpected error fetching logs:", error);
      toast.error("An unexpected error occurred");
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let result = [...logs];
    
    if (activityFilter) {
      result = result.filter(log => log.activity_type === activityFilter);
    }
    
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      result = result.filter(log => 
        log.details?.toLowerCase().includes(lowercaseSearch) || 
        log.activity_type.toLowerCase().includes(lowercaseSearch) ||
        log.related_user_name?.toLowerCase().includes(lowercaseSearch)
      );
    }
    
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
      case 'sign_out':
        return <LogOut className="h-4 w-4 text-orange-500" />;
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
      case 'sign_out':
        return 'Sign Out';
      case 'schedule_pickup':
        return 'Schedule Pickup';
      case 'approve_request':
        return 'Approve Request';
      default:
        return activityType.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
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

  const refreshLogs = async () => {
    if (!session) return;
    setIsLoading(true);
    await fetchActivityLogs();
    toast.success("Logs refreshed");
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
                onClick={refreshLogs} 
                variant="outline"
                className="mr-2"
              >
                Refresh
              </Button>
            </div>
          </div>
          <p className="text-gray-600 mt-2">View recent activities in the system</p>
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
                      <RadioGroupItem value="sign_out" id="activity-sign-out" />
                      <Label htmlFor="activity-sign-out" className="text-sm">Sign Out</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="schedule_pickup" id="activity-schedule" />
                      <Label htmlFor="activity-schedule" className="text-sm">Schedule Pickup</Label>
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
                  <TableHead className="w-[200px]">Related User</TableHead>
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
                    <TableCell>
                      {log.related_user_id ? (
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={log.related_user_avatar || undefined} />
                            <AvatarFallback>
                              <UserIcon className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {log.related_user_name || "User"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">None</span>
                      )}
                    </TableCell>
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
                "There are no activity logs recorded yet."}
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
