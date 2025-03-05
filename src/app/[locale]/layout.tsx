import { notFound } from "next/navigation";
import { locales, Locale, defaultLocale } from "@/config";
import ClientLayout from "@/components/client-layout";
import { Metadata } from "next";
import NotificationContainer from "@/components/ui/NotificationContainer";
import { NextIntlClientProvider } from "next-intl";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Function to check if a locale is valid
function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  // Validate the locale
  if (!isValidLocale(locale)) {
    return {
      title: "Hyperliquid Grid",
      description: "Hyperliquid Grid Trading Interface",
    };
  }

  return {
    title: {
      template: "%s | My App",
      default: "My App",
    },
    description: "A multilingual application",
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate the locale
  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load messages for the current locale
  try {
    const [dashboardMessages, authMessages] = await Promise.all([
      import(`@/locales/messages/${locale}/dashboard.json`),
      import(`@/locales/messages/${locale}/auth.json`),
    ]);

    const messages = {
      dashboard: dashboardMessages.default,
      auth: authMessages.default,
    };

    return (
      <html lang={locale} suppressHydrationWarning>
        <body suppressHydrationWarning>
          <NextIntlClientProvider
            messages={messages}
            locale={locale}
            timeZone="UTC"
            now={new Date()}
          >
            <ClientLayout locale={locale} messages={messages}>
              <div className="min-h-screen flex flex-col">
                <main className="flex-1">{children}</main>
                <NotificationContainer />
              </div>
            </ClientLayout>
          </NextIntlClientProvider>
        </body>
      </html>
    );
  } catch (loadError) {
    console.error(`Error loading messages for locale ${locale}:`, loadError);
    // Fallback to default locale
    const [dashboardMessages, authMessages] = await Promise.all([
      import(`@/locales/messages/${defaultLocale}/dashboard.json`),
      import(`@/locales/messages/${defaultLocale}/auth.json`),
    ]);

    const messages = {
      dashboard: dashboardMessages.default,
      auth: authMessages.default,
    };

    return (
      <html lang={locale} suppressHydrationWarning>
        <body suppressHydrationWarning>
          <NextIntlClientProvider
            messages={messages}
            locale={locale}
            timeZone="UTC"
            now={new Date()}
          >
            <ClientLayout locale={defaultLocale} messages={messages}>
              <div className="min-h-screen flex flex-col">
                <main className="flex-1">{children}</main>
                <NotificationContainer />
              </div>
            </ClientLayout>
          </NextIntlClientProvider>
        </body>
      </html>
    );
  }
}
