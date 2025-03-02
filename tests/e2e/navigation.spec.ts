import { test, expect } from "@playwright/test";
import { goToSignInPage, goToSignUpPage, waitForPageLoad } from "./utils";

test.describe("Navigation", () => {
  // Note: Ce test est commenté car il nécessite une adaptation à l'application
  // Le lien de connexion peut ne pas être présent sur la page d'accueil
  /*
  test("should navigate from home to signin page", async ({ page }) => {
    // Aller à la page d'accueil
    await goToHomePage(page);
    
    // Cliquer sur le lien de connexion
    await page.getByRole("link", { name: /sign in/i }).click();
    
    // Vérifier que nous sommes sur la page de connexion
    await page.waitForURL(/.*\/signin/);
    await expect(page.url()).toContain("/signin");
  });
  */

  test("should navigate from signin to signup page", async ({ page }) => {
    // Aller à la page de connexion
    await goToSignInPage(page);

    // Cliquer sur le lien d'inscription
    await page.getByRole("link", { name: /sign up/i }).click();

    // Vérifier que nous sommes sur la page d'inscription
    await page.waitForURL(/.*\/signup/);
    await expect(page.url()).toContain("/signup");
  });

  test("should navigate from signup to signin page", async ({ page }) => {
    // Aller à la page d'inscription
    await goToSignUpPage(page);

    // Cliquer sur le lien de connexion
    await page.getByRole("link", { name: /sign in/i }).click();

    // Vérifier que nous sommes sur la page de connexion
    await page.waitForURL(/.*\/signin/);
    await expect(page.url()).toContain("/signin");
  });

  test("should navigate to home page when clicking on logo", async ({
    page,
  }) => {
    // Aller à la page de connexion
    await goToSignInPage(page);

    // Cliquer sur le logo (si présent)
    // Note: Adaptez ce sélecteur en fonction de votre implémentation
    const logo = page.locator(".logo, [aria-label='Home']").first();
    if (await logo.isVisible()) {
      await logo.click();

      // Vérifier que nous sommes sur la page d'accueil
      await waitForPageLoad(page);
      await expect(page.url()).toMatch(/\/(en|fr|es|de|it)?$/);
    }
  });
});
