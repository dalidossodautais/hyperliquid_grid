"use client";

import { useState } from "react";
import { Link } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";
import LanguageSelector from "@/components/LanguageSelector";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

// Fonction pour valider un email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function ForgotPassword() {
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("auth");

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (value && !validateEmail(value)) {
      setEmailError(t("forgotPassword.error.invalidEmail"));
    } else {
      setEmailError(null);
    }

    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEmailError(null);

    // Valider l'email
    if (!validateEmail(email)) {
      setEmailError(t("forgotPassword.error.invalidEmail"));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, locale }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      // Afficher un message de succès même si l'email n'existe pas
      // (pour des raisons de sécurité)
      setSuccess(true);
    } catch (error) {
      console.error(error);
      setError(t("forgotPassword.error.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                {t("forgotPassword.title")}
              </h1>
            </div>
            <div className="flex items-center">
              <div className="h-10">
                <LanguageSelector />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            {success ? (
              <div className="text-center">
                <div className="mb-4 text-green-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  {t("forgotPassword.success")}
                </h2>
                <p className="text-gray-600 mb-6">
                  {t("forgotPassword.success")}
                </p>
                <Link
                  href="/signin"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  {t("forgotPassword.backToLogin")}
                </Link>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    {t("forgotPassword.description")}
                  </p>
                  <Input
                    id="email"
                    name="email"
                    label={t("forgotPassword.emailLabel")}
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    error={emailError}
                    required
                    placeholder={t("forgotPassword.emailPlaceholder")}
                  />
                </div>

                {error && <Alert type="error">{error}</Alert>}

                <div>
                  <Button type="submit" disabled={loading} fullWidth>
                    {loading
                      ? t("forgotPassword.loading", {
                          defaultValue: "Sending...",
                        })
                      : t("forgotPassword.submitButton")}
                  </Button>
                </div>

                <div className="text-center text-sm">
                  <Link
                    href="/signin"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    {t("forgotPassword.backToLogin")}
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
