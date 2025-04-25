
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.26.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { formData, redirectUrl, totalAmount } = await req.json();
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      httpClient: Stripe.createFetchHttpClient(),
    });
    
    // Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Processing request for:", formData.studentName);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser(req.headers.get('Authorization')?.split(' ')[1] || '');
    
    if (userError || !user) {
      console.error("Authentication error:", userError);
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create a reference for the request
    const clientReferenceId = crypto.randomUUID();
    
    // Prepare line items for Stripe checkout
    const lineItems = [];
    
    // Add line items based on selected document types
    if (formData.requestTypes.transcript.selected) {
      const copies = formData.requestTypes.transcript.copies || 1;
      lineItems.push({
        price_data: {
          currency: 'php',
          product_data: {
            name: 'Transcript of Records',
            description: `${copies} copy/copies${formData.requestTypes.transcript.ctc ? ' with CTC/Dry Seal' : ''}`,
          },
          unit_amount: 100 * 100, // ₱100 per copy in cents
        },
        quantity: copies,
      });
    }
    
    if (formData.requestTypes.certificate.selected) {
      const copies = formData.requestTypes.certificate.copies || 1;
      lineItems.push({
        price_data: {
          currency: 'php',
          product_data: {
            name: 'Certificate',
            description: `${copies} copy/copies${formData.requestTypes.certificate.ctc ? ' with CTC/Dry Seal' : ''}`,
          },
          unit_amount: 100 * 100, // ₱100 per copy in cents
        },
        quantity: copies,
      });
    }
    
    if (formData.requestTypes.certification.selected) {
      const copies = formData.requestTypes.certification.copies || 1;
      lineItems.push({
        price_data: {
          currency: 'php',
          product_data: {
            name: 'Certification',
            description: `${copies} copy/copies${formData.requestTypes.certification.ctc ? ' with CTC/Dry Seal' : ''}`,
          },
          unit_amount: 100 * 100, // ₱100 per copy in cents
        },
        quantity: copies,
      });
    }
    
    if (formData.requestTypes.others.selected) {
      const copies = formData.requestTypes.others.copies || 1;
      lineItems.push({
        price_data: {
          currency: 'php',
          product_data: {
            name: 'Other Documents',
            description: `${copies} copy/copies${formData.requestTypes.others.ctc ? ' with CTC/Dry Seal' : ''}`,
          },
          unit_amount: 100 * 100, // ₱100 per copy in cents
        },
        quantity: copies,
      });
    }
    
    if (formData.requestTypes.soa.selected) {
      const copies = formData.requestTypes.soa.copies || 1;
      lineItems.push({
        price_data: {
          currency: 'php',
          product_data: {
            name: 'Statement of Account',
            description: `${copies} copy/copies${formData.requestTypes.soa.ctc ? ' with CTC/Dry Seal' : ''}`,
          },
          unit_amount: 150 * 100, // ₱150 per copy in cents
        },
        quantity: copies,
      });
    }
    
    if (formData.requestTypes.registrationForm.selected) {
      const copies = formData.requestTypes.registrationForm.copies || 1;
      lineItems.push({
        price_data: {
          currency: 'php',
          product_data: {
            name: 'Test Registration Form',
            description: `${copies} copy/copies${formData.requestTypes.registrationForm.ctc ? ' with CTC/Dry Seal' : ''}`,
          },
          unit_amount: 120 * 100, // ₱120 per copy in cents
        },
        quantity: copies,
      });
    }
    
    if (formData.requestTypes.com.selected) {
      const copies = formData.requestTypes.com.copies || 1;
      lineItems.push({
        price_data: {
          currency: 'php',
          product_data: {
            name: 'Certificate of Matriculation',
            description: `${copies} copy/copies${formData.requestTypes.com.ctc ? ' with CTC/Dry Seal' : ''}`,
          },
          unit_amount: 120 * 100, // ₱120 per copy in cents
        },
        quantity: copies,
      });
    }
    
    if (formData.requestTypes.coe.selected) {
      const copies = formData.requestTypes.coe.copies || 1;
      lineItems.push({
        price_data: {
          currency: 'php',
          product_data: {
            name: 'Certificate of Enrollment',
            description: `${copies} copy/copies${formData.requestTypes.coe.ctc ? ' with CTC/Dry Seal' : ''}`,
          },
          unit_amount: 120 * 100, // ₱120 per copy in cents
        },
        quantity: copies,
      });
    }
    
    if (formData.requestTypes.coa.selected) {
      const copies = formData.requestTypes.coa.copies || 1;
      lineItems.push({
        price_data: {
          currency: 'php',
          product_data: {
            name: 'Certificate of Attendance',
            description: `${copies} copy/copies${formData.requestTypes.coa.ctc ? ' with CTC/Dry Seal' : ''}`,
          },
          unit_amount: 120 * 100, // ₱120 per copy in cents
        },
        quantity: copies,
      });
    }
    
    // If no line items were added, use a fallback
    if (lineItems.length === 0) {
      lineItems.push({
        price_data: {
          currency: 'php',
          product_data: {
            name: 'Document Request Fee',
            description: 'Fee for document request processing',
          },
          unit_amount: totalAmount * 100, // Convert to cents
        },
        quantity: 1,
      });
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${redirectUrl}?status=success&session_id={CHECKOUT_SESSION_ID}&ref=${clientReferenceId}`,
      cancel_url: `${redirectUrl}?status=cancelled&ref=${clientReferenceId}`,
      client_reference_id: clientReferenceId,
      metadata: {
        user_id: user.id,
      },
    });
    
    console.log(`Checkout session created: ${session.id}`);
    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
        clientReferenceId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error(`Error processing request: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
