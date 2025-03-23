
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
}

// Define the role type explicitly to match the database enum
type UserRole = 'student' | 'faculty' | 'admin';

export const UserRoleManager: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState<boolean>(false);
  const [roleLoading, setRoleLoading] = useState<boolean>(false);
  const [userRoles, setUserRoles] = useState<{[key: string]: UserRole[]}>({});
  
  // Fetch users from profiles table
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
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
  
  // Fetch roles for all users
  const fetchAllUserRoles = async (userProfiles: UserProfile[]) => {
    const userIds = userProfiles.map(user => user.id);
    const roles: {[key: string]: UserRole[]} = {};
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds);
    
    if (error) {
      console.error("Error fetching user roles:", error);
      return;
    }
    
    // Group roles by user
    data.forEach(item => {
      if (!roles[item.user_id]) {
        roles[item.user_id] = [];
      }
      roles[item.user_id].push(item.role as UserRole);
    });
    
    setUserRoles(roles);
  };
  
  // Assign role to user
  const assignRole = async () => {
    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }
    
    setRoleLoading(true);
    
    try {
      // First check if the user already has this role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', selectedUser)
        .eq('role', selectedRole)
        .maybeSingle();
      
      if (existingRole) {
        toast.info(`User already has the ${selectedRole} role`);
        setRoleLoading(false);
        return;
      }
      
      // Add the role - admin can manage roles due to the RLS policy we added
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser,
          role: selectedRole
        });
      
      if (error) {
        throw error;
      }
      
      // Update the local state
      const updatedRoles = { ...userRoles };
      if (!updatedRoles[selectedUser]) {
        updatedRoles[selectedUser] = [];
      }
      updatedRoles[selectedUser].push(selectedRole);
      setUserRoles(updatedRoles);
      
      toast.success(`Successfully assigned ${selectedRole} role to user`);
    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error("Failed to assign role");
    } finally {
      setRoleLoading(false);
    }
  };

  // Get user's existing roles
  const getUserRoles = (userId: string): UserRole[] => {
    return userRoles[userId] || [];
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>User Role Management</CardTitle>
        <CardDescription>
          Assign roles to users in the system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select User</label>
          <Select
            disabled={loading || users.length === 0}
            value={selectedUser || undefined}
            onValueChange={setSelectedUser}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name || user.email || user.id.substring(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedUser && (
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm font-medium mb-1">Current Roles:</p>
            {getUserRoles(selectedUser).length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {getUserRoles(selectedUser).map((role, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {role}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No roles assigned</p>
            )}
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Role</label>
          <Select
            value={selectedRole} 
            onValueChange={(value: UserRole) => setSelectedRole(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          className="w-full" 
          onClick={assignRole} 
          disabled={!selectedUser || roleLoading}
        >
          {roleLoading ? "Assigning..." : "Assign Role"}
        </Button>
      </CardContent>
    </Card>
  );
};
