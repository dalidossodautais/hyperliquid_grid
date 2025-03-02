import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    console.log("Début de la route forgot-password");
    const { email, locale = "en" } = await request.json();
    console.log("Email reçu:", email);

    // Vérifier si l'email existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // If the user doesn't exist, we still return a success
    // for security reasons (to prevent email enumeration)
    if (!user) {
      console.log("User not found for email:", email);
      return NextResponse.json({ success: true });
    }

    console.log("User found:", user.id);

    // Generate a unique token
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save the token in the database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    console.log("Token generated and saved");

    // Send an email with the reset link
    // Include the locale in the URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/reset-password?token=${resetToken}`;
    console.log("Reset URL:", resetUrl);

    try {
      await sendEmail({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe",
        text: `Vous avez demandé une réinitialisation de mot de passe. Veuillez cliquer sur le lien suivant pour réinitialiser votre mot de passe: ${resetUrl}`,
        html: `
          <div>
            <p>Vous avez demandé une réinitialisation de mot de passe.</p>
            <p>Veuillez cliquer sur le lien suivant pour réinitialiser votre mot de passe:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>Ce lien expirera dans 1 heure.</p>
            <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
          </div>
        `,
      });
      console.log("Email envoyé avec succès");
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      // On continue malgré l'erreur d'envoi d'email
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in forgot-password route:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
