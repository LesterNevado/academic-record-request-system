
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {isStudent && (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">My Requests</h2>
              <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                {requestCount}
              </div>
            </div>
            <p className="text-gray-600">
              {requestCount > 0
                ? `You have ${requestCount} request${requestCount !== 1 ? "s" : ""}`
                : "You have no requests yet"}
            </p>
            <Button
              onClick={() => navigate("/request")}
              className="mt-4 w-full bg-[#0047AB] hover:bg-[#00377e]"
            >
              New Request
            </Button>
          </CardContent>
        </Card>
      )}

      {(isEmployee || isAdmin) && (
        <>
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span>Pending Requests</span>
                </h2>
                <div className="bg-yellow-100 text-yellow-800 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                  {pendingCount}
                </div>
              </div>
              <p className="text-gray-600">Requests awaiting approval</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() =>
                  navigate(isEmployee ? '/employee' : '/admin')
                }
              >
                View Requests
              </Button>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span>Approved Requests</span>
                </h2>
                <div className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                  {approvedCount}
                </div>
              </div>
              <p className="text-gray-600">Requests that have been approved</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() =>
                  navigate(isEmployee ? '/employee' : '/admin')
                }
              >
                View Approved
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
