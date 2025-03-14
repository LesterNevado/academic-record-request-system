
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

      // Call Supabase Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          formData: requestFormData,
          redirectUrl,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Store form data in localStorage for use after payment
        localStorage.setItem('pendingRequestData', JSON.stringify(requestFormData));
        
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment processing error. Please try again.");
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
