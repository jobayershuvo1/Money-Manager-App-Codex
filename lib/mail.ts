import nodemailer from "nodemailer";

export async function sendPasswordReset(email: string, token: string) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  if (!process.env.SMTP_HOST) {
    console.info(`Password reset link for ${email}: ${resetUrl}`);
    return;
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
  await transporter.sendMail({
    to: email,
    from: process.env.MAIL_FROM || "Money Manager <no-reply@example.com>",
    subject: "Reset your Money Manager password",
    text: `Reset your password: ${resetUrl}`
  });
}
