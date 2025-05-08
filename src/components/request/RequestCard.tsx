import React from 'react';
import { Request, getRequestType } from '@/utils/requestUtils';
import { format } from 'date-fns';
import { Clock, CheckCircle, XCircle, Package, MessageCircle } from "lucide-react";

interface RequestCardProps {
  request: Request;
}

export const RequestCard: React.FC<RequestCardProps> = ({ request }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString || typeof dateString !== 'string') return 'N/A';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts.map(Number);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Intl.DateTimeFormat('en-PH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }).format(new Date(year, month - 1, day));
      }
    }
    return dateString;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:border-[#0047AB] transition-colors">
      <div className="flex justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{request.student_name}</h3>
          <p className="text-gray-600 text-sm">Type:</p>
          <ul className="text-gray-600 text-sm ml-2 list-disc">
            {request.certificate_selected && (
              <li>Certificate of Grades (COG): {request.certificate_copies || 1} copy{(request.certificate_copies || 1) > 1 ? 'ies' : 'y'}, CTC/Dry Seal: {request.certificate_ctc ? 'Yes' : 'No'}</li>
            )}
            {request.registration_form_selected && (
              <li>Registration Form: {request.registration_form_copies || 1} copy{(request.registration_form_copies || 1) > 1 ? 'ies' : 'y'}, CTC/Dry Seal: {request.registration_form_ctc ? 'Yes' : 'No'}</li>
            )}
            {request.com_selected && (
              <li>Certificate of Matriculation (COM): {request.com_copies || 1} copy{(request.com_copies || 1) > 1 ? 'ies' : 'y'}, CTC/Dry Seal: {request.com_ctc ? 'Yes' : 'No'}</li>
            )}
            {request.coe_selected && (
              <li>Certificate of Enrollment (COE): {request.coe_copies || 1} copy{(request.coe_copies || 1) > 1 ? 'ies' : 'y'}, CTC/Dry Seal: {request.coe_ctc ? 'Yes' : 'No'}</li>
            )}
            {request.coa_selected && (
              <li>Certificate of No Availed Scholarship (COA): {request.coa_copies || 1} copy{(request.coa_copies || 1) > 1 ? 'ies' : 'y'}, CTC/Dry Seal: {request.coa_ctc ? 'Yes' : 'No'}</li>
            )}
            {request.soa_selected && (
              <li>Statement of Account (SOA): {request.soa_copies || 1} copy{(request.soa_copies || 1) > 1 ? 'ies' : 'y'}, CTC/Dry Seal: {request.soa_ctc ? 'Yes' : 'No'}</li>
            )}
            {request.certification_selected && (
              <li>Certification: {request.certification_copies || 1} copy{(request.certification_copies || 1) > 1 ? 'ies' : 'y'}, CTC/Dry Seal: {request.certification_ctc ? 'Yes' : 'No'}</li>
            )}
            {request.others_selected && (
              <li>Others: {request.others_copies || 1} copy{(request.others_copies || 1) > 1 ? 'ies' : 'y'}, CTC/Dry Seal: {request.others_ctc ? 'Yes' : 'No'}</li>
            )}
          </ul>
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
