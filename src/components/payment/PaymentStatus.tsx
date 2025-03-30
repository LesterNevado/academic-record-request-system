
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle } from "lucide-react";
import { TablesInsert } from "@/integrations/supabase/types";
import { notify } from "@/utils/notifications";

export const PaymentStatus: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Extract query parameters
    const params = new URLSearchParams(location.search);
    const isSuccess = params.get("success") === "true";
    const sessionId = params.get("session_id");
    
    // To prevent multiple executions during development with React.StrictMode
    const processedRef = React.useRef(false);

    const createRequest = async () => {
      // Only process if not already processed
      if (processedRef.current) {
        return;
      }
      
      // Mark as processed immediately
      processedRef.current = true;
      
      try {
        // If payment was successful and we have a session ID
        if (isSuccess && sessionId) {
          console.log("Processing payment for session:", sessionId);
          
          // First check if this session has already been processed
          const { data: existingTransaction, error: checkError } = await supabase
            .from('transactions')
            .select('id, request_id')
            .eq('stripe_session_id', sessionId)
            .maybeSingle();
            
          if (checkError) {
            console.error("Error checking existing transaction:", checkError);
          }
          
          // If transaction exists, use its data instead of creating a new request
          if (existingTransaction) {
            console.log("This payment session has already been processed:", existingTransaction);
            setSuccess(true);
            notify.success("Your request is being processed!");
            setIsProcessing(false);
            
            // Redirect to requests page after 3 seconds
            setTimeout(() => {
              navigate("/requests");
            }, 3000);
            return;
          }
          
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
          
          // Since the RPC function may not exist yet or has type issues, let's use a direct approach
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
          
          // Double-check if this session has already been processed (to prevent race conditions)
          const { data: doubleCheckTransaction } = await supabase
            .from('transactions')
            .select('id')
            .eq('stripe_session_id', sessionId)
            .maybeSingle();
            
          if (doubleCheckTransaction) {
            console.log("Transaction already exists (on double-check)");
            setSuccess(true);
            notify.success("Your request is being processed!");
            setIsProcessing(false);
            
            // Redirect to requests page after 3 seconds
            setTimeout(() => {
              navigate("/requests");
            }, 3000);
            return;
          }
          
          // Submit request to Supabase
          const { data: newRequestResult, error: newRequestError } = await supabase
            .from('requests')
            .insert(requestData)
            .select('id')
            .single();
          
          if (newRequestError) {
            throw newRequestError;
          }
          
          // Record transaction in the transactions table
          const transactionData = {
            user_id: session.user.id,
            request_id: newRequestResult.id,
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
          notify.success("Payment successful! Your request is waiting for faculty approval.");
        } else {
          setSuccess(false);
          notify.error("Payment was canceled or unsuccessful.");
        }
      } catch (error) {
        console.error("Error creating request:", error);
        notify.error("Error creating your request. Please contact support.");
        setSuccess(false);
      } finally {
        setIsProcessing(false);
        
        // Redirect to requests page after 3 seconds
        setTimeout(() => {
          navigate("/requests");
        }, 3000);
      }
    };

    // Only run once per component mount
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
