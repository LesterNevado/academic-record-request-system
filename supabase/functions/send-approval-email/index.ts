
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
    
    // Email template based on the provided design
    const logoUrl = "https://raw.githubusercontent.com/lnevado2/ARRS/main/src/assets/neu-logo.svg";
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            font-size: 14px;
          }
          .email-container {
            width: 450px;
            margin: 0 auto;
            border: 1px solid #000;
            background-color: #ffffff;
          }
          .header {
            background-color: #0047AB;
            padding: 15px;
            color: white;
            text-align: center;
            height: 100px;
            position: relative;
          }
          .logo {
            position: absolute;
            left: 28px;
            top: 10px;
            width: 78px;
            height: 78px;
          }
          .header-title {
            font-size: 32px;
            font-weight: 800;
            margin-top: 10px;
          }
          .header-subtitle {
            font-size: 16px;
            font-weight: 500;
            margin-top: 5px;
          }
          .content {
            padding: 20px;
          }
          .date {
            font-size: 12px;
            color: #000;
            margin-bottom: 15px;
          }
          .greeting {
            margin-bottom: 20px;
          }
          .details-box {
            background-color: #D9D9D9;
            padding: 15px;
            margin: 20px 0;
          }
          .details-title {
            font-size: 14px;
            font-weight: bold;
          }
          .details-item {
            font-size: 12px;
            margin-top: 5px;
          }
          .instructions {
            font-size: 12px;
            margin: 20px 0;
          }
          .footer {
            background-color: #0047AB;
            padding: 10px;
            color: white;
            text-align: center;
            font-size: 12px;
            height: 40px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <img src="https://raw.githubusercontent.com/lnevado2/ARRS/93f1f6e9a0af9a61d3bd6a5e34c1183ae12aea01/src/assets/neu-logo.png" alt="New Era University Logo" class="logo">
            <div class="header-title">NEU ARRS</div>
            <div class="header-subtitle">Academic Record Request System</div>
          </div>
          
          <div class="content">
            <div class="date">Date: ${new Date().toLocaleDateString()}</div>
            
            <div class="greeting">
              Hi ${studentName},<br><br>
              Good news! Your document request has been approved and is scheduled for pickup.
            </div>
            
            <div class="details-box">
              <div class="details-title">Request Details:</div>
              <div class="details-item"><strong>Document Type:</strong> ${requestTypeText}</div>
              <div class="details-item"><strong>Pickup Date:</strong> ${pickupDate}</div>
              ${requestData.notes ? `<div class="details-item"><strong>Notes:</strong> ${requestData.notes}</div>` : ''}
            </div>
            
            <div class="instructions">
              Please make sure to bring your ID for verification when you come to pick up your documents.<br><br>
              Claim your documents at room #207 (temporary only).<br>
              For Statement of Account (SOA), please proceed at the Accounting Office (Room 202)<br><br>
              If you have any questions or need to reschedule, please contact the Admission, Scholarship and Financial Assistance Office.
            </div>
          </div>
          
          <div class="footer">
            This is an automated message. Please do not reply to this email.
          </div>
        </div>
      </body>
      </html>
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
