const { sendEmail } = require('../utils/mail');

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
    const text = `Name: ${name}\nEmail: ${email}\nMobile: ${mobile || ''}\n\nMessage:\n${message}`;
    const html = `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Mobile:</strong> ${mobile || ''}</p><hr/><p>${message}</p>`;

    // send email using existing utils/mail.js
    const info = await sendEmail(process.env.SUPPORT_EMAIL, subject, text, html);

    return res.status(200).json({ status: true, ok: true, message: 'Email sent', info });
  } catch (err) {
    console.error('Public contact error', err);
    return res.status(500).json({ status: false, ok: false, message: err.message || 'Internal server error' });
  }
};
