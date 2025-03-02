import { notFound } from "next/navigation";
import { locales, Locale } from "@/locales/config";
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
  params: Promise<Params> | Params;
}): Promise<Metadata> {
  try {
    // Attendre que params soit résolu
    const resolvedParams = await params;

    // Vérifier que params.locale existe et est valide
    const { locale } = resolvedParams;

    // Validate the locale
    if (!isValidLocale(locale)) {
      notFound();
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
      title: "My App",
      description: "A multilingual application",
    };
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params> | Params;
}) {
  try {
    // Attendre que params soit résolu
    const resolvedParams = await params;

    // Vérifier que params.locale existe et est valide
    const { locale } = resolvedParams;

    // Validate the locale
    if (!isValidLocale(locale)) {
      notFound();
    }

    return (
      <ClientLayout locale={locale}>
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">{children}</main>
        </div>
      </ClientLayout>
    );
  } catch (error) {
    console.error("Error in LocaleLayout:", error);
    // Fallback to default locale
    const defaultLocale = locales[0];
    return (
      <ClientLayout locale={defaultLocale}>
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">{children}</main>
        </div>
      </ClientLayout>
    );
  }
}
