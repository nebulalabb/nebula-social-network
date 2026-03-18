import nodemailer from "nodemailer";
import { logger } from "./logger";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: Number(process.env.SMTP_PORT) || 2525,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

export const sendEmail = async (options: {
  email: string;
  subject: string;
  message: string;
  html?: string;
}) => {
  const mailOptions = {
    from: `Anime Social <${process.env.FROM_EMAIL || "no-reply@animesocial.com"}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`[Email] Sent to ${options.email}: ${info.messageId}`);
  } catch (error: any) {
    logger.error({ err: error }, `[Email] Failed to send to ${options.email}`);
    throw error;
  }
};
