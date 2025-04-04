
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
    
    console.log("Checking if transaction function exists...");

    // Check if the function has been created already
    const { error: checkError } = await supabase
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

    // Function doesn't exist, check if we need to create it
    console.log("Calling create_transaction_function placeholder...");
    
    // Check if the function placeholder exists
    const { error: placeholderError } = await supabase.rpc('create_transaction_function');
    
    if (!placeholderError) {
      console.log("Transaction function placeholder exists, but main function doesn't. This should not happen.");
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Inconsistent function state detected" 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // If both checks failed, we need to create the functions
    console.log("Creating transaction function via SQL query...");
    
    // SQL to create both the placeholder and the main function
    const sql = `
    -- Create the placeholder function
    CREATE OR REPLACE FUNCTION public.create_transaction_function()
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      RETURN jsonb_build_object('created', true);
    END;
    $$;

    -- Create the main function
    CREATE OR REPLACE FUNCTION public.create_transaction_if_not_exists(
      p_user_id uuid,
      p_request_id uuid,
      p_amount numeric,
      p_payment_status text,
      p_payment_method text,
      p_stripe_session_id text
    ) 
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      v_transaction_id UUID;
      v_result JSONB;
    BEGIN
      -- First, check if a transaction with this session ID already exists
      SELECT id INTO v_transaction_id 
      FROM transactions
      WHERE stripe_session_id = p_stripe_session_id;
      
      -- If transaction already exists, return it
      IF v_transaction_id IS NOT NULL THEN
        -- Update the request record to ensure it links to this transaction
        UPDATE requests
        SET transaction_id = v_transaction_id
        WHERE id = p_request_id AND (transaction_id IS NULL OR transaction_id <> v_transaction_id);
        
        SELECT jsonb_build_object(
          'id', id,
          'request_id', request_id,
          'exists', true
        ) INTO v_result
        FROM transactions
        WHERE id = v_transaction_id;
        
        RETURN v_result;
      END IF;
      
      -- If no transaction exists, create a new one
      INSERT INTO transactions (
        user_id, 
        request_id, 
        amount, 
        payment_status, 
        payment_method, 
        stripe_session_id
      ) VALUES (
        p_user_id,
        p_request_id,
        p_amount,
        p_payment_status,
        p_payment_method,
        p_stripe_session_id
      )
      RETURNING id INTO v_transaction_id;
      
      -- Update the request to link to this transaction
      UPDATE requests
      SET transaction_id = v_transaction_id
      WHERE id = p_request_id;
      
      SELECT jsonb_build_object(
        'id', v_transaction_id,
        'request_id', p_request_id,
        'exists', false
      ) INTO v_result;
      
      RETURN v_result;
    END;
    $$;
    `;
    
    const { error } = await supabase.rpc('pgaudit_exec_sql', { p_sql: sql });

    if (error) {
      console.error("Error creating transaction functions:", error);
      throw error;
    }

    console.log("Transaction function created successfully");
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Transaction function created successfully"
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
