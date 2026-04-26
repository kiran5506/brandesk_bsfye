const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',  // SMTP server for Gmail
    port: 587,               // Port for secure email transmission
    secure: false,           // Set to true for port 465 (SSL), false for port 587 (TLS)
    auth: {
        user: 'bemailsmt@gmail.com',
        pass: 'cytvmxlykyczluzt',
    },
});

const sendEmail = async (to, subject, text, html) => {
    const mailOptions = {
      from: 'bemailsmt@gmail.com',
      to: to,
      subject: subject,
      text: text,
      html: html,
    };

    try {
      let info = await transporter.sendMail(mailOptions);

      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  };

  module.exports = { sendEmail };