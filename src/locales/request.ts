import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => {
  // Load messages for the current locale
  const messages = {
    ...(await import(`./messages/${locale}/common.json`)).default,
    ...(await import(`./messages/${locale}/auth.json`)).default,
  };

  return {
    messages,
    // Use UTC for consistent timezone handling
    timeZone: "UTC",
    // Use a fixed date to avoid hydration issues
    now: new Date("2023-01-01T00:00:00.000Z"),
  };
});
