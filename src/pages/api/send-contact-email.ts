import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

// --- IMPORTANT --- 
// Ensure these environment variables are set in your Netlify environment:
// SMTP_HOST: Your SMTP server hostname (e.g., smtp.gmail.com)
// SMTP_PORT: Your SMTP server port (e.g., 465 for SSL, 587 for TLS)
// SMTP_USER: Your SMTP username (usually your email address)
// SMTP_PASS: Your SMTP password (or app-specific password if using Gmail/Outlook)
// RECIPIENT_EMAIL: The email address to send the form submissions to (pranav@possibleminds.in)

const smtpConfig = {
  host: import.meta.env.SMTP_HOST,
  port: parseInt(import.meta.env.SMTP_PORT || '587', 10),
  secure: parseInt(import.meta.env.SMTP_PORT || '587', 10) === 465, // true for 465, false for other ports
  auth: {
    user: import.meta.env.SMTP_USER,
    pass: import.meta.env.SMTP_PASS,
  },
};

const recipientEmail = import.meta.env.RECIPIENT_EMAIL || 'pranav@possibleminds.in';

export const POST: APIRoute = async ({ request, redirect }) => {
  
  // Basic check if SMTP config is present
  if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
    console.error('SMTP configuration missing in environment variables.');
    // Consider redirecting to an error page or showing a generic error
     return new Response("Server configuration error.", { status: 500 });
  }

  const formData = await request.formData();
  const firstName = formData.get('firstName')?.toString() || '';
  const lastName = formData.get('lastName')?.toString() || '';
  const email = formData.get('email')?.toString() || '';
  const company = formData.get('company')?.toString() || '';
  const message = formData.get('message')?.toString() || '';

  const transporter = nodemailer.createTransport(smtpConfig);

  const mailOptions = {
    from: `"Contact Form" <${smtpConfig.auth.user}>`, // Sender address (must be your SMTP user)
    to: recipientEmail, // List of receivers
    replyTo: email, // Set Reply-To to the submitter's email
    subject: 'New Contact Form Submission', // Subject line
    text: `
      New contact form submission:

      First Name: ${firstName}
      Last Name: ${lastName}
      Email: ${email}
      Company: ${company}
      Message: ${message}
    `,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>First Name:</strong> ${firstName}</p>
      <p><strong>Last Name:</strong> ${lastName}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p><strong>Company:</strong> ${company || 'N/A'}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Contact form email sent successfully.');
    // Redirect to success page
    return redirect('/thank-you', 303);

  } catch (error) {
    console.error('Error sending contact form email:', error);
    // Redirect back to form page with error query param
    const referer = request.headers.get('referer');
    if (referer) {
        const url = new URL(referer);
        url.searchParams.set('submission', 'error');
        // Maybe add more specific error info if needed, but be careful not to expose sensitive details
        return redirect(url.toString(), 303);
    }
     // Fallback if referer is not available
    return new Response("Failed to send message.", { status: 500 });
  }
}; 