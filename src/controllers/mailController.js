const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',  // SMTP server for Gmail
    port: 587,               // Port for secure email transmission
    secure: false,           // Set to true for port 465 (SSL), false for port 587 (TLS)
    auth: {
        user: 'bemailsmt@gmail.com',
        pass: 'dmpnrsqrmxmaaivh',
    },
});

exports.sendMail = async (req, res) => {
    const { subject, text, html } = req.body;

    const to = 'chinthadakirankumar@gmail.com';

    const mailOptions = { from: 'bemailsmt@gmail.com', to, subject, text, html };
    await transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ status: false, message: 'Failed to send email', error });
        }
        return res.status(200).json({ status: true, message: 'Email sent successfully', info });
    });
};
