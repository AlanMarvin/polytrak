import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@3.2.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Resend (you'll need to add RESEND_API_KEY to your Supabase environment variables)
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const formData: ContactFormData = await req.json();

    // Validate required fields
    const { name, email, subject, message } = formData;
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize input
    const sanitizedName = name.trim().substring(0, 100);
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedSubject = subject.trim().substring(0, 200);
    const sanitizedMessage = message.trim().substring(0, 2000);

    // Send email using Resend
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'Polytrak.io <contact@polytrak.io>',
        to: ['polytrak@mail.com'],
        subject: `New Contact Form: ${sanitizedSubject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Contact Form Submission</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>From:</strong> ${sanitizedName} (${sanitizedEmail})</p>
              <p><strong>Subject:</strong> ${sanitizedSubject}</p>
              <p><strong>Received:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h3>Message:</h3>
              <p style="white-space: pre-wrap;">${sanitizedMessage}</p>
            </div>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px;">
              This message was sent from the Polytrak.io contact form.
            </p>
          </div>
        `,
        reply_to: sanitizedEmail
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
        throw new Error('Failed to send email');
      }

      console.log('Email sent successfully:', emailData);

    } catch (emailSendError) {
      console.error('Failed to send email:', emailSendError);
      throw new Error('Failed to send email notification');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Thank you for your message. We will get back to you soon!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing contact form:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
