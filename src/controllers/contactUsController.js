const { sendEmail } = require('../utils/mail');
const { buildNewsletterEmail } = require('../utils/emailTemplate');

/**
 * Public contact endpoint - sends an email to support
 * POST /api/public/contact
 */
exports.contact = async (req, res) => {
  try {
    const { name, email, mobile, message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ status: false, message: 'name, email and message are required' });
    }

    const subject = `Website contact from ${name}`;
    const emailContent = buildNewsletterEmail({
      title: `Website contact from ${name}`,
      greeting: 'Hello Support Team,',
      intro: 'You received a new contact request from the website.',
      body: `Name: ${name}\nEmail: ${email}\nMobile: ${mobile || ''}\n\nMessage:\n${message}`,
    });

    // send email using existing utils/mail.js
  const info = await sendEmail(process.env.SUPPORT_EMAIL, subject, emailContent.text, emailContent.html);

    return res.status(200).json({ status: true, ok: true, message: 'Email sent', info });
  } catch (err) {
    console.error('Public contact error', err);
    return res.status(500).json({ status: false, ok: false, message: err.message || 'Internal server error' });
  }
};
