
import React from "react";
import { UserRoleManager } from "@/components/admin/UserRoleManager";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto py-10 px-4">
      <Button
        variant="outline"
        onClick={() => navigate('/dashboard')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <h1 className="text-3xl font-bold mb-8 text-center">Admin Portal</h1>
      
      <UserRoleManager />
    </div>
  );
};

export default AdminPage;
