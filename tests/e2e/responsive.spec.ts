import { test, expect } from "@playwright/test";
import { goToHomePage, goToSignInPage, waitForPageLoad } from "./utils";

test.describe("Responsive Design", () => {
  // Test sur mobile
  test("should display correctly on mobile", async ({ page }) => {
    // Définir la taille de l'écran pour mobile
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await goToHomePage(page);
    await waitForPageLoad(page);

    // Vérifier que le sélecteur de langue est visible
    const languageSelector = page.getByRole("button", {
      name: /select language/i,
    });
    await expect(languageSelector).toBeVisible();

    // Vérifier d'autres éléments spécifiques au mobile si nécessaire
    // Par exemple, vérifier si le menu hamburger est présent
    const hamburgerMenu = page.locator("button[aria-label='Menu']");
    if (await hamburgerMenu.isVisible()) {
      // Si le menu hamburger est présent, vérifier qu'il fonctionne
      await hamburgerMenu.click();
      // Attendre que le menu s'ouvre
      await page.waitForTimeout(500);
      // Vérifier que les liens de navigation sont visibles
      await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
    }
  });

  // Test sur tablette
  test("should display correctly on tablet", async ({ page }) => {
    // Définir la taille de l'écran pour tablette
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad

    await goToHomePage(page);
    await waitForPageLoad(page);

    // Vérifier que le sélecteur de langue est visible
    const languageSelector = page.getByRole("button", {
      name: /select language/i,
    });
    await expect(languageSelector).toBeVisible();

    // Vérifier d'autres éléments spécifiques à la tablette si nécessaire
  });

  // Test sur desktop
  test("should display correctly on desktop", async ({ page }) => {
    // Définir la taille de l'écran pour desktop
    await page.setViewportSize({ width: 1280, height: 800 });

    await goToHomePage(page);
    await waitForPageLoad(page);

    // Vérifier que le sélecteur de langue est visible
    const languageSelector = page.getByRole("button", {
      name: /select language/i,
    });
    await expect(languageSelector).toBeVisible();

    // Vérifier d'autres éléments spécifiques au desktop si nécessaire
  });

  // Test de la page de connexion sur différentes tailles d'écran
  test("signin page should be responsive", async ({ page }) => {
    // Test sur mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await goToSignInPage(page);
    await waitForPageLoad(page);

    // Vérifier que le formulaire est visible
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    // Test sur tablette
    await page.setViewportSize({ width: 768, height: 1024 });
    await goToSignInPage(page);
    await waitForPageLoad(page);

    // Vérifier que le formulaire est visible
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    // Test sur desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await goToSignInPage(page);
    await waitForPageLoad(page);

    // Vérifier que le formulaire est visible
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });
});
