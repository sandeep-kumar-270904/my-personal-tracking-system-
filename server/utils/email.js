const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // Use a real service in production
  auth: {
    user: process.env.EMAIL_USER || 'test@gmail.com',
    pass: process.env.EMAIL_PASS || 'password',
  },
});

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html
      });
      console.log(`Sent email to ${to}`);
    } else {
      console.log(`(Simulation) Sent email to ${to}: \nSubject: ${subject}\n${text || 'HTML Content'}`);
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { transporter, sendEmail };
