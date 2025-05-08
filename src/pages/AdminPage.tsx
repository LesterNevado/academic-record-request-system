import React from "react";
import { UserRoleManager } from "@/components/admin/UserRoleManager";

const AdminPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="container mx-auto py-10 px-4">
        <UserRoleManager />
      </div>
    </div>
  );
};

export default AdminPage;
