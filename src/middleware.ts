import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { locales, defaultLocale, Locale } from "@/config";

// Create the internationalization middleware
const intlMiddleware = createMiddleware({
  locales: locales,
  defaultLocale: defaultLocale,
  localePrefix: "always",
  getRequestConfig: async ({ locale }: { locale: Locale }) => {
    return {
      messages: (await import(`@/locales/messages/${locale}/dashboard.json`))
        .default,
      timeZone: "UTC",
      now: new Date(),
      locale,
    };
  },
});

export default async function middleware(request: NextRequest) {
  const publicPages = [
    "/signin",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];
  const isPublicPage = publicPages.some((page) =>
    request.nextUrl.pathname.endsWith(page)
  );

  // Get the locale from the URL
  const locale = request.nextUrl.pathname.split("/")[1] as Locale;

  // Appliquer l'internationalisation
  const response = intlMiddleware(request);

  // Si c'est une page publique, retourner directement la réponse
  if (isPublicPage) {
    return response;
  }

  // En mode test e2e, contourner la vérification d'authentification
  if (process.env.NEXT_PUBLIC_E2E_TEST === "true") {
    return response;
  }

  // Vérifier l'authentification
  const token = await getToken({ req: request });
  if (!token) {
    // Rediriger vers la page de connexion avec la locale actuelle
    const signInUrl = new URL(`/${locale}/signin`, request.url);
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

export const config = {
  matcher: ["/", "/(fr|en)/:path*"],
};
