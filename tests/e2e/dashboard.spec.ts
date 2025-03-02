import { test, expect } from "@playwright/test";
import { waitForPageLoad } from "./utils";

test.describe("Dashboard Page", () => {
  // Note: Ce test est commenté car il nécessite une adaptation au backend
  // Il faudrait configurer un utilisateur de test valide
  /*
  test("should display dashboard elements when logged in", async ({ page }) => {
    // Aller à la page de connexion
    await goToSignInPage(page);
    
    // Remplir le formulaire de connexion avec des identifiants valides
    // Note: Ces identifiants doivent être valides dans votre environnement de test
    await page.fill("#email", "test@example.com");
    await page.fill("#password", "password123");
    
    // Soumettre le formulaire
    await page.click('button[type="submit"]');
    
    // Attendre que la redirection vers le tableau de bord soit complète
    await page.waitForURL(/.*\/dashboard/);
    await waitForPageLoad(page);
    
    // Vérifier que les éléments du tableau de bord sont visibles
    await expect(page.locator("h1").filter({ hasText: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Welcome to your Dashboard")).toBeVisible();
    await expect(page.getByText("This is a protected page")).toBeVisible();
    
    // Vérifier que le bouton de déconnexion est présent
    const signOutButton = page.getByRole("button", { name: "Sign out" });
    await expect(signOutButton).toBeVisible();
    
    // Test de la fonctionnalité de déconnexion
    // Note: Nous commentons cette partie car elle nécessite une adaptation au backend
    // await signOutButton.click();
    // await page.waitForURL(/.*\/signin/);
    // await expect(page.url()).toContain("/signin");
  });
  */

  test("should redirect to signin page when not authenticated", async ({
    page,
  }) => {
    // Essayer d'accéder directement au tableau de bord sans être connecté
    await page.goto("/dashboard");
    await waitForPageLoad(page);

    // Vérifier la redirection vers la page de connexion
    await page.waitForURL(/.*\/signin/);
    await expect(page.url()).toContain("/signin");
  });
});
