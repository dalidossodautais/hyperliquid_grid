"use client";

import { useState } from "react";
import { useRouter, Link } from "@/navigation";
import { useTranslations } from "next-intl";
import LanguageSelector from "@/components/LanguageSelector";
import Input from "@/components/ui/Input";
import { signIn } from "next-auth/react";

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

// Fonction pour valider un email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function SignUp() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const t = useTranslations("auth");

  // Gérer les changements dans les champs du formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validation en temps réel
    if (name === "email") {
      if (value && !validateEmail(value)) {
        setEmailError(t("signup.email.invalid"));
      } else {
        setEmailError(null);
      }
    }

    if (name === "password") {
      if (value) {
        const passwordValidation = validatePassword(value);
        if (!passwordValidation.isValid) {
          setPasswordError(t(`signup.password.${passwordValidation.message}`));
        } else {
          setPasswordError(null);
        }

        // Vérifier également la correspondance avec le mot de passe de confirmation
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          setConfirmPasswordError(t("signup.password.mismatch"));
        } else if (formData.confirmPassword) {
          setConfirmPasswordError(null);
        }
      }
    }

    if (name === "confirmPassword") {
      if (value && formData.password && value !== formData.password) {
        setConfirmPasswordError(t("signup.password.mismatch"));
      } else {
        setConfirmPasswordError(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Réinitialiser les erreurs
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    const { name, email, password, confirmPassword } = formData;

    // Valider l'email
    if (!validateEmail(email)) {
      setEmailError(t("signup.email.invalid"));
      setLoading(false);
      return;
    }

    // Vérifier la complexité du mot de passe
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(t(`signup.password.${passwordValidation.message}`));
      setLoading(false);
      return;
    }

    // Vérifier que les mots de passe correspondent
    if (password !== confirmPassword) {
      setConfirmPasswordError(t("signup.password.mismatch"));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      // Connecter automatiquement l'utilisateur après l'inscription
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setError(t("signup.error.generic"));
      console.error(error);
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
                {t("signup.title")}
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
            <form className="space-y-6" onSubmit={handleSubmit}>
              <Input
                id="name"
                name="name"
                label={t("signup.name")}
                value={formData.name}
                onChange={handleChange}
                required
                placeholder={t("signup.name")}
              />

              <Input
                id="email"
                name="email"
                label={t("signup.email.label")}
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={emailError}
                required
                placeholder={t("signup.email.label")}
              />

              <Input
                id="password"
                name="password"
                label={t("signup.password.label", { defaultValue: "Password" })}
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={passwordError}
                required
                placeholder={t("signup.password.label", {
                  defaultValue: "Password",
                })}
              />

              <Input
                id="confirmPassword"
                name="confirmPassword"
                label={t("signup.password.confirm", {
                  defaultValue: "Confirm Password",
                })}
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={confirmPasswordError}
                required
                placeholder={t("signup.password.confirm", {
                  defaultValue: "Confirm Password",
                })}
              />

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
                    loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  {loading ? t("signup.loading") : t("signup.button")}
                </button>
              </div>

              <div className="text-center text-sm">
                <Link
                  href="/signin"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  {t("signup.hasAccount")}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
