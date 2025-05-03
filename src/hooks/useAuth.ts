
import { useContext, useEffect, useState } from "react";
import { SessionContext } from "@/App";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type UserRole = 'student' | 'faculty' | 'admin';

interface UserProfile {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export const useAuth = () => {
  const navigate = useNavigate();
  const { session, userRoles = [] } = useContext(SessionContext);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: null,
    email: null,
    avatarUrl: null
  });
  const [roles, setRoles] = useState<UserRole[]>(userRoles || []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
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

        // Get user roles from Supabase
        const { data: fetchedRoles, error: rolesError } = await supabase.rpc(
          'get_user_roles',
          { user_id: user.id }
        );

        if (rolesError) {
          console.error("Error fetching roles:", rolesError);
        } else {
          setRoles(fetchedRoles || []);
        }
      } catch (err) {
        console.error("Error getting user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session, navigate]);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(`Logout failed: ${error.message}`);
      } else {
        toast.success("Successfully logged out");
        navigate("/");
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isStudent = roles.length === 0 || (roles.length === 1 && roles.includes('student'));
  const isFaculty = roles.includes('faculty');
  const isAdmin = roles.includes('admin');

  return {
    session,
    userProfile,
    roles,
    loading,
    isStudent,
    isFaculty,
    isAdmin,
    handleSignOut
  };
};
