import nodemailer from "nodemailer";

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/**
 * Envoie un email en utilisant Mailjet en production/local ou Ethereal en développement
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

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);

    // Afficher l'URL de prévisualisation pour Ethereal en développement
    if (!useMailjet && info.messageId) {
      console.log(
        "Email de test envoyé. Prévisualisez-le ici :",
        nodemailer.getTestMessageUrl(info)
      );
    }

    return info;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    throw error;
  }
};
