
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
      : "To be determined";
      
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
    
    // Very simple email template with minimal HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Document Request Has Been Approved</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #0047AB;">NEU ARRS</h1>
    <p>Academic Record Request System</p>
  </div>
  
  <p>Hi ${studentName},</p>
  
  <p>Good news! Your document request has been approved and is scheduled for pickup.</p>
  
  <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0;">
    <p><strong>Document Type:</strong> ${requestTypeText}</p>
    <p><strong>Pickup Date:</strong> ${pickupDate}</p>
    <p><strong>Notes:</strong> ${requestData.notes || 'None'}</p>
  </div>
  
  <p>Please bring your ID for verification when you come to pick up your documents.</p>
  
  <p>Claim your documents at room #207 (temporary only).<br>
  For Statement of Account (SOA), please proceed at the Accounting Office (Room 202).</p>
  
  <p>If you have any questions or need to reschedule, please contact the Admission, Scholarship and Financial Assistance Office.</p>
  
  <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; text-align: center; font-size: 12px; color: #666;">
    <p>This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>`;
    
    // Send the email with completely minimal headers to avoid encoding issues
    await client.send({
      from: "NEU ARRS <lester.nevado2@gmail.com>",
      to: studentEmail,
      subject: emailSubject,
      html: emailHtml,
      // Use only essential headers
      headers: {
        "Content-Type": "text/html"
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
