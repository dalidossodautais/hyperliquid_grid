import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale, Locale } from "../config";

export default getRequestConfig(async ({ locale }) => {
  // Ensure locale is valid, fallback to default if not
  const validLocale = locales.includes(locale as Locale)
    ? locale
    : defaultLocale;

  // Load messages for the current locale
  const messages = {
    auth: (await import(`./messages/${validLocale}/auth.json`)).default,
    dashboard: (await import(`./messages/${validLocale}/dashboard.json`))
      .default,
  };

  return {
    messages,
    // Use UTC for consistent timezone handling
    timeZone: "UTC",
    // Use a fixed date to avoid hydration issues
    now: new Date("2023-01-01T00:00:00.000Z"),
  };
});
