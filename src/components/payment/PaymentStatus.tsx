
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
  const processingInProgress = useRef(false);

  useEffect(() => {
    // Function to process the payment result
    const processPaymentResult = async () => {
      // Only proceed if we haven't processed this request yet and no processing is in progress
      if (requestProcessedRef.current || processingInProgress.current) {
        console.log("Request already processed or processing in progress, preventing duplicate processing");
        return;
      }

      // Set processing flag to prevent concurrent processing attempts
      processingInProgress.current = true;
      
      try {
        const params = new URLSearchParams(location.search);
        // Check if status is explicitly "success" or check for session_id which indicates success too
        const isSuccess = params.get("status") === "success" || params.get("session_id") !== null;
        const sessionId = params.get("session_id");
        const clientReferenceId = params.get("ref");

        console.log("Payment status page loaded with params:", { 
          status: params.get("status"),
          success: isSuccess, 
          sessionId: sessionId ? `${sessionId.substring(0, 5)}...` : null,
          ref: clientReferenceId
        });

        // If payment was successful, create request in the database
        if (isSuccess && sessionId) {
          // Mark as processed to prevent duplicate requests within the same browser session
          requestProcessedRef.current = true;
          console.log("Processing payment success with session ID:", sessionId.substring(0, 5) + "...");
          
          // Get stored form data
          const storedFormData = localStorage.getItem('pendingRequestData');
          const storedAmount = localStorage.getItem('pendingPaymentAmount');
          
          if (!storedFormData) {
            console.error("Request data not found in localStorage");
            throw new Error("Request data not found");
          }
          
          const formData = JSON.parse(storedFormData);
          const paymentAmount = storedAmount ? parseFloat(storedAmount) : 0;
          
          console.log("Retrieved form data from localStorage:", {
            studentName: formData.studentName,
            amount: paymentAmount,
            requestTypes: Object.keys(formData.requestTypes)
              .filter(key => formData.requestTypes[key] && formData.requestTypes[key].selected)
              .map(key => key)
          });
          
          // Check if session has a user
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session?.user) {
            console.error("User not authenticated");
            throw new Error("User not authenticated");
          }
          
          console.log("User authenticated:", session.user.id.substring(0, 8) + "...");

          // First check if transaction with this session ID already exists (to prevent duplicates)
          console.log("Checking if transaction already exists for session ID:", sessionId.substring(0, 5) + "...");
          const { data: existingTransaction, error: txCheckError } = await supabase
            .from('transactions')
            .select('id, request_id')
            .eq('stripe_session_id', sessionId)
            .maybeSingle();
            
          if (txCheckError) {
            console.error("Error checking for existing transaction:", txCheckError);
          }

          if (existingTransaction && existingTransaction.request_id) {
            console.log("Transaction already exists with linked request:", existingTransaction);
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
            client_reference_id: clientReferenceId || null,
            status: 'awaiting_pickup', // Set status directly to 'awaiting_pickup'
            
            // Document type selections and copies
            certificate_selected: formData.requestTypes.certificate && formData.requestTypes.certificate.selected ? true : false,
            certificate_copies: formData.requestTypes.certificate && formData.requestTypes.certificate.selected ? formData.requestTypes.certificate.copies : null,
            certificate_ctc: formData.requestTypes.certificate && formData.requestTypes.certificate.selected ? formData.requestTypes.certificate.ctc : false,
            
            certification_selected: formData.requestTypes.certification && formData.requestTypes.certification.selected ? true : false,
            certification_copies: formData.requestTypes.certification && formData.requestTypes.certification.selected ? formData.requestTypes.certification.copies : null,
            certification_ctc: formData.requestTypes.certification && formData.requestTypes.certification.selected ? formData.requestTypes.certification.ctc : false,
            certification_details: formData.requestTypes.certification && formData.requestTypes.certification.selected ? formData.requestTypes.certification.details : null,
            
            others_selected: formData.requestTypes.others && formData.requestTypes.others.selected ? true : false,
            others_copies: formData.requestTypes.others && formData.requestTypes.others.selected ? formData.requestTypes.others.copies : null,
            others_ctc: formData.requestTypes.others && formData.requestTypes.others.selected ? formData.requestTypes.others.ctc : false,
            others_details: formData.requestTypes.others && formData.requestTypes.others.selected ? formData.requestTypes.others.details : null,
            
            soa_selected: formData.requestTypes.soa && formData.requestTypes.soa.selected ? true : false,
            soa_copies: formData.requestTypes.soa && formData.requestTypes.soa.selected ? formData.requestTypes.soa.copies : null,
            soa_ctc: formData.requestTypes.soa && formData.requestTypes.soa.selected ? formData.requestTypes.soa.ctc : false,
            
            registration_form_selected: formData.requestTypes.registrationForm && formData.requestTypes.registrationForm.selected ? true : false,
            registration_form_copies: formData.requestTypes.registrationForm && formData.requestTypes.registrationForm.selected ? formData.requestTypes.registrationForm.copies : null,
            registration_form_ctc: formData.requestTypes.registrationForm && formData.requestTypes.registrationForm.selected ? formData.requestTypes.registrationForm.ctc : false,
            registration_form_details: formData.requestTypes.registrationForm && formData.requestTypes.registrationForm.selected ? formData.requestTypes.registrationForm.details : null,
            
            com_selected: formData.requestTypes.com && formData.requestTypes.com.selected ? true : false,
            com_copies: formData.requestTypes.com && formData.requestTypes.com.selected ? formData.requestTypes.com.copies : null,
            com_ctc: formData.requestTypes.com && formData.requestTypes.com.selected ? formData.requestTypes.com.ctc : false,
            
            coe_selected: formData.requestTypes.coe && formData.requestTypes.coe.selected ? true : false,
            coe_copies: formData.requestTypes.coe && formData.requestTypes.coe.selected ? formData.requestTypes.coe.copies : null,
            coe_ctc: formData.requestTypes.coe && formData.requestTypes.coe.selected ? formData.requestTypes.coe.ctc : false,
            
            coa_selected: formData.requestTypes.coa && formData.requestTypes.coa.selected ? true : false,
            coa_copies: formData.requestTypes.coa && formData.requestTypes.coa.selected ? formData.requestTypes.coa.copies : null,
            coa_ctc: formData.requestTypes.coa && formData.requestTypes.coa.selected ? formData.requestTypes.coa.ctc : false,
            
            pickup_date: null,
            processed_by: null,
            notes: null,
            
            // Remove transcript fields
            transcript_selected: false,
            transcript_copies: null,
            transcript_ctc: false
          };
          
          // Submit request to Supabase
          console.log("Creating request in database...");
          const { data: requestResult, error: requestError } = await supabase
            .from('requests')
            .insert(requestData)
            .select('id')
            .single();
          
          if (requestError) {
            console.error("Error creating request:", requestError);
            throw requestError;
          }
          
          const requestId = requestResult.id;
          console.log("Request created successfully with ID:", requestId);
          
          // Call the create_transaction_if_not_exists RPC function to ensure atomic transaction creation
          console.log("Recording transaction with session ID:", sessionId.substring(0, 5) + "...");
          const { data: transactionResult, error: transactionError } = await supabase
            .rpc('create_transaction_if_not_exists', {
              p_user_id: session.user.id,
              p_request_id: requestId,
              p_amount: paymentAmount,
              p_payment_status: 'successful',
              p_payment_method: 'card',
              p_stripe_session_id: sessionId
            });
            
          if (transactionError) {
            console.error("Error recording transaction:", transactionError);
            // We'll continue despite transaction recording error, as the request was created
            toast.error("Note: There was an issue recording your payment details, but your request has been submitted.");
          } else {
            console.log("Transaction recorded successfully:", transactionResult);
            const result = transactionResult as { id: string, request_id: string, exists: boolean };
            if (result.exists) {
              console.log("Transaction already existed in database");
            } else {
              console.log("Created new transaction record");
            }
          }
          
          // Clear stored form data
          localStorage.removeItem('pendingRequestData');
          localStorage.removeItem('pendingPaymentAmount');
          localStorage.removeItem('pendingSessionId');
          
          console.log("Successfully processed payment, created request, and transaction");
          setSuccess(true);
          toast.success("Payment successful! Your request is waiting for faculty approval.");
        } else {
          console.log("Payment was not successful or session ID is missing");
          toast.error("Payment was canceled or unsuccessful.");
        }
      } catch (error) {
        console.error("Error creating request:", error);
        toast.error("Error creating your request. Please contact support.");
      } finally {
        setIsProcessing(false);
        processingInProgress.current = false;
        
        // Redirect to requests page after 3 seconds
        console.log("Redirecting to requests page in 3 seconds...");
        setTimeout(() => {
          navigate("/requests");
        }, 3000);
      }
    };

    // Start processing with a small delay to prevent race conditions
    const timeoutId = setTimeout(() => {
      processPaymentResult();
    }, 100);

    // Clean up function
    return () => {
      clearTimeout(timeoutId);
    };
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
