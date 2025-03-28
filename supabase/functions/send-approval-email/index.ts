
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.33.1';
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface for the request payload
interface EmailRequestPayload {
  requestId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );
    
    // Parse request body
    const { requestId } = await req.json() as EmailRequestPayload;
    
    if (!requestId) {
      return new Response(
        JSON.stringify({ error: 'Request ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch the request details with student information
    const { data: requestData, error: requestError } = await supabaseClient
      .from('requests')
      .select(`
        *,
        profiles:user_id (email, full_name)
      `)
      .eq('id', requestId)
      .single();
    
    if (requestError || !requestData) {
      console.error('Error fetching request:', requestError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch request details' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch the processor name if present
    let processorName = "A faculty member";
    if (requestData.processed_by) {
      const { data: processorData } = await supabaseClient.rpc(
        'get_processor_name',
        { processor_id: requestData.processed_by }
      );
      
      if (processorData) {
        processorName = processorData;
      }
    }
    
    // Initialize SMTP client with Gmail configuration
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: "lester.nevado2@gmail.com",
          password: Deno.env.get("GMAIL_APP_PASSWORD") || "",
        },
      },
    });

    // Format date for email
    const pickupDate = requestData.pickup_date 
      ? new Date(requestData.pickup_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : "Not specified";
      
    // Get request type
    const requestTypes = [];
    if (requestData.transcript_selected) requestTypes.push("Transcript of Records");
    if (requestData.certificate_selected) requestTypes.push("Certificate of Grades");
    if (requestData.certification_selected) requestTypes.push("Certification");
    if (requestData.others_selected) requestTypes.push("Others");
    const requestTypeText = requestTypes.join(", ");
    
    // Create email content
    const emailSubject = "Your Document Request Has Been Approved";
    const studentEmail = requestData.profiles?.email;
    const studentName = requestData.student_name;
    
    if (!studentEmail) {
      return new Response(
        JSON.stringify({ error: 'Student email not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Simple plain text email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>Hello ${studentName},</p>
        
        <p>Good news! Your document request (${requestTypeText}) has been approved and is scheduled for pickup on ${pickupDate}.</p>
        
        <p>Please make sure to bring your ID when you come to pick up your documents at room #207.</p>
        
        <p>Regards,<br>New Era University</p>
      </div>
    `;
    
    // Send the email
    await client.send({
      from: "New Era University <lester.nevado2@gmail.com>",
      to: studentEmail,
      subject: emailSubject,
      content: "Your document request has been approved!",
      html: emailHtml,
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        "Importance": "High",
        "X-Mailer": "New Era University Document Request System",
        "MIME-Version": "1.0"
      }
    });
    
    // Close connection
    await client.close();
    
    console.log(`Email sent successfully to ${studentEmail}`);
    
    return new Response(
      JSON.stringify({ success: true, message: "Email notification sent successfully" }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email notification" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
