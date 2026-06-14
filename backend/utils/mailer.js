const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525', 10),
  auth: {
    user: process.env.SMTP_USER || 'mock_user',
    pass: process.env.SMTP_PASS || 'mock_pass',
  },
});

async function sendMail({ to, subject, text, html }) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"HRMS System" <noreply@hrms.com>',
    to,
    subject,
    text,
    html,
  };

  try {
    // If SMTP_USER is set to 'mock_user', skip sending and just log to console
    if (process.env.SMTP_USER === 'mock_user' || !process.env.SMTP_USER) {
      logger.info(`[Mailer Mock] Email to: ${to} | Subject: ${subject}`);
      logger.debug(`[Mailer Mock Content] Text: ${text}`);
      return { messageId: 'mock-id-12345' };
    }

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    // Return a dummy object to prevent application crashes
    return { error: true, message: error.message };
  }
}

module.exports = {
  sendMail,
};
