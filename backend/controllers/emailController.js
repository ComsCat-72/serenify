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
      console.log(error);
      res.status(500).send('Error: Could not send email');
    } else {
      console.log('Email sent: ' + info.response);
      res.status(200).send('Email sent successfully');
    }
  });
};
