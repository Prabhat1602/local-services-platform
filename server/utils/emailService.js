// backend/utils/sendEmail.js

const nodemailer = require('nodemailer');

// 1. Create a Nodemailer transporter using Mailgun's SMTP details
const transporter = nodemailer.createTransport({
  host: process.env.MAILGUN_SMTP_HOST,
  port: process.env.MAILGUN_SMTP_PORT,
  secure: false, // Use 'true' for port 465 (SSL/TLS), 'false' for 587 (STARTTLS)
                 // Mailgun typically uses 587 with STARTTLS (secure: false)
  auth: {
    user: process.env.MAILGUN_SMTP_USER,
    pass: process.env.MAILGUN_SMTP_PASS,
  },
});

// 2. Function to send an email with robust error handling
async function sendEmail({ to, subject, text, html }) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Your App" <noreply@example.com>', // Fallback sender
      to: to,
      subject: subject,
      text: text, // Plain text body
      html: html, // HTML body
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent: %s', info.messageId);
    // You can log the preview URL if using ethereal for testing
    // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email via Nodemailer/Mailgun:', error);
    // Log detailed error for debugging
    if (error.response) {
      console.error('Mailgun Response Error:', error.response);
    }
    return { success: false, error: error.message };
  }
}

module.exports = sendEmail;