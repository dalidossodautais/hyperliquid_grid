"use client";

import { useState } from "react";
import { Link } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";
import LanguageSelector from "@/components/LanguageSelector";

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
  const t = useTranslations("forgotPassword");

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (value && !validateEmail(value)) {
      setEmailError(
        t("email.invalid", { defaultValue: "Invalid email format" })
      );
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
      setEmailError(
        t("email.invalid", { defaultValue: "Invalid email format" })
      );
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
      setError(
        t("error.generic", {
          defaultValue: "An error occurred. Please try again.",
        })
      );
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
                {t("title", { defaultValue: "Forgot Password" })}
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
                  {t("success.title", { defaultValue: "Check your email" })}
                </h2>
                <p className="text-gray-600 mb-6">
                  {t("success.message", {
                    defaultValue:
                      "If an account exists with this email, we've sent instructions to reset your password.",
                  })}
                </p>
                <Link
                  href="/signin"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  {t("backToSignIn", { defaultValue: "Back to Sign In" })}
                </Link>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    {t("instructions", {
                      defaultValue:
                        "Enter your email address and we'll send you a link to reset your password.",
                    })}
                  </p>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("email.label", { defaultValue: "Email" })}
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black [color:black]"
                      placeholder={t("email.label", { defaultValue: "Email" })}
                      value={email}
                      onChange={handleEmailChange}
                    />
                  </div>
                  {emailError && (
                    <p className="mt-2 text-xs text-red-600">{emailError}</p>
                  )}
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 rounded-md p-3">
                    {error}
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      loading
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    {loading
                      ? t("loading", { defaultValue: "Sending..." })
                      : t("button", { defaultValue: "Send Reset Link" })}
                  </button>
                </div>

                <div className="text-center text-sm">
                  <Link
                    href="/signin"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    {t("backToSignIn", { defaultValue: "Back to Sign In" })}
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
