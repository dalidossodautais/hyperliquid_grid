import { test as base, Page } from "@playwright/test";
import { mockAuthentication } from "./utils";

// Étendre le type de fixture de Playwright pour inclure notre utilisateur authentifié
type AuthFixtures = {
  authenticatedPage: {
    page: Page;
    userData: {
      id: string;
      name: string;
      email: string;
    };
  };
};

// Créer une version étendue du test Playwright avec notre fixture d'authentification
export const test = base.extend<AuthFixtures>({
  // Définir la fixture authenticatedPage
  authenticatedPage: async ({ page }, runTest) => {
    // Données utilisateur par défaut
    const userData = {
      id: "test-user-id",
      name: "Test User",
      email: "test@example.com",
    };

    // Mocker l'authentification
    await mockAuthentication(page, userData);

    // Fournir la page authentifiée et les données utilisateur au test
    await runTest({ page, userData });
  },
});

// Réexporter expect de Playwright pour faciliter l'utilisation
export { expect } from "@playwright/test";
