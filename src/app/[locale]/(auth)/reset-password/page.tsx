"use client";

import { useState, useEffect } from "react";
import { Link, useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import LanguageSelector from "@/components/LanguageSelector";
import Input from "@/components/ui/Input";

// Fonction pour vérifier la complexité du mot de passe
const validatePassword = (
  password: string
): { isValid: boolean; message?: string } => {
  // Minimum 8 caractères
  if (password.length < 8) {
    return { isValid: false, message: "password.tooShort" };
  }

  // Au moins un chiffre
  if (!/\d/.test(password)) {
    return { isValid: false, message: "password.needsNumber" };
  }

  // Au moins une lettre majuscule
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "password.needsUppercase" };
  }

  // Au moins une lettre minuscule
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "password.needsLowercase" };
  }

  // Au moins un caractère spécial
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: "password.needsSpecial" };
  }

  return { isValid: true };
};

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("resetPassword");
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  // Redirect to sign-in page after successful password reset
  useEffect(() => {
    if (success && !redirecting) {
      setRedirecting(true);
      // Show success message for 3 seconds before redirecting
      const redirectTimer = setTimeout(() => {
        router.push(`/${locale}/signin`);
      }, 3000);

      return () => clearTimeout(redirectTimer);
    }
  }, [success, redirecting, router, locale]);

  // Vérifier la validité du token au chargement de la page
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/auth/verify-reset-token?token=${token}`
        );
        await response.json(); // Consommer la réponse sans stocker la variable

        setTokenValid(response.ok);

        if (!response.ok) {
          setError(
            t("error.invalidToken", {
              defaultValue:
                "This password reset link is invalid or has expired.",
            })
          );
        }
      } catch (error) {
        console.error(error);
        setTokenValid(false);
        setError(
          t("error.generic", {
            defaultValue: "An error occurred. Please try again.",
          })
        );
      }
    };

    verifyToken();
  }, [token, t]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);

    if (value) {
      const passwordValidation = validatePassword(value);
      if (!passwordValidation.isValid) {
        setPasswordError(t(passwordValidation.message as string));
      } else {
        setPasswordError(null);
      }

      // Vérifier également la correspondance avec le mot de passe de confirmation
      if (confirmPassword && value !== confirmPassword) {
        setConfirmPasswordError(
          t("password.mismatch", { defaultValue: "Passwords do not match" })
        );
      } else if (confirmPassword) {
        setConfirmPasswordError(null);
      }
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setConfirmPassword(value);

    if (value && password && value !== password) {
      setConfirmPasswordError(
        t("password.mismatch", { defaultValue: "Passwords do not match" })
      );
    } else {
      setConfirmPasswordError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    // Vérifier la complexité du mot de passe
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(t(passwordValidation.message as string));
      setLoading(false);
      return;
    }

    // Vérifier que les mots de passe correspondent
    if (password !== confirmPassword) {
      setConfirmPasswordError(
        t("password.mismatch", { defaultValue: "Passwords do not match" })
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

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

  // Afficher un message d'erreur si le token est invalide
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  {t("title", { defaultValue: "Reset Password" })}
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
              <div className="text-center">
                <div className="mb-4 text-red-600">
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
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  {t("error.invalidTokenTitle", {
                    defaultValue: "Invalid or Expired Link",
                  })}
                </h2>
                <p className="text-gray-600 mb-6">
                  {error ||
                    t("error.invalidToken", {
                      defaultValue:
                        "This password reset link is invalid or has expired.",
                    })}
                </p>
                <Link
                  href="/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  {t("requestNewLink", {
                    defaultValue: "Request a new reset link",
                  })}
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Afficher un spinner pendant la vérification du token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                {t("title", { defaultValue: "Reset Password" })}
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
                  {t("success.title", {
                    defaultValue: "Password Reset Successful",
                  })}
                </h2>
                <p className="text-gray-600 mb-6">
                  {t("success.message", {
                    defaultValue:
                      "Your password has been reset successfully. You can now sign in with your new password.",
                  })}
                </p>
                <p className="text-sm text-blue-600 mt-2">
                  {redirecting
                    ? t("redirecting", {
                        defaultValue: "Redirecting to sign in page...",
                      })
                    : ""}
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
                      defaultValue: "Please enter your new password below.",
                    })}
                  </p>
                  <Input
                    id="password"
                    name="password"
                    label={t("password.label", {
                      defaultValue: "New Password",
                    })}
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    error={passwordError}
                    required
                    placeholder={t("password.label", {
                      defaultValue: "New Password",
                    })}
                  />

                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    label={t("password.confirm", {
                      defaultValue: "Confirm New Password",
                    })}
                    type="password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    error={confirmPasswordError}
                    required
                    placeholder={t("password.confirm", {
                      defaultValue: "Confirm New Password",
                    })}
                  />
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
                      ? t("loading", { defaultValue: "Resetting..." })
                      : t("submitButton", { defaultValue: "Reset Password" })}
                  </button>
                </div>

                <div className="text-center text-sm">
                  <Link
                    href="/signin"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    {t("backToLogin", { defaultValue: "Back to Login" })}
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
