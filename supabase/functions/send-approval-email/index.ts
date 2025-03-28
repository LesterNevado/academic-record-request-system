
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
    
    // New HTML email content based on the provided design
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #ccc;">
        <!-- Header -->
        <div style="background-color: #0047AB; color: white; padding: 15px; text-align: center;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="80" style="vertical-align: middle;">
                <img src="https://www.neu.edu.ph/main/wp-content/uploads/2018/06/neu-logo.png" alt="NEU Logo" style="width: 70px; height: auto;">
              </td>
              <td style="text-align: left; vertical-align: middle;">
                <h1 style="margin: 0; padding: 0; font-size: 24px; font-weight: bold;">NEU ARRS</h1>
                <p style="margin: 0; padding: 0; font-size: 14px;">Academic Record Request System</p>
              </td>
            </tr>
          </table>
        </div>
        
        <!-- Email Body -->
        <div style="padding: 20px;">
          <p style="color: #666; font-size: 14px;">${studentEmail}</p>
          
          <p style="margin-top: 15px;">Hi! ${studentName},</p>
          
          <p>Good news! your document request has been approved and is scheduled for pickup.</p>
          
          <!-- Request Details Box -->
          <div style="background-color: #f0f0f0; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; font-size: 16px; margin-bottom: 10px;">Request Details:</h3>
            <p style="margin: 5px 0;"><strong>Document Type:</strong> ${requestTypeText}</p>
            <p style="margin: 5px 0;"><strong>Pickup Date:</strong> ${pickupDate}</p>
            <p style="margin: 5px 0;"><strong>Notes:</strong> ${requestData.notes || 'None'}</p>
          </div>
          
          <p>Please make sure to bring your ID for verification when you come to pick-up your documents.</p>
          
          <p>Claim your documents at room #207 (temporary only).<br>
          For Statement of Account (SOA), please proceed at the <strong>Accounting Office</strong> (Room 202).</p>
          
          <p>If you have any questions or need to reschedule, please contact the Admission, Scholarship and Financial Assistance Office.</p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #0047AB; color: white; padding: 10px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;
    
    // Send the email with correct content type and encoding
    await client.send({
      from: "New Era University <lester.nevado2@gmail.com>",
      to: studentEmail,
      subject: emailSubject,
      html: emailHtml,
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
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
