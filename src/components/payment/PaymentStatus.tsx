
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle } from "lucide-react";
import { TablesInsert } from "@/integrations/supabase/types";

export const PaymentStatus: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isSuccess = params.get("success") === "true";
    const sessionId = params.get("session_id");

    const createRequest = async () => {
      try {
        // If payment was successful, create request in the database
        if (isSuccess && sessionId) {
          // Get stored form data
          const storedFormData = localStorage.getItem('pendingRequestData');
          
          if (!storedFormData) {
            throw new Error("Request data not found");
          }
          
          const formData = JSON.parse(storedFormData);
          
          // Check if session has a user
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session?.user) {
            throw new Error("User not authenticated");
          }
          
          // Prepare request data for submission to Supabase
          const requestData: TablesInsert<"requests"> = {
            user_id: session.user.id,
            student_name: formData.studentName,
            student_number: formData.studentNumber,
            contact_number: formData.contactNumber,
            home_address: formData.homeAddress,
            purpose: formData.purpose,
            
            transcript_selected: formData.requestTypes.transcript.selected,
            transcript_copies: formData.requestTypes.transcript.selected ? formData.requestTypes.transcript.copies : null,
            
            certificate_selected: formData.requestTypes.certificate.selected,
            certificate_copies: formData.requestTypes.certificate.selected ? formData.requestTypes.certificate.copies : null,
            
            certification_selected: formData.requestTypes.certification.selected,
            certification_copies: formData.requestTypes.certification.selected ? formData.requestTypes.certification.copies : null,
            certification_details: formData.requestTypes.certification.selected ? formData.requestTypes.certification.details : null,
            
            others_selected: formData.requestTypes.others.selected,
            others_copies: formData.requestTypes.others.selected ? formData.requestTypes.others.copies : null,
            others_details: formData.requestTypes.others.selected ? formData.requestTypes.others.details : null,
            
            status: 'awaiting_pickup'
          };
          
          // Submit to Supabase
          const { error } = await supabase
            .from('requests')
            .insert(requestData);
          
          if (error) {
            throw error;
          }
          
          // Clear stored form data
          localStorage.removeItem('pendingRequestData');
          
          setSuccess(true);
          toast.success("Payment successful! Your request has been created.");
        } else {
          toast.error("Payment was canceled or unsuccessful.");
        }
      } catch (error) {
        console.error("Error creating request:", error);
        toast.error("Error creating your request. Please contact support.");
      } finally {
        setIsProcessing(false);
        
        // Redirect to requests page after 3 seconds
        setTimeout(() => {
          navigate("/requests");
        }, 3000);
      }
    };

    createRequest();
  }, [location.search, navigate]);

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing your request...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-8">
      {success ? (
        <Alert className="max-w-md border-green-200 bg-green-50">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle>Payment Successful</AlertTitle>
          <AlertDescription>
            Your payment has been processed successfully. Your academic records request is waiting for approval.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="max-w-md border-red-200 bg-red-50">
          <XCircle className="h-5 w-5 text-red-600" />
          <AlertTitle>Payment Unsuccessful</AlertTitle>
          <AlertDescription>
            Your payment was not completed. You can try again from the request form page.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
