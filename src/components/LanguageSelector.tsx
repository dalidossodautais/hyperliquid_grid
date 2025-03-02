"use client";

import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useState, useEffect } from "react";

const languages = {
  en: { flag: "🇺🇸", name: "English" },
  fr: { flag: "🇫🇷", name: "Français" },
  es: { flag: "🇪🇸", name: "Español" },
  de: { flag: "🇩🇪", name: "Deutsch" },
  it: { flag: "🇮🇹", name: "Italiano" },
};

export default function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  // Initialize with null to prevent hydration mismatch
  const [isOpen, setIsOpen] = useState<boolean | null>(null);

  // Set the initial state on the client side only
  useEffect(() => {
    setIsOpen(false);
  }, []);

  const handleLanguageChange = (newLocale: string) => {
    const currentPath = pathname;
    const newPath = currentPath.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
    setIsOpen(false);
  };

  // Don't render dropdown until after hydration
  if (isOpen === null) {
    return null;
  }

  return (
    <div className="relative flex items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 flex items-center space-x-2 bg-white px-4 py-2 rounded-md text-sm font-medium border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
        aria-label="Select language"
      >
        <span className="text-gray-700 flex items-center space-x-2">
          <span className="text-base">
            {languages[locale as keyof typeof languages].flag}
          </span>
          <span>{languages[locale as keyof typeof languages].name}</span>
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 py-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          {Object.entries(languages).map(([code, { flag, name }]) => (
            <button
              key={code}
              onClick={() => handleLanguageChange(code)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer ${
                locale === code
                  ? "text-indigo-600 font-medium"
                  : "text-gray-700"
              }`}
            >
              <span className="flex items-center space-x-2">
                <span className="text-base">{flag}</span>
                <span>{name}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
