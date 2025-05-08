import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import CTCIndicator from "@/components/ui/CTCIndicator";
import { Request } from "@/utils/requestUtils";

interface RequestDetailTableProps {
  request: Request;
}

export const RequestDetailTable: React.FC<RequestDetailTableProps> = ({ request }) => {
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
      case 'awaiting_pickup':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Awaiting Pickup</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
    <Table>
      <TableCaption>Request Details</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Document Type</TableHead>
          <TableHead>Copies</TableHead>
          <TableHead className="text-center">CTC/Dry Seal</TableHead>
          <TableHead>Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {request.certificate_selected && (
          <TableRow>
            <TableCell className="font-medium">Certificate of Grades (COG)</TableCell>
            <TableCell>{request.certificate_copies || 1}</TableCell>
            <TableCell className="text-center">
              <CTCIndicator hasCTC={Boolean(request.certificate_ctc)} />
            </TableCell>
            <TableCell>-</TableCell>
          </TableRow>
        )}
        {request.registration_form_selected && (
          <TableRow>
            <TableCell className="font-medium">Registration Form</TableCell>
            <TableCell>{request.registration_form_copies || 1}</TableCell>
            <TableCell className="text-center">
              <CTCIndicator hasCTC={Boolean(request.registration_form_ctc)} />
            </TableCell>
            <TableCell>{request.registration_form_details || "-"}</TableCell>
          </TableRow>
        )}
        {request.com_selected && (
          <TableRow>
            <TableCell className="font-medium">Certificate of Matriculation (COM)</TableCell>
            <TableCell>{request.com_copies || 1}</TableCell>
            <TableCell className="text-center">
              <CTCIndicator hasCTC={Boolean(request.com_ctc)} />
            </TableCell>
            <TableCell>-</TableCell>
          </TableRow>
        )}
        {request.coe_selected && (
          <TableRow>
            <TableCell className="font-medium">Certificate of Enrollment (COE)</TableCell>
            <TableCell>{request.coe_copies || 1}</TableCell>
            <TableCell className="text-center">
              <CTCIndicator hasCTC={Boolean(request.coe_ctc)} />
            </TableCell>
            <TableCell>-</TableCell>
          </TableRow>
        )}
        {request.coa_selected && (
          <TableRow>
            <TableCell className="font-medium">Certificate of No Availed Scholarship</TableCell>
            <TableCell>{request.coa_copies || 1}</TableCell>
            <TableCell className="text-center">
              <CTCIndicator hasCTC={Boolean(request.coa_ctc)} />
            </TableCell>
            <TableCell>-</TableCell>
          </TableRow>
        )}
        {request.soa_selected && (
          <TableRow>
            <TableCell className="font-medium">Statement of Account (SOA)</TableCell>
            <TableCell>{request.soa_copies || 1}</TableCell>
            <TableCell className="text-center">
              <CTCIndicator hasCTC={Boolean(request.soa_ctc)} />
            </TableCell>
            <TableCell>-</TableCell>
          </TableRow>
        )}
        {request.certification_selected && (
          <TableRow>
            <TableCell className="font-medium">Certification</TableCell>
            <TableCell>{request.certification_copies || 1}</TableCell>
            <TableCell className="text-center">
              <CTCIndicator hasCTC={Boolean(request.certification_ctc)} />
            </TableCell>
            <TableCell>{request.certification_details || "-"}</TableCell>
          </TableRow>
        )}
        {request.others_selected && (
          <TableRow>
            <TableCell className="font-medium">Others</TableCell>
            <TableCell>{request.others_copies || 1}</TableCell>
            <TableCell className="text-center">
              <CTCIndicator hasCTC={Boolean(request.others_ctc)} />
            </TableCell>
            <TableCell>{request.others_details || "-"}</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
