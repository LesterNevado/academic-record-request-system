
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
    
    // Updated email template with a cleaner, more professional design
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Request Approved</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #0047AB; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Document Request Approved</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="margin-bottom: 20px; font-size: 16px; color: #333;">Hello ${studentName},</p>
              <p style="margin-bottom: 20px; font-size: 16px; color: #333;">Good news! ${processorName} has approved your document request and scheduled a pickup date.</p>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9f9f9; border-radius: 4px; margin: 20px 0; border: 1px solid #eeeeee;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 18px; color: #333; border-bottom: 1px solid #eeeeee; padding-bottom: 10px;">Request Details</h2>
                    <p style="margin: 8px 0; font-size: 15px; color: #555;"><strong>Document Type:</strong> ${requestTypeText}</p>
                    <p style="margin: 8px 0; font-size: 15px; color: #555;"><strong>Pickup Date:</strong> ${pickupDate}</p>
                    ${requestData.notes ? `<p style="margin: 8px 0; font-size: 15px; color: #555;"><strong>Notes:</strong> ${requestData.notes}</p>` : ''}
                  </td>
                </tr>
              </table>
              
              <p style="margin-bottom: 10px; font-size: 16px; color: #333;">Please make sure to bring your ID when you come to pick up your documents.</p>
              <p style="margin-bottom: 30px; font-size: 16px; color: #333;">If you have any questions or need to reschedule, please contact the registrar's office.</p>
              
              <p style="margin-bottom: 5px; font-size: 16px; color: #333;">Thank you,</p>
              <p style="margin-bottom: 20px; font-size: 16px; color: #333;">New Era University Document Request System</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f5f5f5; padding: 15px; text-align: center; color: #777; font-size: 13px; border-top: 1px solid #eeeeee;">
              <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    
    // Send the email
    await client.send({
      from: "NEU Document Request <lester.nevado2@gmail.com>",
      to: studentEmail,
      subject: emailSubject,
      content: "Your document request has been approved!",
      html: emailHtml,
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        "Importance": "High",
        "X-Mailer": "NEU Document Request System",
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
