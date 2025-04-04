
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a single instance of the Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Check if the function has been created already
    const { data: existingFunction, error: checkError } = await supabase
      .rpc('create_transaction_if_not_exists', {
        p_user_id: '00000000-0000-0000-0000-000000000000', // Dummy values for checking if function exists
        p_request_id: '00000000-0000-0000-0000-000000000000',
        p_amount: 0,
        p_payment_status: 'check',
        p_payment_method: 'check',
        p_stripe_session_id: 'check'
      })
      .select();

    // If no error, the function exists
    if (!checkError) {
      console.log("Transaction function already exists, no need to create it");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Transaction function already exists" 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // If error isn't about the function not existing, there's another issue
    if (checkError && !checkError.message.includes("does not exist")) {
      console.error("Error checking for transaction function:", checkError);
      throw new Error(`Error checking for function: ${checkError.message}`);
    }

    // Function doesn't exist, create it
    console.log("Creating transaction function...");
    
    // Create the function via SQL query
    const { data, error } = await supabase.rpc('create_transaction_function');

    if (error) {
      console.error("Error creating transaction function:", error);
      throw error;
    }

    console.log("Transaction function created successfully:", data);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Transaction function created successfully", 
      data 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create_transaction_function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
