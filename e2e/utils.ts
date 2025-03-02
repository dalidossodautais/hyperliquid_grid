import { Page } from "@playwright/test";

/**
 * Simule l'authentification d'un utilisateur en définissant les cookies nécessaires
 * pour que Next-Auth considère l'utilisateur comme authentifié.
 *
 * @param page - L'instance de Page Playwright
 * @param userData - Les données de l'utilisateur à utiliser pour l'authentification
 */
export async function mockAuthentication(
  page: Page,
  userData = {
    id: "test-user-id",
    name: "Test User",
    email: "test@example.com",
  }
) {
  // Créer un cookie de session qui simule celui créé par NextAuth
  const sessionToken = `${userData.id}|${userData.email}`;

  // Créer un cookie pour la session qui contient les données utilisateur
  // Ce cookie est utilisé par useSession() côté client
  const sessionCookie = Buffer.from(
    JSON.stringify({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
  ).toString("base64");

  // Définir les cookies nécessaires pour Next-Auth
  await page.context().addCookies([
    {
      name: "next-auth.session-token",
      value: sessionToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    },
    {
      name: "__Secure-next-auth.session-token",
      value: sessionToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    },
    {
      name: "next-auth.callback-url",
      value: "http://localhost:3000/dashboard",
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    },
    {
      name: "next-auth.csrf-token",
      value: "test-csrf-token",
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    },
    // Ce cookie est crucial pour que useSession() fonctionne côté client
    {
      name: "next-auth.session",
      value: sessionCookie,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    },
  ]);

  // Accéder à la page du tableau de bord pour que les cookies prennent effet
  await page.goto("/en/dashboard");

  // Injecter un script pour simuler l'état d'authentification côté client
  await page.addScriptTag({
    content: `
      // Simuler l'état de session pour useSession()
      window.mockNextAuthSession = {
        user: {
          id: "${userData.id}",
          name: "${userData.name}",
          email: "${userData.email}"
        },
        expires: "${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()}"
      };
      
      // Intercepter les appels à useSession
      const originalFetch = window.fetch;
      window.fetch = function(url, options) {
        if (url === '/api/auth/session') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(window.mockNextAuthSession)
          });
        }
        return originalFetch.apply(this, arguments);
      };
      
      // Forcer une mise à jour de l'état de session
      window.dispatchEvent(new Event('storage'));
    `,
  });
}

/**
 * Vérifie si l'utilisateur est authentifié en vérifiant la présence des cookies
 *
 * @param page - L'instance de Page Playwright
 * @returns true si l'utilisateur est authentifié, false sinon
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some((cookie) => cookie.name === "next-auth.session-token");
}
