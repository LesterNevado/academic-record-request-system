
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

// Product IDs for each document type
const PRODUCT_IDS = {
  TRANSCRIPT: "prod_RwLCH4NZ06JAwf",     // TOR
  CERTIFICATE: "prod_RwMfUjiS0c3VHH",    // COG
  CERTIFICATION: "prod_RwMgZPEEMBDHlQ",  // Certification
  OTHERS: "prod_RwMgmzeBE2urMr",         // Others
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { formData, redirectUrl, totalAmount } = await req.json();
    
    if (!formData || !redirectUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate price based on number of copies if totalAmount isn't provided
    let calculatedTotalAmount = totalAmount || 0;
    const lineItems = [];

    if (!totalAmount) {
      // Add line items based on request types
      if (formData.requestTypes.transcript.selected) {
        const transcriptCopies = formData.requestTypes.transcript.copies || 1;
        const transcriptPrice = 100; // ₱100 per copy
        calculatedTotalAmount += transcriptPrice * transcriptCopies;
      }

      if (formData.requestTypes.certificate.selected) {
        const certificateCopies = formData.requestTypes.certificate.copies || 1;
        const certificatePrice = 100; // ₱100 per copy
        calculatedTotalAmount += certificatePrice * certificateCopies;
      }

      if (formData.requestTypes.certification.selected) {
        const certificationCopies = formData.requestTypes.certification.copies || 1;
        const certificationPrice = 100; // ₱100 per copy
        calculatedTotalAmount += certificationPrice * certificationCopies;
      }

      if (formData.requestTypes.others.selected) {
        const othersCopies = formData.requestTypes.others.copies || 1;
        const othersPrice = 100; // ₱100 per copy
        calculatedTotalAmount += othersPrice * othersCopies;
      }
    }

    // Add line items based on request types
    if (formData.requestTypes.transcript.selected) {
      const transcriptCopies = formData.requestTypes.transcript.copies || 1;
      const transcriptPrice = 100; // ₱100 per copy
      
      lineItems.push({
        price_data: {
          currency: "php",
          product: PRODUCT_IDS.TRANSCRIPT,
          unit_amount: transcriptPrice * 100, // Amount in cents
        },
        quantity: transcriptCopies,
      });
    }

    if (formData.requestTypes.certificate.selected) {
      const certificateCopies = formData.requestTypes.certificate.copies || 1;
      const certificatePrice = 100; // ₱100 per copy
      
      lineItems.push({
        price_data: {
          currency: "php",
          product: PRODUCT_IDS.CERTIFICATE,
          unit_amount: certificatePrice * 100, // Amount in cents
        },
        quantity: certificateCopies,
      });
    }

    if (formData.requestTypes.certification.selected) {
      const certificationCopies = formData.requestTypes.certification.copies || 1;
      const certificationPrice = 100; // ₱100 per copy
      
      lineItems.push({
        price_data: {
          currency: "php",
          product: PRODUCT_IDS.CERTIFICATION,
          unit_amount: certificationPrice * 100, // Amount in cents
        },
        quantity: certificationCopies,
      });
    }

    if (formData.requestTypes.others.selected) {
      const othersCopies = formData.requestTypes.others.copies || 1;
      const othersPrice = 100; // ₱100 per copy
      
      lineItems.push({
        price_data: {
          currency: "php",
          product: PRODUCT_IDS.OTHERS,
          unit_amount: othersPrice * 100, // Amount in cents
        },
        quantity: othersCopies,
      });
    }

    // If no items selected, return error
    if (lineItems.length === 0) {
      return new Response(
        JSON.stringify({ error: "No request items selected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${redirectUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${redirectUrl}?canceled=true`,
      metadata: {
        formData: JSON.stringify({ 
          studentName: formData.studentName,
          studentNumber: formData.studentNumber,
          totalAmount: calculatedTotalAmount
        })
      },
    });

    return new Response(
      JSON.stringify({ id: session.id, url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
