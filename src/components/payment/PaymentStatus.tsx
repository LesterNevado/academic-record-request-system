
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle } from "lucide-react";

export const PaymentStatus: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isSuccess = params.get("success") === "true";
    const sessionId = params.get("session_id");
    const requestId = params.get("request_id");

    if (!requestId) {
      setIsProcessing(false);
      return;
    }

    const updatePaymentStatus = async () => {
      try {
        // If payment was successful, update request status in database
        if (isSuccess && sessionId) {
          // Update request status to "paid" in the database
          const { error } = await supabase
            .from("requests")
            .update({ status: "paid" })
            .eq("id", requestId);

          if (error) {
            throw error;
          }

          setSuccess(true);
          toast.success("Payment successful! Your request is now being processed.");
        } else {
          toast.error("Payment was canceled or unsuccessful.");
        }
      } catch (error) {
        console.error("Error updating payment status:", error);
        toast.error("Error updating payment status. Please contact support.");
      } finally {
        setIsProcessing(false);
        
        // Redirect to requests page after 3 seconds
        setTimeout(() => {
          navigate("/requests");
        }, 3000);
      }
    };

    updatePaymentStatus();
  }, [location.search, navigate]);

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing payment...</p>
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
            Your payment has been processed successfully. Your academic records request is now being processed.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="max-w-md border-red-200 bg-red-50">
          <XCircle className="h-5 w-5 text-red-600" />
          <AlertTitle>Payment Unsuccessful</AlertTitle>
          <AlertDescription>
            Your payment was not completed. You can try again from your requests page.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
