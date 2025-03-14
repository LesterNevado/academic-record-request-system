
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.12.0";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

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
    const { requestId, requestDetails, redirectUrl } = await req.json();
    
    if (!requestId || !redirectUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate price based on number of copies
    let totalAmount = 0;
    const lineItems = [];

    // Add line items based on request types
    if (requestDetails.transcript_selected) {
      const transcriptCopies = requestDetails.transcript_copies || 1;
      const transcriptPrice = 100; // ₱100 per copy
      totalAmount += transcriptPrice * transcriptCopies;
      
      lineItems.push({
        price_data: {
          currency: "php",
          product_data: {
            name: "Transcript of Records",
            description: `${transcriptCopies} ${transcriptCopies > 1 ? "copies" : "copy"}`,
          },
          unit_amount: transcriptPrice * 100, // Amount in cents
        },
        quantity: transcriptCopies,
      });
    }

    if (requestDetails.certificate_selected) {
      const certificateCopies = requestDetails.certificate_copies || 1;
      const certificatePrice = 100; // ₱100 per copy
      totalAmount += certificatePrice * certificateCopies;
      
      lineItems.push({
        price_data: {
          currency: "php",
          product_data: {
            name: "Certificate of Graduation",
            description: `${certificateCopies} ${certificateCopies > 1 ? "copies" : "copy"}`,
          },
          unit_amount: certificatePrice * 100, // Amount in cents
        },
        quantity: certificateCopies,
      });
    }

    if (requestDetails.certification_selected) {
      const certificationCopies = requestDetails.certification_copies || 1;
      const certificationPrice = 100; // ₱100 per copy
      totalAmount += certificationPrice * certificationCopies;
      
      lineItems.push({
        price_data: {
          currency: "php",
          product_data: {
            name: "Certification",
            description: `${requestDetails.certification_details} - ${certificationCopies} ${certificationCopies > 1 ? "copies" : "copy"}`,
          },
          unit_amount: certificationPrice * 100, // Amount in cents
        },
        quantity: certificationCopies,
      });
    }

    if (requestDetails.others_selected) {
      const othersCopies = requestDetails.others_copies || 1;
      const othersPrice = 100; // ₱100 per copy
      totalAmount += othersPrice * othersCopies;
      
      lineItems.push({
        price_data: {
          currency: "php",
          product_data: {
            name: "Other Document",
            description: `${requestDetails.others_details} - ${othersCopies} ${othersCopies > 1 ? "copies" : "copy"}`,
          },
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
      success_url: `${redirectUrl}?success=true&session_id={CHECKOUT_SESSION_ID}&request_id=${requestId}`,
      cancel_url: `${redirectUrl}?canceled=true&request_id=${requestId}`,
      metadata: {
        requestId,
      },
    });

    return new Response(
      JSON.stringify({ id: session.id, url: session.url }),
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
