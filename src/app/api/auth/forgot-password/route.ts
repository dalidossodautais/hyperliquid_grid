import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    console.log("Starting forgot-password route");
    const { email, locale = "en" } = await request.json();
    console.log("Email received:", email);

    // Check if the email exists
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
        subject: "Reset your password",
        text: `You requested a password reset. Please click on the following link to reset your password: ${resetUrl}`,
        html: `
          <div>
            <p>You requested a password reset.</p>
            <p>Please click on the following link to reset your password:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you did not request this reset, you can ignore this email.</p>
          </div>
        `,
      });
      console.log("Email sent successfully");
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Continue despite email sending error
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in forgot-password route:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
