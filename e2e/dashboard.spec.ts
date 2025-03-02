import { test, expect } from "./fixtures";

test.describe("Dashboard Page", () => {
  // Pour les tests du tableau de bord, nous devons simuler un utilisateur connecté
  // Cela peut être fait en configurant un état de test ou en utilisant des mocks

  test("should redirect to signin when not authenticated", async ({ page }) => {
    // Accéder au tableau de bord sans être authentifié
    await page.goto("/en/dashboard");

    // Vérifier que l'utilisateur est redirigé vers la page de connexion
    await expect(page).toHaveURL(/\/signin/);

    // Vérifier que la page de connexion est affichée
    await expect(page.locator("h1")).toContainText("Sign In");
  });

  // Les tests suivants utilisent notre fixture d'authentification
  test.describe("Authenticated User", () => {
    test.skip("should display the dashboard with welcome message in header", async ({
      authenticatedPage,
    }) => {
      const { page, userData } = authenticatedPage;

      // La page est déjà chargée avec l'authentification mockée

      // Vérifier que le titre du tableau de bord est présent
      await expect(page.locator("h1")).toContainText("Dashboard");

      // Vérifier que le message de bienvenue dans l'en-tête contient le nom de l'utilisateur
      await expect(
        page.locator("nav .flex.items-center span.text-gray-700")
      ).toContainText(`Welcome, ${userData.name}`);

      // Vérifier que le bouton de déconnexion est présent
      await expect(page.getByText("Sign Out")).toBeVisible();
    });

    test.skip("should sign out when clicking the sign out button", async ({
      authenticatedPage,
    }) => {
      const { page } = authenticatedPage;

      // La page est déjà chargée avec l'authentification mockée

      // Cliquer sur le bouton de déconnexion
      await page.getByText("Sign Out").click();

      // Vérifier que l'utilisateur est redirigé vers la page de connexion
      await expect(page).toHaveURL(/\/signin/);
    });

    test.skip("should maintain language preference and display localized welcome message", async ({
      authenticatedPage,
    }) => {
      const { page, userData } = authenticatedPage;

      // La page est déjà chargée avec l'authentification mockée

      // Ouvrir le sélecteur de langue
      await page.locator('button[aria-label="Select language"]').click();

      // Sélectionner le français
      await page.locator('button:has-text("Français")').click();

      // Vérifier que l'URL a changé pour inclure /fr
      await expect(page).toHaveURL(/\/fr\/dashboard/);

      // Vérifier que le contenu est en français
      await expect(page.locator("h1")).toContainText("Tableau de bord");

      // Vérifier que le message de bienvenue dans l'en-tête est en français et contient le nom de l'utilisateur
      await expect(
        page.locator("nav .flex.items-center span.text-gray-700")
      ).toContainText(`Bienvenue, ${userData.name}`);
    });
  });
});
