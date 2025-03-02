"use client";

import { useState, useEffect } from "react";
import { Link, useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import LanguageSelector from "@/components/LanguageSelector";

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

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const t = useTranslations("resetPassword");

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
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("password.label", { defaultValue: "New Password" })}
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black [color:black]"
                      placeholder={t("password.label", {
                        defaultValue: "New Password",
                      })}
                      value={password}
                      onChange={handlePasswordChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 w-10 flex items-center justify-center text-sm cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 text-gray-500 hover:text-gray-700"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 text-gray-500 hover:text-gray-700"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="mt-2 text-xs text-red-600">{passwordError}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("password.confirm", {
                      defaultValue: "Confirm New Password",
                    })}
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black [color:black]"
                      placeholder={t("password.confirm", {
                        defaultValue: "Confirm New Password",
                      })}
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 w-10 flex items-center justify-center text-sm cursor-pointer"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 text-gray-500 hover:text-gray-700"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 text-gray-500 hover:text-gray-700"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {confirmPasswordError && (
                    <p className="mt-2 text-xs text-red-600">
                      {confirmPasswordError}
                    </p>
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
                      ? t("loading", { defaultValue: "Resetting..." })
                      : t("button", { defaultValue: "Reset Password" })}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
