// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.33.1';
import { renderAsync } from 'npm:@react-email/render@0.0.9';
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import React from 'npm:react@18.2.0';
import { ApprovalEmail } from './_templates/approval-email.tsx';

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
      ? (() => {
          const parts = requestData.pickup_date.split('-');
          if (parts.length === 3) {
            const [year, month, day] = parts.map(Number);
            if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
              return new Intl.DateTimeFormat('en-PH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }).format(new Date(year, month - 1, day));
            }
          }
          return requestData.pickup_date;
        })()
      : "To be determined";
      
    // Get request type and total number of copies
    const requestTypes: string[] = [];
    let totalCopies = 0;
    
    if (requestData.certificate_selected) {
      requestTypes.push("Certificate of Grades");
      totalCopies += requestData.certificate_copies || 0;
    }
    if (requestData.certification_selected) {
      requestTypes.push("Certification");
      totalCopies += requestData.certification_copies || 0;
    }
    if (requestData.soa_selected) {
      requestTypes.push("Statement of Account");
      totalCopies += requestData.soa_copies || 0;
    }
    if (requestData.others_selected) {
      requestTypes.push("Others");
      totalCopies += requestData.others_copies || 0;
    }
    if (requestData.registration_form_selected) {
      requestTypes.push("Registration Form");
      totalCopies += requestData.registration_form_copies || 0;
    }
    if (requestData.com_selected) {
      requestTypes.push("Certificate of Matriculation");
      totalCopies += requestData.com_copies || 0;
    }
    if (requestData.coe_selected) {
      requestTypes.push("Certificate of Enrollment");
      totalCopies += requestData.coe_copies || 0;
    }
    if (requestData.coa_selected) {
      requestTypes.push("Certificate of Attendance");
      totalCopies += requestData.coa_copies || 0;
    }
    
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
    
    // Create React Email template with data
    const emailProps = {
      studentName,
      requestType: requestTypeText,
      pickupDate,
      notes: requestData.notes,
      copies: totalCopies,
    };
    
    console.log("Rendering email template with props:", emailProps);
    
    // Render the React Email template to HTML
    const html = await renderAsync(React.createElement(ApprovalEmail, emailProps));
    
    console.log("Email HTML generated successfully");
    
    // Create a simple plain text version as fallback
    const plainText = `
NEU ARRS - Academic Record Request System

Hi ${studentName},

Good news! Your document request has been approved and is scheduled for pickup.

DOCUMENT TYPE: ${requestTypeText}
NUMBER OF COPIES: ${totalCopies}
PICKUP DATE: ${pickupDate}
NOTES: ${requestData.notes || 'None'}

Please bring your ID for verification when you come to pick up your documents.

Claim your documents at room #207 (temporary only).
For Statement of Account (SOA), please proceed at the Accounting Office (Room 202).

If you have any questions or need to reschedule, please contact the Admission, Scholarship and Financial Assistance Office.

This is an automated email. Please do not reply to this email.
    `;
    
    // Send the email with HTML and plain text fallback
    await client.send({
      from: "NEU ARRS <lester.nevado2@gmail.com>",
      to: studentEmail,
      subject: emailSubject,
      html: html,
      content: plainText,
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
