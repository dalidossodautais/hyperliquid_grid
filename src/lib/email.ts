import nodemailer from "nodemailer";

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/**
 * Sends an email using Mailjet in production/local or Ethereal in development
 */
export const sendEmail = async (data: EmailPayload) => {
  try {
    // Determine if we use Mailjet (if credentials are defined or if we are in production)
    const useMailjet =
      (process.env.SMTP_USER && process.env.SMTP_PASSWORD) ||
      process.env.NODE_ENV === "production";

    // Configure the appropriate transporter
    const transporter = useMailjet
      ? nodemailer.createTransport({
          service: "Mailjet",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        })
      : nodemailer.createTransport({
          host: "localhost",
          port: 1025,
          secure: false,
        });

    // Configure email options
    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@example.com",
      ...data,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    // Display preview URL for Ethereal in development
    if (!useMailjet && info.messageId) {
      console.log(
        "Test email sent. Preview it here:",
        nodemailer.getTestMessageUrl(info)
      );
    }

    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
