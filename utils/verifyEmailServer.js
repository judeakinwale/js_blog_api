const nodemailer = require("nodemailer");

const verifyEmailServer = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    // * throw new Error
    console.log(
      "EAUTH: Invalid login: Authentication unsuccessful, the SMTP credentials were incorrect."
    );
    return false;
  }
};

module.exports = verifyEmailServer;
