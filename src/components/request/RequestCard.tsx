
import React from 'react';
import { Request, getRequestType } from '@/utils/requestUtils';
import { format } from 'date-fns';
import { Clock, CheckCircle, XCircle, Package, MessageCircle } from "lucide-react";

interface RequestCardProps {
  request: Request;
}

export const RequestCard: React.FC<RequestCardProps> = ({ request }) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:border-[#0047AB] transition-colors">
      <div className="flex justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{request.student_name}</h3>
          <p className="text-gray-600 text-sm">Type: {getRequestType(request)}</p>
          <p className="text-gray-600 text-sm">Student Number: {request.student_number}</p>
          <p className="text-gray-600 text-sm">Submitted: {formatDate(request.created_at)}</p>
          
          {request.status === 'approved' && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-gray-600 text-sm">
                <span className="font-medium">Processed by:</span> {request.processor_name || 'Staff Member'}
              </p>
              {request.pickup_date && (
                <p className="text-gray-600 text-sm">
                  <span className="font-medium">Pickup Date:</span> {formatDate(request.pickup_date)}
                </p>
              )}
              {request.notes && (
                <div className="mt-2">
                  <p className="text-gray-600 text-sm font-medium flex items-center">
                    <MessageCircle className="w-3 h-3 mr-1" /> Notes:
                  </p>
                  <p className="text-gray-600 text-sm pl-4 mt-1 italic">{request.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-start ml-4">
          {request.status === 'pending' && (
            <span className="flex items-center text-amber-600">
              <Clock className="w-4 h-4 mr-1" />
              Pending
            </span>
          )}
          {request.status === 'awaiting_pickup' && (
            <span className="flex flex-col items-end text-yellow-600">
              <Package className="w-4 h-4 mb-1" />
              <span>Payment Successful</span>
              <span>Waiting for Approval</span>
            </span>
          )}
          {request.status === 'approved' && (
            <span className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              Approved
            </span>
          )}
          {request.status === 'rejected' && (
            <span className="flex items-center text-red-600">
              <XCircle className="w-4 h-4 mr-1" />
              Rejected
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
