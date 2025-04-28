import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

// --- IMPORTANT --- 
// Ensure these environment variables are set in your Netlify environment:
// SMTP_HOST: Your SMTP server hostname (e.g., smtp.gmail.com)
// SMTP_PORT: Your SMTP server port (e.g., 465 for SSL, 587 for TLS)
// SMTP_USER: Your SMTP username (usually your email address)
// SMTP_PASS: Your SMTP password (or app-specific password if using Gmail/Outlook)
// RECIPIENT_EMAIL: The email address to send the form submissions to (pranav@possibleminds.in)

// --- Environment Variable Checks ---
const missingVars: string[] = [];
if (!import.meta.env.SMTP_HOST) missingVars.push('SMTP_HOST');
if (!import.meta.env.SMTP_PORT) missingVars.push('SMTP_PORT'); 
if (!import.meta.env.SMTP_USER) missingVars.push('SMTP_USER');
if (!import.meta.env.SMTP_PASS) missingVars.push('SMTP_PASS');

const smtpConfig = {
  host: import.meta.env.SMTP_HOST,
  port: parseInt(import.meta.env.SMTP_PORT || '587', 10),
  secure: parseInt(import.meta.env.SMTP_PORT || '587', 10) === 465, 
  auth: {
    user: import.meta.env.SMTP_USER,
    pass: import.meta.env.SMTP_PASS,
  },
};

const recipientEmail = import.meta.env.RECIPIENT_EMAIL || 'pranav@possibleminds.in';

// --- API Route Handler ---
export const POST: APIRoute = async ({ request, redirect }) => {
  
  // Enhanced check for missing SMTP config
  if (missingVars.length > 0) {
    const errorMsg = `SMTP configuration error: Missing environment variable(s): ${missingVars.join(', ')}`;
    console.error(errorMsg); // Log detailed error
    // Return a user-friendly, generic error to the browser
    return new Response(
        "There was a problem with the server configuration. Please contact support if the issue persists.", 
        { status: 500 }
    );
  }

  // --- Proceed with form processing and sending email ---
  const formData = await request.formData();
  const firstName = formData.get('firstName')?.toString() || '';
  const lastName = formData.get('lastName')?.toString() || '';
  const email = formData.get('email')?.toString() || '';
  const company = formData.get('company')?.toString() || '';
  const message = formData.get('message')?.toString() || '';

  const transporter = nodemailer.createTransport(smtpConfig);

  const mailOptions = {
    from: `"Contact Form" <${smtpConfig.auth.user}>`, 
    to: recipientEmail, 
    replyTo: email, 
    subject: 'New Contact Form Submission', 
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

  // --- Try sending email ---
  try {
    await transporter.sendMail(mailOptions);
    console.log('Contact form email sent successfully.');
    return redirect('/thank-you', 303);

  } catch (error) {
    // Log detailed error from nodemailer
    console.error('Error sending contact form email via SMTP:', error);
    
    // Determine the referer URL for redirect
    const referer = request.headers.get('referer');
    let redirectUrl = '/'; // Default fallback redirect
    if (referer) {
        const url = new URL(referer);
        url.searchParams.set('submission', 'error');
        redirectUrl = url.toString();
    }

    // Redirect back to form page with error query param
    return redirect(redirectUrl, 303);
  }
}; 