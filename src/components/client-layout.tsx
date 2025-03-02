"use client";

import { NextIntlClientProvider } from "next-intl";
import { Providers } from "@/app/providers";

// Default messages for each locale
const defaultMessages = {
  en: {
    signin: {
      title: "Sign In",
      email: { label: "Email", invalid: "Invalid email format" },
      password: "Password",
      button: "Sign In",
      loading: "Signing in...",
      noAccount: "Don't have an account? Sign up",
      forgotPassword: "Forgot password?",
      error: { invalid: "Invalid credentials", generic: "An error occurred" },
    },
    signup: {
      title: "Sign Up",
      name: "Name",
      email: { label: "Email", invalid: "Invalid email format" },
      password: {
        label: "Password",
        confirm: "Confirm Password",
        mismatch: "Passwords do not match",
      },
      button: "Sign Up",
      loading: "Signing up...",
      hasAccount: "Already have an account? Sign in",
      error: { generic: "An error occurred" },
    },
    dashboard: {
      title: "Dashboard",
      welcome: "Welcome",
      signout: "Sign Out",
      content: { title: "Content", description: "Description" },
    },
    forgotPassword: {
      title: "Forgot Password",
      email: { label: "Email", invalid: "Invalid email format" },
      button: "Send Reset Link",
      loading: "Sending...",
      backToSignIn: "Back to Sign In",
      error: { generic: "An error occurred" },
      success: {
        title: "Check your email",
        message:
          "If an account exists with this email, we've sent instructions to reset your password.",
      },
      instructions:
        "Enter your email address and we'll send you a link to reset your password.",
    },
    resetPassword: {
      title: "Reset Password",
      password: {
        label: "New Password",
        confirm: "Confirm New Password",
        mismatch: "Passwords do not match",
        tooShort: "Password must be at least 8 characters",
        needsNumber: "Password must include at least one number",
        needsUppercase: "Password must include at least one uppercase letter",
        needsLowercase: "Password must include at least one lowercase letter",
        needsSpecial: "Password must include at least one special character",
      },
      button: "Reset Password",
      loading: "Resetting...",
      backToSignIn: "Back to Sign In",
      error: {
        generic: "An error occurred. Please try again.",
        invalidToken: "This password reset link is invalid or has expired.",
        invalidTokenTitle: "Invalid or Expired Link",
      },
      success: {
        title: "Password Reset Successful",
        message:
          "Your password has been reset successfully. You can now sign in with your new password.",
      },
      instructions: "Please enter your new password below.",
      requestNewLink: "Request a new reset link",
    },
  },
  fr: {
    signin: {
      title: "Connexion",
      email: { label: "Email", invalid: "Format d'email invalide" },
      password: "Mot de passe",
      button: "Se connecter",
      loading: "Connexion en cours...",
      noAccount: "Pas de compte ? S'inscrire",
      forgotPassword: "Mot de passe oublié ?",
      error: {
        invalid: "Identifiants invalides",
        generic: "Une erreur est survenue",
      },
    },
    signup: {
      title: "Inscription",
      name: "Nom",
      email: { label: "Email", invalid: "Format d'email invalide" },
      password: {
        label: "Mot de passe",
        confirm: "Confirmer le mot de passe",
        mismatch: "Les mots de passe ne correspondent pas",
      },
      button: "S'inscrire",
      loading: "Inscription en cours...",
      hasAccount: "Déjà un compte ? Se connecter",
      error: { generic: "Une erreur est survenue" },
    },
    dashboard: {
      title: "Tableau de bord",
      welcome: "Bienvenue",
      signout: "Déconnexion",
      content: { title: "Contenu", description: "Description" },
    },
    forgotPassword: {
      title: "Mot de passe oublié",
      email: { label: "Email", invalid: "Format d'email invalide" },
      button: "Envoyer le lien de réinitialisation",
      loading: "Envoi en cours...",
      backToSignIn: "Retour à la connexion",
      error: { generic: "Une erreur est survenue" },
      success: {
        title: "Vérifiez votre email",
        message:
          "Si un compte existe avec cet email, nous avons envoyé des instructions pour réinitialiser votre mot de passe.",
      },
      instructions:
        "Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.",
    },
    resetPassword: {
      title: "Réinitialisation du mot de passe",
      password: {
        label: "Nouveau mot de passe",
        confirm: "Confirmer le nouveau mot de passe",
        mismatch: "Les mots de passe ne correspondent pas",
        tooShort: "Le mot de passe doit contenir au moins 8 caractères",
        needsNumber: "Le mot de passe doit contenir au moins un chiffre",
        needsUppercase:
          "Le mot de passe doit contenir au moins une lettre majuscule",
        needsLowercase:
          "Le mot de passe doit contenir au moins une lettre minuscule",
        needsSpecial:
          "Le mot de passe doit contenir au moins un caractère spécial",
      },
      button: "Réinitialiser le mot de passe",
      loading: "Réinitialisation en cours...",
      backToSignIn: "Retour à la connexion",
      error: {
        generic: "Une erreur est survenue. Veuillez réessayer.",
        invalidToken: "Ce lien de réinitialisation est invalide ou a expiré.",
        invalidTokenTitle: "Lien invalide ou expiré",
      },
      success: {
        title: "Mot de passe réinitialisé avec succès",
        message:
          "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
      },
      instructions: "Veuillez entrer votre nouveau mot de passe ci-dessous.",
      requestNewLink: "Demander un nouveau lien de réinitialisation",
    },
  },
  es: {}, // Ces objets seront remplis ci-dessous
  de: {},
  it: {},
};

// Copy English messages for other locales
const messages = {
  ...defaultMessages,
};

export default function ClientLayout({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  // Get messages for the current locale
  const localeMessages =
    messages[locale as keyof typeof messages] || messages.en;

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={localeMessages}
      timeZone="UTC"
    >
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  );
}
