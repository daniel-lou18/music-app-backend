const nodemailer = require("nodemailer");

const sendMail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "12209a9ee6dad0",
      pass: "ef5ea3b872230a",
    },
  });

  const info = await transporter.sendMail({
    from: '"Dan Makito" <dan@makito.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  });
};

module.exports = sendMail;
