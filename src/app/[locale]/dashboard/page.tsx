"use client";

import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import LanguageSelector from "@/components/LanguageSelector";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const t = useTranslations("dashboard");

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {t("welcome", {
                  name: session.user.name || session.user.email,
                })}
              </span>
              <div className="h-10">
                <LanguageSelector />
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/signin" })}
                className="h-10 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
              >
                {t("signout")}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
            <h2 className="text-2xl font-bold mb-4">{t("content.title")}</h2>
            <p className="text-gray-600">{t("content.description")}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
