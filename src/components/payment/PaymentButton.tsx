
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
      
      if (requestFormData.requestTypes.certificate && requestFormData.requestTypes.certificate.selected) {
        const copies = requestFormData.requestTypes.certificate.copies || 1;
        totalAmount += 100 * copies; // ₱100 per copy
      }
      
      if (requestFormData.requestTypes.certification && requestFormData.requestTypes.certification.selected) {
        const copies = requestFormData.requestTypes.certification.copies || 1;
        totalAmount += 100 * copies; // ₱100 per copy
      }
      
      if (requestFormData.requestTypes.others && requestFormData.requestTypes.others.selected) {
        const copies = requestFormData.requestTypes.others.copies || 1;
        totalAmount += 100 * copies; // ₱100 per copy
      }
      
      if (requestFormData.requestTypes.soa && requestFormData.requestTypes.soa.selected) {
        const copies = requestFormData.requestTypes.soa.copies || 1;
        totalAmount += 150 * copies; // ₱150 per copy
      }
      
      if (requestFormData.requestTypes.registrationForm && requestFormData.requestTypes.registrationForm.selected) {
        const copies = requestFormData.requestTypes.registrationForm.copies || 1;
        totalAmount += 120 * copies; // ₱120 per copy
      }
      
      if (requestFormData.requestTypes.com && requestFormData.requestTypes.com.selected) {
        const copies = requestFormData.requestTypes.com.copies || 1;
        totalAmount += 120 * copies; // ₱120 per copy
      }
      
      if (requestFormData.requestTypes.coe && requestFormData.requestTypes.coe.selected) {
        const copies = requestFormData.requestTypes.coe.copies || 1;
        totalAmount += 120 * copies; // ₱120 per copy
      }
      
      if (requestFormData.requestTypes.coa && requestFormData.requestTypes.coa.selected) {
        const copies = requestFormData.requestTypes.coa.copies || 1;
        totalAmount += 120 * copies; // ₱120 per copy
      }

      // Add CTC/Dry Seal fees if selected
      Object.keys(requestFormData.requestTypes).forEach(key => {
        if (requestFormData.requestTypes[key] && 
            requestFormData.requestTypes[key].selected && 
            requestFormData.requestTypes[key].ctc) {
          const copies = requestFormData.requestTypes[key].copies || 1;
          totalAmount += 50 * copies; // ₱50 per CTC/Dry Seal
        }
      });

      console.log("Starting payment process with total amount:", totalAmount);
      console.log("Request data summary:", {
        studentName: requestFormData.studentName,
        studentNumber: requestFormData.studentNumber,
        purpose: requestFormData.purpose,
        requestTypes: Object.keys(requestFormData.requestTypes)
          .filter(key => requestFormData.requestTypes[key] && requestFormData.requestTypes[key].selected)
          .map(key => ({
            type: key,
            copies: requestFormData.requestTypes[key].copies,
            ctc: requestFormData.requestTypes[key].ctc
          }))
      });

      // Call Supabase Edge Function to create checkout session with proper error handling
      console.log("Invoking create-checkout function...");
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
        console.error("No data returned from checkout function");
        throw new Error("No data returned from checkout function");
      }

      console.log("Checkout session created successfully:", {
        sessionId: data.sessionId ? data.sessionId.substring(0, 5) + '...' : null,
        hasUrl: !!data.url
      });

      if (data?.url) {
        // Store form data in localStorage for use after payment
        console.log("Storing form data in localStorage");
        localStorage.setItem('pendingRequestData', JSON.stringify(requestFormData));
        localStorage.setItem('pendingPaymentAmount', totalAmount.toString());
        localStorage.setItem('pendingSessionId', data.sessionId);
        
        // Redirect to Stripe Checkout
        console.log("Redirecting to Stripe Checkout...");
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
