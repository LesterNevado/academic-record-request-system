
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
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
  const assignRole = async () => {
    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }
    
    setRoleLoading(true);
    
    try {
      const currentRole = userRoles[selectedUser];
      const roleToAssign = selectedRole;
      
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
          .eq('user_id', selectedUser)
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
              user_id: selectedUser,
              role: roleToAssign
            });
          
          if (error) throw error;
        }
      } else {
        // User has no role yet, create a new one
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: selectedUser,
            role: roleToAssign
          });
        
        if (error) throw error;
      }
      
      // Update the local state
      const updatedRoles = { ...userRoles };
      updatedRoles[selectedUser] = roleToAssign;
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
            onValueChange={(value) => {
              setSelectedUser(value);
              // Set the selected role to match the user's current role, if they have one
              const userRole = userRoles[value];
              if (userRole) {
                setSelectedRole(userRole);
              } else {
                setSelectedRole('student');
              }
            }}
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
            <p className="text-sm font-medium mb-1">Current Role:</p>
            {getUserRole(selectedUser) ? (
              <div className="flex flex-wrap gap-1">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {displayRole(getUserRole(selectedUser))}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No role assigned</p>
            )}
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Role</label>
          <RadioGroup 
            value={selectedRole} 
            onValueChange={(value: UserRole) => setSelectedRole(value)}
            className="flex flex-col space-y-2 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="student" id="student" />
              <Label htmlFor="student">Student</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="faculty" id="faculty" />
              <Label htmlFor="faculty">Employee</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="admin" id="admin" />
              <Label htmlFor="admin">Admin</Label>
            </div>
          </RadioGroup>
        </div>
        
        <Button 
          className="w-full" 
          onClick={assignRole} 
          disabled={!selectedUser || roleLoading}
        >
          {roleLoading ? "Updating..." : "Update Role"}
        </Button>
      </CardContent>
    </Card>
  );
};
