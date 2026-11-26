const nodemailer = require("nodemailer");

const isConfigured = () => {
  const hasUser = Boolean(process.env.SMTP_USER);
  const hasPassword = Boolean(process.env.SMTP_PASS);
  return Boolean(
    process.env.SMTP_HOST &&
      Number.isInteger(Number(process.env.SMTP_PORT)) &&
      Number(process.env.SMTP_PORT) > 0 &&
      hasUser === hasPassword
  );
};

const sendPasswordResetEmail = async (email, resetUrl) => {
  if (!isConfigured()) {
    throw new Error("SMTP settings are missing");
  }

  const transportConfig = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
  };
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transportConfig.auth = {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    };
  }
  const transporter = nodemailer.createTransport(transportConfig);

  await transporter.sendMail({
    from:
      process.env.SMTP_FROM ||
      process.env.SMTP_USER ||
      "DocSpot <no-reply@docspot.test>",
    to: email,
    subject: "Reset your DocSpot password",
    text: `Use this link to reset your DocSpot password. It expires in 30 minutes:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
  });
};

module.exports = { isConfigured, sendPasswordResetEmail };
