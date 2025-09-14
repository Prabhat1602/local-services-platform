const sgMail = require('@sendgrid/mail');

// Set the API key from your environment variables
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = (to, subject, html) => {
  const msg = {
    to: to, // The recipient's email address
    from: process.env.FROM_EMAIL, // Your verified sender email
    subject: subject,
    html: html, // The HTML content of the email
  };

  // Send the email
  sgMail
    .send(msg)
    .then(() => {
      console.log('✅ Email sent successfully via SendGrid');
    })
    .catch((error) => {
      console.error('❌ Error sending email via SendGrid:', error.response.body);
    });
};

module.exports = sendEmail;