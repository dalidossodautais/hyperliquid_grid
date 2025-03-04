"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, Link } from "@/navigation";
import { useTranslations } from "next-intl";
import LanguageSelector from "@/components/LanguageSelector";
import Input from "@/components/ui/Input";

export default function SignIn() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const t = useTranslations("auth");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      if (value && !validateEmail(value)) {
        setEmailError(t("signin.email.invalid"));
      } else {
        setEmailError(null);
      }
    }

    if (error) {
      setError(null);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEmailError(null);

    const { email, password } = formData;

    if (!validateEmail(email)) {
      setEmailError(t("signin.email.invalid"));
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("signin.error.invalid"));
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError(t("signin.error.generic"));
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
                {t("signin.title")}
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
                id="email"
                name="email"
                label={t("signin.email.label")}
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={emailError}
                required
                placeholder={t("signin.email.label")}
              />

              <Input
                id="password"
                name="password"
                label={t("signin.password")}
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder={t("signin.password")}
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
                  {loading ? t("signin.loading") : t("signin.button")}
                </button>
              </div>

              <div className="text-center text-sm">
                <Link
                  href="/signup"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  {t("signin.noAccount")}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
