import { notFound } from "next/navigation";
import { locales, Locale, defaultLocale } from "@/config";
import ClientLayout from "@/components/client-layout";
import { Metadata } from "next";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Function to check if a locale is valid
function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Define the params type correctly
type Params = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const { locale } = resolvedParams;

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
  } catch (error) {
    console.error("Error in generateMetadata:", error);
    return {
      title: "Hyperliquid Grid",
      description: "Hyperliquid Grid Trading Interface",
    };
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  try {
    const resolvedParams = await params;

    // Vérifier que params.locale existe et est valide
    const { locale } = resolvedParams;

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
        <ClientLayout locale={locale} messages={messages}>
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">{children}</main>
          </div>
        </ClientLayout>
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
        <ClientLayout locale={defaultLocale} messages={messages}>
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">{children}</main>
          </div>
        </ClientLayout>
      );
    }
  } catch (error) {
    console.error("Error in LocaleLayout:", error);
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
      <ClientLayout locale={defaultLocale} messages={messages}>
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">{children}</main>
        </div>
      </ClientLayout>
    );
  }
}
