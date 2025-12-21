import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Create email content
    const emailContent = `
New Contact Form Submission from Polytrak.io

From: ${sanitizedName} (${sanitizedEmail})
Subject: ${sanitizedSubject}

Message:
${sanitizedMessage}

---
Sent from Polytrak.io contact form
Timestamp: ${new Date().toISOString()}
    `.trim();

    // For now, we'll log the email content since we don't have SMTP configured
    // In production, you would send this via an email service like SendGrid, Mailgun, etc.
    console.log('Contact form submission received:');
    console.log(emailContent);

    // TODO: Implement actual email sending
    // This would typically use a service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Resend
    // - Or any other email service

    // For demonstration, we'll return success but log that email sending needs to be implemented
    console.log('⚠️  Email sending not yet implemented. Configure an email service to send to polytrak@mail.com');

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
