
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentButtonProps {
  requestFormData: any;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  requestFormData,
  label = "Proceed to Payment",
  className = "",
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      const redirectUrl = `${window.location.origin}/payment-status`;

      // Get total amount from form data
      let totalAmount = 0;
      
      if (requestFormData.requestTypes.transcript.selected) {
        const copies = requestFormData.requestTypes.transcript.copies || 1;
        totalAmount += 100 * copies; // ₱100 per copy
      }
      
      if (requestFormData.requestTypes.certificate.selected) {
        const copies = requestFormData.requestTypes.certificate.copies || 1;
        totalAmount += 100 * copies; // ₱100 per copy
      }
      
      if (requestFormData.requestTypes.certification.selected) {
        const copies = requestFormData.requestTypes.certification.copies || 1;
        totalAmount += 100 * copies; // ₱100 per copy
      }
      
      if (requestFormData.requestTypes.others.selected) {
        const copies = requestFormData.requestTypes.others.copies || 1;
        totalAmount += 100 * copies; // ₱100 per copy
      }

      console.log("Invoking create-checkout with total amount:", totalAmount);
      console.log("Request data:", JSON.stringify({
        formData: requestFormData,
        redirectUrl,
        totalAmount,
      }));

      // Call Supabase Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          formData: requestFormData,
          redirectUrl,
          totalAmount,
        },
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || "Failed to create checkout session");
      }

      if (!data) {
        throw new Error("No data returned from checkout function");
      }

      console.log("Checkout session created:", data);

      if (data?.url) {
        // Store form data in localStorage for use after payment
        localStorage.setItem('pendingRequestData', JSON.stringify(requestFormData));
        localStorage.setItem('pendingPaymentAmount', totalAmount.toString());
        localStorage.setItem('pendingSessionId', data.sessionId);
        
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("Payment URL not returned from checkout function");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(`Payment processing error: ${error.message || "Please try again."}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      className={className}
    >
      {isLoading ? "Processing..." : label}
    </Button>
  );
};
