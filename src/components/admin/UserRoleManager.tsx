import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, User, Shield, GraduationCap, Search, Filter, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url?: string;
}

// Define the role type to match the database enum
type UserRole = 'student' | 'faculty' | 'admin';

export const UserRoleManager: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState<boolean>(false);
  const [roleLoading, setRoleLoading] = useState<boolean>(false);
  const [userRoles, setUserRoles] = useState<{[key: string]: UserRole}>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'email' | 'role';
    direction: 'asc' | 'desc';
  }>({
    key: 'name',
    direction: 'asc'
  });
  
  // Fetch users from profiles table
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .order('email');
      
      if (error) {
        toast.error("Failed to load users");
        console.error("Error fetching users:", error);
      } else {
        setUsers(data as UserProfile[]);
        
        // Fetch existing roles for all users
        await fetchAllUserRoles(data as UserProfile[]);
      }
      setLoading(false);
    };
    
    fetchUsers();
  }, []);
  
  // Fetch roles for all users - modified to get only the most recent role
  const fetchAllUserRoles = async (userProfiles: UserProfile[]) => {
    const userIds = userProfiles.map(user => user.id);
    const roles: {[key: string]: UserRole} = {};
    
    // For each user, get their role (there should be only one per user with our new approach)
    for (const userId of userIds) {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error(`Error fetching role for user ${userId}:`, error);
      } else if (data && data.length > 0) {
        // Handle both 'faculty' and 'employee' roles for displaying purposes
        let role = data[0].role as UserRole;
        // For display purposes, store the database role
        roles[userId] = role;
      }
    }
    
    setUserRoles(roles);
  };
  
  // Assign or update role for user
  const assignRole = async (userId: string, roleToAssign: UserRole) => {
    setRoleLoading(true);
    
    try {
      const currentRole = userRoles[userId];
      
      // Don't update if it's the same role
      if (currentRole === roleToAssign) {
        toast.info(`User already has the ${displayRole(roleToAssign)} role`);
        setRoleLoading(false);
        return;
      }
      
      if (currentRole) {
        // User already has a role, so we need to update their existing role
        // First, get the current role entry
        const { data: existingRoleData, error: fetchError } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1);
        
        if (fetchError) {
          throw fetchError;
        }
        
        if (existingRoleData && existingRoleData.length > 0) {
          // Update the existing role
          const { error: updateError } = await supabase
            .from('user_roles')
            .update({ 
              role: roleToAssign,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingRoleData[0].id);
          
          if (updateError) {
            throw updateError;
          }
        } else {
          // This should not happen, but if for some reason we can't find the role record,
          // create a new one
          const { error } = await supabase
            .from('user_roles')
            .insert({
              user_id: userId,
              role: roleToAssign
            });
          
          if (error) throw error;
        }
      } else {
        // User has no role yet, create a new one
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: roleToAssign
          });
        
        if (error) throw error;
      }
      
      // Update the local state
      const updatedRoles = { ...userRoles };
      updatedRoles[userId] = roleToAssign;
      setUserRoles(updatedRoles);
      
      toast.success(`Successfully updated user to ${displayRole(roleToAssign)} role`);
    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error("Failed to assign role");
    } finally {
      setRoleLoading(false);
    }
  };

  // Get user's current role
  const getUserRole = (userId: string): UserRole | null => {
    return userRoles[userId] || null;
  };

  // Convert role display for UI consistency
  const displayRole = (role: UserRole | null): string => {
    if (!role) return 'No role';
    return role === 'faculty' ? 'Employee' : role.charAt(0).toUpperCase() + role.slice(1);
  };

  const filteredAndSortedUsers = React.useMemo(() => {
    let filtered = users.filter(user => 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const aValue = sortConfig.key === 'role' 
        ? userRoles[a.id] || ''
        : sortConfig.key === 'name'
        ? a.full_name || ''
        : a.email || '';
      
      const bValue = sortConfig.key === 'role'
        ? userRoles[b.id] || ''
        : sortConfig.key === 'name'
        ? b.full_name || ''
        : b.email || '';

      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }, [users, searchTerm, sortConfig, userRoles]);

  return (
    <div className="min-h-screen bg-white flex items-start justify-center pt-8">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 lg:px-12">
        {/* Header Section */}
        <header className="bg-transparent mb-4">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 mt-8 mb-8">
            <div className="flex items-center gap-4 mb-2 -ml-4">
              <div className="w-1.5 h-10 bg-gradient-to-b from-blue-500 to-blue-400 rounded-full" />
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 flex items-center gap-2">User Role Manager</h1>
                <p className="mt-1 text-base text-slate-500 font-medium">Assign and manage user roles in the system</p>
              </div>
            </div>
            <div className="border-b border-blue-100 shadow-sm" />
          </div>
        </header>
        {/* Search/Sort Card */}
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 mb-12">
          <div className="bg-white/80 rounded-2xl shadow-2xl border border-blue-200 p-7 flex flex-col sm:flex-row gap-4 items-center transition-all">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-4 rounded-full border border-blue-200 shadow focus:ring-2 focus:ring-blue-200 bg-white/90 focus:outline-none transition-all w-full text-base hover:shadow-lg focus:shadow-lg"
              />
            </div>
            <div className="hidden sm:block h-10 w-px bg-blue-100 mx-2 rounded-full" />
            <div className="flex gap-2 w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="rounded-full h-11 gap-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow hover:scale-105 transition border-0">
                    <ArrowUpDown className="h-5 w-5" />
                    Sort
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="end">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium mb-2">Sort by</h3>
                    <div className="border-b border-gray-200 mb-4" />
                    {[
                      { key: 'name', label: 'Name' },
                      { key: 'role', label: 'Role' }
                    ].map((item) => (
                      <Button
                        key={item.key}
                        variant="ghost"
                        className={`w-full justify-start ${sortConfig.key === item.key ? 'bg-accent' : ''}`}
                        onClick={() => setSortConfig(prev => ({
                          key: item.key as 'name' | 'role',
                          direction: sortConfig.key === item.key ? (sortConfig.direction === 'asc' ? 'desc' : 'asc') : 'asc'
                        }))}
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
            </div>
          </div>
        </div>
        {/* User List Card */}
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 lg:px-12">
          <Card className="w-full rounded-2xl shadow-2xl border border-blue-200 bg-white/80 backdrop-blur-lg">
            <CardContent className="space-y-4 pt-6"> 
              {filteredAndSortedUsers.map((user, idx) => {
                const role = userRoles[user.id] || null;
                let roleColor = '';
                let roleIcon = null;
                if (role === 'admin') {
                  roleColor = 'text-green-700';
                  roleIcon = <Shield className="h-4 w-4 mr-1 text-green-700" />;
                } else if (role === 'faculty') {
                  roleColor = 'text-yellow-700';
                  roleIcon = <User className="h-4 w-4 mr-1 text-yellow-700" />;
                } else {
                  roleColor = 'text-red-700';
                  roleIcon = <GraduationCap className="h-4 w-4 mr-1 text-red-700" />;
                }
                return (
                  <div
                    key={user.id}
                    className="group bg-gradient-to-r from-white to-blue-50 rounded-xl border border-blue-100 shadow hover:shadow-xl hover:border-blue-300 transition p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative"
                  >
                    <div className="flex items-center gap-4">
                      <div className="transition-transform group-hover:scale-105">
                        <Avatar className="h-12 w-12 ring-2 ring-blue-400 shadow">
                          <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || user.email || 'User'} />
                          <AvatarFallback>
                            <User className="h-6 w-6 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <h3 className="font-semibold text-base">{user.full_name || 'Unnamed User'}</h3>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Select
                        value={selectedUser === user.id ? selectedRole : userRoles[user.id] || undefined}
                        onValueChange={async (value: UserRole) => {
                          setSelectedUser(user.id);
                          setSelectedRole(value);
                          await assignRole(user.id, value);
                        }}
                      >
                        <SelectTrigger className="w-[180px] rounded-full border-blue-200 shadow focus:ring-2 focus:ring-blue-200">
                          <div className={`flex items-center gap-2 ${roleColor}`}>
                            {roleIcon}
                            <span>
                              {displayRole(selectedUser === user.id ? selectedRole : userRoles[user.id] || null)}
                            </span>
                          </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-lg">
                          <SelectItem value="student">
                            <span className="flex items-center gap-2 text-red-700">
                              <GraduationCap className="h-4 w-4" />
                              Student
                            </span>
                          </SelectItem>
                          <SelectItem value="faculty">
                            <span className="flex items-center gap-2 text-yellow-700">
                              <User className="h-4 w-4" />
                              Employee
                            </span>
                          </SelectItem>
                          <SelectItem value="admin">
                            <span className="flex items-center gap-2 text-green-700">
                              <Shield className="h-4 w-4" />
                              Admin
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {idx < filteredAndSortedUsers.length - 1 && (
                      <div className="absolute left-4 right-4 -bottom-2 h-px bg-gradient-to-r from-blue-200 via-blue-100 to-blue-200 opacity-60" />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
