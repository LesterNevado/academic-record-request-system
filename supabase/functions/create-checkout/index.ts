
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
  SOA: "prod_S38hFN6e4Umkv4",            // Statement of Account
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
    // Log the request to help with debugging
    console.log("Received create-checkout request");
    
    const { formData, redirectUrl, totalAmount } = await req.json();
    
    if (!formData || !redirectUrl) {
      console.error("Missing required parameters:", { formData: !!formData, redirectUrl: !!redirectUrl });
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Request parameters:", { 
      formData: JSON.stringify(formData),
      redirectUrl,
      totalAmount
    });

    // Calculate price based on number of copies if totalAmount isn't provided
    let calculatedTotalAmount = totalAmount || 0;
    const lineItems = [];

    // Log Stripe secret key availability (not the actual key)
    console.log("Stripe secret key available:", !!stripeSecretKey);

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
      
      if (formData.requestTypes.soa.selected) {
        const soaCopies = formData.requestTypes.soa.copies || 1;
        const soaPrice = 150; // ₱150 per copy
        calculatedTotalAmount += soaPrice * soaCopies;
      }
    }

    // Add line items based on request types
    if (formData.requestTypes.transcript.selected) {
      const transcriptCopies = formData.requestTypes.transcript.copies || 1;
      
      lineItems.push({
        price_data: {
          currency: "php",
          product: PRODUCT_IDS.TRANSCRIPT,
          unit_amount: 100 * 100, // Amount in cents (₱100)
        },
        quantity: transcriptCopies,
      });
      
      console.log("Added transcript to line items:", transcriptCopies, "copies");
    }

    if (formData.requestTypes.certificate.selected) {
      const certificateCopies = formData.requestTypes.certificate.copies || 1;
      
      lineItems.push({
        price_data: {
          currency: "php",
          product: PRODUCT_IDS.CERTIFICATE,
          unit_amount: 100 * 100, // Amount in cents (₱100)
        },
        quantity: certificateCopies,
      });
      
      console.log("Added certificate to line items:", certificateCopies, "copies");
    }

    if (formData.requestTypes.certification.selected) {
      const certificationCopies = formData.requestTypes.certification.copies || 1;
      
      lineItems.push({
        price_data: {
          currency: "php",
          product: PRODUCT_IDS.CERTIFICATION,
          unit_amount: 100 * 100, // Amount in cents (₱100)
        },
        quantity: certificationCopies,
      });
      
      console.log("Added certification to line items:", certificationCopies, "copies");
    }

    if (formData.requestTypes.others.selected) {
      const othersCopies = formData.requestTypes.others.copies || 1;
      
      lineItems.push({
        price_data: {
          currency: "php",
          product: PRODUCT_IDS.OTHERS,
          unit_amount: 100 * 100, // Amount in cents (₱100)
        },
        quantity: othersCopies,
      });
      
      console.log("Added others to line items:", othersCopies, "copies");
    }
    
    if (formData.requestTypes.soa.selected) {
      const soaCopies = formData.requestTypes.soa.copies || 1;
      
      lineItems.push({
        price_data: {
          currency: "php",
          product: PRODUCT_IDS.SOA,
          unit_amount: 150 * 100, // Amount in cents (₱150)
        },
        quantity: soaCopies,
      });
      
      console.log("Added SOA to line items:", soaCopies, "copies");
    }

    // If no items selected, return error
    if (lineItems.length === 0) {
      console.error("No request items selected");
      return new Response(
        JSON.stringify({ error: "No request items selected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Creating Stripe checkout session with", lineItems.length, "line items");
    console.log("Calculated total amount:", calculatedTotalAmount);

    try {
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

      console.log("Checkout session created successfully:", session.id);

      return new Response(
        JSON.stringify({ id: session.id, url: session.url, sessionId: session.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (stripeError) {
      console.error("Stripe error:", stripeError);
      return new Response(
        JSON.stringify({ error: `Stripe error: ${stripeError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
