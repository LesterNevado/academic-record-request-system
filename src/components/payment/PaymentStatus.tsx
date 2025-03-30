
import React, { useEffect, useState, useRef } from "react";
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
  const requestProcessedRef = useRef(false);

  useEffect(() => {
    // Only proceed if we haven't processed this request yet
    if (requestProcessedRef.current) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const isSuccess = params.get("success") === "true";
    const sessionId = params.get("session_id");

    const createRequest = async () => {
      try {
        // If payment was successful, create request in the database
        if (isSuccess && sessionId) {
          // Mark as processed to prevent duplicate requests
          requestProcessedRef.current = true;
          
          // Get stored form data
          const storedFormData = localStorage.getItem('pendingRequestData');
          const storedAmount = localStorage.getItem('pendingPaymentAmount');
          
          if (!storedFormData) {
            throw new Error("Request data not found");
          }
          
          const formData = JSON.parse(storedFormData);
          const paymentAmount = storedAmount ? parseFloat(storedAmount) : 0;
          
          // Check if session has a user
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session?.user) {
            throw new Error("User not authenticated");
          }

          // First check if transaction with this session ID already exists (to prevent duplicates)
          const { data: existingTransaction } = await supabase
            .from('transactions')
            .select('id, request_id')
            .eq('stripe_session_id', sessionId)
            .single();

          if (existingTransaction) {
            console.log("Transaction already exists for this session ID:", existingTransaction);
            // Transaction already exists, just set success state and show message
            setSuccess(true);
            toast.success("Payment successful! Your request is waiting for faculty approval.");
            // Clear stored form data
            localStorage.removeItem('pendingRequestData');
            localStorage.removeItem('pendingPaymentAmount');
            localStorage.removeItem('pendingSessionId');
            setIsProcessing(false);
            
            // Redirect to requests page after 3 seconds
            setTimeout(() => {
              navigate("/requests");
            }, 3000);
            return;
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
            
            status: 'awaiting_pickup',
            pickup_date: null,
            processed_by: null,
            notes: null
          };
          
          // Submit request to Supabase
          const { data: requestResult, error: requestError } = await supabase
            .from('requests')
            .insert(requestData)
            .select('id')
            .single();
          
          if (requestError) {
            throw requestError;
          }
          
          // Record transaction in the transactions table
          const transactionData = {
            user_id: session.user.id,
            request_id: requestResult.id,
            amount: paymentAmount,
            payment_status: 'successful',
            payment_method: 'card',
            stripe_session_id: sessionId
          };
          
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert(transactionData);
            
          if (transactionError) {
            console.error("Error recording transaction:", transactionError);
            // Continue despite transaction recording error, as the request was created
          }
          
          // Clear stored form data
          localStorage.removeItem('pendingRequestData');
          localStorage.removeItem('pendingPaymentAmount');
          localStorage.removeItem('pendingSessionId');
          
          setSuccess(true);
          toast.success("Payment successful! Your request is waiting for faculty approval.");
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
            Your payment has been processed successfully. Your academic records request will be processed by a faculty member who will schedule a pickup date.
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
