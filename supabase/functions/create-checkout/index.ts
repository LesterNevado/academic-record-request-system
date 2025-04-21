
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
  REGISTRATION_FORM: "prod_SAes8dAmfqLx1J",
  COM: "prod_SAeszcogAo7TBN",
  COE: "prod_SAetkOppf5DtPu",
  CERTIFICATE_NO_SCHOLARSHIP: "prod_SAetw6jNGNmy3r",
  CTC_DRY_SEAL: "prod_S394g7wuMLDPXS",
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

    // For ease of price, define standard prices outside if needed (could be updated later)
    const priceMap = {
      transcript: 100,
      certificate: 100,
      certification: 100,
      others: 100,
      registrationForm: 120,
      com: 120,
      coa: 120,
      coe: 120,
      soa: 150,
      noScholarship: 150,
      ctcDrySeal: 50, // Assuming CTC/Dry Seal is additional ₱50 per copy
    };

    if (!totalAmount) {
      // Sum amount for main document types
      if (formData.requestTypes.transcript.selected) {
        const copies = formData.requestTypes.transcript.copies || 1;
        calculatedTotalAmount += priceMap.transcript * copies;
      }
      if (formData.requestTypes.certificate.selected) {
        const copies = formData.requestTypes.certificate.copies || 1;
        calculatedTotalAmount += priceMap.certificate * copies;
      }
      if (formData.requestTypes.certification.selected) {
        const copies = formData.requestTypes.certification.copies || 1;
        calculatedTotalAmount += priceMap.certification * copies;
      }
      if (formData.requestTypes.others.selected) {
        const copies = formData.requestTypes.others.copies || 1;
        calculatedTotalAmount += priceMap.others * copies;
      }
      if (formData.requestTypes.soa.selected) {
        const copies = formData.requestTypes.soa.copies || 1;
        calculatedTotalAmount += priceMap.soa * copies;
      }
      if (formData.requestTypes.registrationForm.selected) {
        const copies = formData.requestTypes.registrationForm.copies || 1;
        calculatedTotalAmount += priceMap.registrationForm * copies;
      }
      if (formData.requestTypes.com.selected) {
        const copies = formData.requestTypes.com.copies || 1;
        calculatedTotalAmount += priceMap.com * copies;
      }
      if (formData.requestTypes.coe.selected) {
        const copies = formData.requestTypes.coe.copies || 1;
        calculatedTotalAmount += priceMap.coe * copies;
      }
      if (formData.requestTypes.coa.selected) {
        const copies = formData.requestTypes.coa.copies || 1;
        calculatedTotalAmount += priceMap.coa * copies;
      }
      if (formData.requestTypes.noScholarship.selected) {
        const copies = formData.requestTypes.noScholarship.copies || 1;
        calculatedTotalAmount += priceMap.noScholarship * copies;
      }
    }

    // Helper to push line item to Stripe format
    function pushLineItem(productId: string, unitAmount: number, quantity: number) {
      if(quantity > 0) {
        lineItems.push({
          price_data: {
            currency: "php",
            product: productId,
            unit_amount: unitAmount * 100, // convert to cents
          },
          quantity: quantity,
        });
      }
    }

    // Add line items for the document types
    const rt = formData.requestTypes;

    if (rt.transcript.selected) {
      pushLineItem(PRODUCT_IDS.TRANSCRIPT, priceMap.transcript, rt.transcript.copies || 1);
      // If CTC/Dry Seal selected for this document, add that product charge
      if (rt.transcript.ctc) {
        pushLineItem(PRODUCT_IDS.CTC_DRY_SEAL, priceMap.ctcDrySeal, rt.transcript.copies || 1);
      }
    }

    if (rt.certificate.selected) {
      pushLineItem(PRODUCT_IDS.CERTIFICATE, priceMap.certificate, rt.certificate.copies || 1);
      if (rt.certificate.ctc) {
        pushLineItem(PRODUCT_IDS.CTC_DRY_SEAL, priceMap.ctcDrySeal, rt.certificate.copies || 1);
      }
    }

    if (rt.certification.selected) {
      pushLineItem(PRODUCT_IDS.CERTIFICATION, priceMap.certification, rt.certification.copies || 1);
      if (rt.certification.ctc) {
        pushLineItem(PRODUCT_IDS.CTC_DRY_SEAL, priceMap.ctcDrySeal, rt.certification.copies || 1);
      }
    }

    if (rt.others.selected) {
      pushLineItem(PRODUCT_IDS.OTHERS, priceMap.others, rt.others.copies || 1);
      if (rt.others.ctc) {
        pushLineItem(PRODUCT_IDS.CTC_DRY_SEAL, priceMap.ctcDrySeal, rt.others.copies || 1);
      }
    }

    if (rt.soa.selected) {
      pushLineItem(PRODUCT_IDS.SOA, priceMap.soa, rt.soa.copies || 1);
      if (rt.soa.ctc) {
        pushLineItem(PRODUCT_IDS.CTC_DRY_SEAL, priceMap.ctcDrySeal, rt.soa.copies || 1);
      }
    }

    if (rt.registrationForm.selected) {
      pushLineItem(PRODUCT_IDS.REGISTRATION_FORM, priceMap.registrationForm, rt.registrationForm.copies || 1);
      if (rt.registrationForm.ctc) {
        pushLineItem(PRODUCT_IDS.CTC_DRY_SEAL, priceMap.ctcDrySeal, rt.registrationForm.copies || 1);
      }
    }

    if (rt.com.selected) {
      pushLineItem(PRODUCT_IDS.COM, priceMap.com, rt.com.copies || 1);
      if (rt.com.ctc) {
        pushLineItem(PRODUCT_IDS.CTC_DRY_SEAL, priceMap.ctcDrySeal, rt.com.copies || 1);
      }
    }

    if (rt.coe.selected) {
      pushLineItem(PRODUCT_IDS.COE, priceMap.coe, rt.coe.copies || 1);
      if (rt.coe.ctc) {
        pushLineItem(PRODUCT_IDS.CTC_DRY_SEAL, priceMap.ctcDrySeal, rt.coe.copies || 1);
      }
    }

    if (rt.coa.selected) {
      pushLineItem(PRODUCT_IDS.CERTIFICATE_NO_SCHOLARSHIP, priceMap.coa, rt.coa.copies || 1);
      if (rt.coa.ctc) {
        pushLineItem(PRODUCT_IDS.CTC_DRY_SEAL, priceMap.ctcDrySeal, rt.coa.copies || 1);
      }
    }

    if (rt.noScholarship.selected) {
      pushLineItem(PRODUCT_IDS.CERTIFICATE_NO_SCHOLARSHIP, priceMap.noScholarship, rt.noScholarship.copies || 1);
      if (rt.noScholarship.ctc) {
        pushLineItem(PRODUCT_IDS.CTC_DRY_SEAL, priceMap.ctcDrySeal, rt.noScholarship.copies || 1);
      }
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
