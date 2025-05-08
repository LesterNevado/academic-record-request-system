import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText, Clock, CheckCircle, Shield } from "lucide-react";

interface DashboardCardsProps {
  isStudent: boolean;
  isEmployee: boolean;
  isAdmin: boolean;
  requestCount: number;
  pendingCount: number;
  approvedCount: number;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({
  isStudent,
  isEmployee,
  isAdmin,
  requestCount,
  pendingCount,
  approvedCount
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-10 flex-wrap justify-center items-center w-full">
      {isStudent && (
        <Card className="w-full max-w-xs sm:max-w-sm rounded-2xl border border-gray-200 shadow-md bg-white hover:shadow-xl hover:border-blue-300 hover:bg-blue-50/30 transition-transform hover:scale-[1.03] group flex-shrink-0">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <FileText className="w-10 h-10 text-blue-500 bg-blue-100 rounded-full p-2 shadow group-hover:bg-blue-200 transition" />
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold">My Requests</h2>
                  <p className="text-slate-500 text-sm">All your submitted requests</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-200 to-blue-400 text-blue-900 rounded-full w-10 h-10 flex items-center justify-center font-extrabold text-lg shadow-lg border-4 border-white group-hover:scale-110 transition">
                {requestCount}
              </div>
            </div>
            <Button
              onClick={() => navigate("/request")}
              className="mt-2 w-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow hover:scale-105 hover:shadow-lg transition text-base font-semibold py-3"
            >
              New Request
            </Button>
          </CardContent>
        </Card>
      )}

      {isEmployee && (
        <>
          <Card className="w-full max-w-xs sm:max-w-sm rounded-2xl border border-gray-200 shadow-md bg-white hover:shadow-xl hover:border-yellow-300 hover:bg-yellow-50/30 transition-transform hover:scale-[1.03] group flex-shrink-0">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <Clock className="w-10 h-10 text-yellow-500 bg-yellow-100 rounded-full p-2 shadow group-hover:bg-yellow-200 transition" />
                  <div className="min-w-0">
                    <h2 className="text-xl font-extrabold">Pending Requests</h2>
                    <p className="text-slate-500 text-sm">Requests awaiting approval</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-200 to-yellow-400 text-yellow-900 rounded-full w-10 h-10 flex items-center justify-center font-extrabold text-lg shadow-lg border-4 border-white group-hover:scale-110 transition">
                  {pendingCount}
                </div>
              </div>
              <Button
                className="mt-2 w-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow hover:scale-105 hover:shadow-lg transition text-base font-semibold py-3"
                onClick={() => navigate('/employee')}
              >
                View Requests
              </Button>
            </CardContent>
          </Card>
          <Card className="w-full max-w-xs sm:max-w-sm rounded-2xl border border-gray-200 shadow-md bg-white hover:shadow-xl hover:border-green-300 hover:bg-green-50/30 transition-transform hover:scale-[1.03] group flex-shrink-0">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <CheckCircle className="w-10 h-10 text-green-500 bg-green-100 rounded-full p-2 shadow group-hover:bg-green-200 transition" />
                  <div className="min-w-0">
                    <h2 className="text-xl font-extrabold">Approved Requests</h2>
                    <p className="text-slate-500 text-sm">Requests that have been approved</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-200 to-green-400 text-green-900 rounded-full w-10 h-10 flex items-center justify-center font-extrabold text-lg shadow-lg border-4 border-white group-hover:scale-110 transition">
                  {approvedCount}
                </div>
              </div>
              <Button
                className="mt-2 w-full rounded-full bg-gradient-to-r from-green-400 to-green-500 text-white shadow hover:scale-105 hover:shadow-lg transition text-base font-semibold py-3"
                onClick={() => navigate('/employee?tab=approved')}
              >
                View Approved
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {isAdmin && (
        <Card className="w-full max-w-xs sm:max-w-sm rounded-2xl border border-gray-200 shadow-md bg-white hover:shadow-xl hover:border-green-300 hover:bg-green-50/30 transition-transform hover:scale-[1.03] group flex-shrink-0">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Shield className="w-10 h-10 text-green-500 bg-green-100 rounded-full p-2 shadow group-hover:bg-green-200 transition" />
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold">Admin Portal</h2>
                  <p className="text-slate-500 text-sm">Manage users and system settings</p>
                </div>
              </div>
            </div>
            <Button
              className="mt-2 w-full rounded-full bg-gradient-to-r from-green-400 to-green-500 text-white shadow hover:scale-105 hover:shadow-lg transition text-base font-semibold py-3"
              onClick={() => navigate('/admin')}
            >
              Go to Admin Portal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
