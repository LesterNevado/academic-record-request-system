import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { SessionContext } from "../App";
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
  LogOut,
  BookOpen,
  ClipboardList,
  RefreshCw
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
  user_role?: string | null;
};

// Add this helper for colored border
function getActivityIconColor(activityType: string) {
  switch (activityType) {
    case 'login':
      return '#3b82f6'; // blue-500
    case 'sign_out':
      return '#f59e42'; // orange-400
    case 'schedule_pickup':
      return '#22c55e'; // green-500
    case 'approve_request':
      return '#a78bfa'; // purple-400
    default:
      return '#cbd5e1'; // slate-300
  }
}

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
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

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
        let userRole = null;
        
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
          // Fetch user roles for login/sign_out logs
          if (['login', 'sign_out'].includes(log.activity_type)) {
            const { data: userRolesData } = await supabase.rpc('get_user_roles', { user_id: log.user_id });
            if (userRolesData && Array.isArray(userRolesData)) {
              if (userRolesData.includes('admin')) userRole = 'Admin';
              else if (userRolesData.includes('faculty')) userRole = 'Employee';
              else userRole = 'Student';
            }
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
          related_user_name: relatedUserName,
          user_role: userRole,
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
    
    if (roleFilter) {
      result = result.filter(log => log.user_role === roleFilter);
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
  }, [logs, searchTerm, activityFilter, sortConfig, roleFilter]);

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

  const handleSignOut = async () => {
    try {
      if (session?.user?.id) {
        await supabase.rpc('log_activity', {
          p_user_id: session.user.id,
          p_activity_type: 'sign_out',
          p_details: `User signed out - ${session.user.email}`,
          p_related_user_id: null,
          p_related_id: null,
        });
      }
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
          <div className="w-full px-4 sm:px-8 lg:px-12 mb-8">
            <div className="flex items-center gap-4 mb-2 -ml-4">
              <div className="w-1.5 h-10 bg-gradient-to-b from-blue-500 to-blue-400 rounded-full" />
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 flex items-center gap-2">Activity Logs</h1>
                <p className="mt-1 text-base text-slate-500 font-medium">View recent activities in the system</p>
              </div>
            </div>
            <div className="border-b border-blue-100 shadow-sm" />
          </div>

          <div className="w-full px-4 sm:px-8 lg:px-12 mb-12">
            <div className="backdrop-blur-lg bg-white/60 rounded-2xl shadow-2xl border border-blue-100 p-7 flex flex-col sm:flex-row gap-4 items-center transition-all">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  className="pl-12 pr-4 py-4 rounded-full border border-blue-100 shadow focus:ring-2 focus:ring-blue-200 bg-white/80 focus:outline-none transition-all w-full text-base hover:shadow-lg focus:shadow-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="hidden sm:block h-10 w-px bg-blue-100 mx-2 rounded-full" />
              <div className="flex gap-2 w-full sm:w-auto">
                <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="rounded-full h-12 gap-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow hover:scale-105 active:scale-95 transition border-0 focus:ring-2 focus:ring-blue-300">
                      <Filter className="h-5 w-5" />
                      Filter
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="end">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Activity Type</h4>
                        <div className="border-b border-gray-200 mb-2" />
                        <RadioGroup
                          value={activityFilter || ""}
                          onValueChange={(value) => {
                            setActivityFilter(value || null);
                            setFilterPopoverOpen(false);
                          }}
                        >
                          <div className="space-y-4">
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
                          </div>
                        </RadioGroup>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2 mt-4">User Role</h4>
                        <div className="border-b border-gray-200 mb-2" />
                        <RadioGroup
                          value={roleFilter || ""}
                          onValueChange={(value) => {
                            setRoleFilter(value || null);
                            setFilterPopoverOpen(false);
                          }}
                        >
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="" id="role-all" />
                              <Label htmlFor="role-all" className="text-sm">All roles</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Student" id="role-student" />
                              <Label htmlFor="role-student" className="text-sm">Student</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Employee" id="role-employee" />
                              <Label htmlFor="role-employee" className="text-sm">Employee</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Admin" id="role-admin" />
                              <Label htmlFor="role-admin" className="text-sm">Admin</Label>
                            </div>
                          </div>
                        </RadioGroup>
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
                    <Button variant="outline" className="rounded-full h-12 gap-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow hover:scale-105 active:scale-95 transition border-0 focus:ring-2 focus:ring-blue-300">
                      <ArrowUpDown className="h-5 w-5" />
                      Sort
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="end">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium mb-2">Sort by</h3>
                      <div className="border-b border-gray-200 mb-4" />
                      {[
                        { key: 'created_at', label: 'Date & Time' }
                      ].map((item) => (
                        <Button
                          key={item.key}
                          variant="ghost"
                          className={`w-full justify-start ${sortConfig.key === item.key ? 'bg-accent' : ''}`}
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
                <Button onClick={refreshLogs} variant="outline" className="rounded-full h-12 gap-2 border-blue-200 text-blue-700 bg-white hover:bg-blue-50 shadow-sm active:scale-95 focus:ring-2 focus:ring-blue-300">
                  <RefreshCw className="h-5 w-5" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="w-full px-4 sm:px-8 lg:px-12 overflow-x-auto mb-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative flex items-center justify-center mb-4">
                <span className="absolute inline-flex h-20 w-20 rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 opacity-20 animate-ping"></span>
                <svg className="animate-spin h-16 w-16 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              </div>
              <div className="text-blue-700 text-lg font-semibold">Loading activity logs...</div>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-blue-100">
                  <TableRow>
                    <TableHead className="w-[180px]">Date & Time</TableHead>
                    <TableHead className="w-[150px]">Activity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="w-[200px]">Related User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log, idx) => (
                    <TableRow key={log.id} className={`transition group ${idx % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'} hover:bg-blue-100/60`}>
                      <TableCell className="font-medium text-blue-900 border-l-4" style={{ borderColor: getActivityIconColor(log.activity_type) }}>
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span title={getActivityName(log.activity_type)}>
                            {getActivityIcon(log.activity_type)}
                          </span>
                          <span className="font-semibold text-gray-800">{getActivityName(log.activity_type)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700">{log.details}</TableCell>
                      <TableCell>
                        {log.related_user_id ? (
                          <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-2 py-1 group-hover:bg-blue-200/60 transition">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage src={log.related_user_avatar || undefined} />
                              <AvatarFallback>
                                <UserIcon className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-blue-900">{log.related_user_name || "User"}</span>
                          </div>
                        ) : (
                          ['login', 'sign_out'].includes(log.activity_type) ? (
                            <span className="flex items-center gap-2">
                              {log.user_role === 'Admin' && (
                                <span className="rounded px-2 py-0.5 font-semibold text-xs text-white bg-green-500">Admin</span>
                              )}
                              {log.user_role === 'Employee' && (
                                <span className="rounded px-2 py-0.5 font-semibold text-xs text-white bg-yellow-500">Employee</span>
                              )}
                              {log.user_role === 'Student' && (
                                <span className="rounded px-2 py-0.5 font-semibold text-xs text-white bg-blue-500">Student</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">None</span>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow p-10 border border-blue-100 text-center flex flex-col items-center">
              <BookOpen className="w-20 h-20 mx-auto text-blue-200 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-blue-900">No activity logs found</h3>
              <p className="text-blue-700 mb-6">
                {activityFilter ?
                  "No logs match your current filters. Try adjusting your filters or resetting them." :
                  "There are no activity logs recorded yet. Start using the system to see activity here!"}
              </p>
              {activityFilter && (
                <Button
                  onClick={resetFilters}
                  variant="outline"
                  className="mx-auto rounded-full border-blue-200 text-blue-700 bg-white hover:bg-blue-50 shadow-sm"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogs;
