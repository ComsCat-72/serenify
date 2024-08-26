
const transporter = require('../config/mailer');

exports.sendEmail = (req, res) => {
  const { name, email, message } = req.body;

  const mailOptions = {
    from: email,
    to: 'igirimbabazie72@gmail.com',
    subject: 'New Contact Form Submission',
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ message: 'Error sending email', error: error.message });
    }
    console.log('Email sent:', info.response);
    res.status(200).json({ message: 'Email sent successfully' });
  });
};


