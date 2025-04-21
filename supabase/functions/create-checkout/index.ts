
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
    
    // Insert initial request record
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .insert({
        user_id: user.id,
        student_name: formData.studentName,
        student_number: formData.studentNumber,
        contact_number: formData.contactNumber,
        home_address: formData.homeAddress || '',
        purpose: formData.purpose,
        status: 'pending',
        client_reference_id: clientReferenceId,
        
        // Handle all request types - selected status
        transcript_selected: formData.requestTypes.transcript.selected,
        certificate_selected: formData.requestTypes.certificate.selected,
        certification_selected: formData.requestTypes.certification.selected,
        others_selected: formData.requestTypes.others.selected,
        soa_selected: formData.requestTypes.soa.selected,
        registration_form_selected: formData.requestTypes.registrationForm.selected,
        com_selected: formData.requestTypes.com.selected,
        coe_selected: formData.requestTypes.coe.selected,
        coa_selected: formData.requestTypes.coa.selected,
        no_scholarship_selected: formData.requestTypes.noScholarship.selected,
        
        // Handle all request types - copies
        transcript_copies: formData.requestTypes.transcript.selected ? formData.requestTypes.transcript.copies : null,
        certificate_copies: formData.requestTypes.certificate.selected ? formData.requestTypes.certificate.copies : null,
        certification_copies: formData.requestTypes.certification.selected ? formData.requestTypes.certification.copies : null,
        others_copies: formData.requestTypes.others.selected ? formData.requestTypes.others.copies : null,
        soa_copies: formData.requestTypes.soa.selected ? formData.requestTypes.soa.copies : null,
        registration_form_copies: formData.requestTypes.registrationForm.selected ? formData.requestTypes.registrationForm.copies : null,
        com_copies: formData.requestTypes.com.selected ? formData.requestTypes.com.copies : null,
        coe_copies: formData.requestTypes.coe.selected ? formData.requestTypes.coe.copies : null,
        coa_copies: formData.requestTypes.coa.selected ? formData.requestTypes.coa.copies : null,
        no_scholarship_copies: formData.requestTypes.noScholarship.selected ? formData.requestTypes.noScholarship.copies : null,
        
        // Handle all request types - CTC/Dry Seal options
        transcript_ctc: formData.requestTypes.transcript.selected ? formData.requestTypes.transcript.ctc : false,
        certificate_ctc: formData.requestTypes.certificate.selected ? formData.requestTypes.certificate.ctc : false,
        certification_ctc: formData.requestTypes.certification.selected ? formData.requestTypes.certification.ctc : false,
        others_ctc: formData.requestTypes.others.selected ? formData.requestTypes.others.ctc : false,
        soa_ctc: formData.requestTypes.soa.selected ? formData.requestTypes.soa.ctc : false,
        registration_form_ctc: formData.requestTypes.registrationForm.selected ? formData.requestTypes.registrationForm.ctc : false,
        com_ctc: formData.requestTypes.com.selected ? formData.requestTypes.com.ctc : false,
        coe_ctc: formData.requestTypes.coe.selected ? formData.requestTypes.coe.ctc : false,
        coa_ctc: formData.requestTypes.coa.selected ? formData.requestTypes.coa.ctc : false,
        no_scholarship_ctc: formData.requestTypes.noScholarship.selected ? formData.requestTypes.noScholarship.ctc : false,
        
        // Details for specific document types
        certification_details: formData.requestTypes.certification.selected ? formData.requestTypes.certification.details : null,
        others_details: formData.requestTypes.others.selected ? formData.requestTypes.others.details : null,
        registration_form_details: formData.requestTypes.registrationForm.selected ? formData.requestTypes.registrationForm.details : null,
      })
      .select('id')
      .single();
    
    if (requestError) {
      console.error("Database error creating request:", requestError);
      return new Response(
        JSON.stringify({ error: "Failed to create request", details: requestError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'php',
            product_data: {
              name: 'Document Request Fee',
              description: 'Fee for document request processing',
            },
            unit_amount: totalAmount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${redirectUrl}?session_id={CHECKOUT_SESSION_ID}&status=success&ref=${clientReferenceId}`,
      cancel_url: `${redirectUrl}?status=cancelled&ref=${clientReferenceId}`,
      client_reference_id: clientReferenceId,
      metadata: {
        request_id: requestData.id,
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
