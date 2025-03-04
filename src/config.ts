import { Pathnames } from "next-intl/navigation";

export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const pathnames = {
  "/": "/",
  "/signin": "/signin",
  "/signup": "/signup",
  "/dashboard": "/dashboard",
  "/forgot-password": "/forgot-password",
  "/reset-password": "/reset-password",
} satisfies Pathnames<typeof locales>;

export const localePrefix = "always"; // Default

export type PathnameLocale = typeof pathnames;
