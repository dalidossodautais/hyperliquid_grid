import { test, expect } from "@playwright/test";

test.describe("Language Selector", () => {
  test("should change the language when a different language is selected", async ({
    page,
  }) => {
    // Accéder à la page d'accueil
    await page.goto("/en");

    // Vérifier que la langue actuelle est l'anglais
    const languageButton = page.locator('button[aria-label="Select language"]');
    await expect(languageButton).toContainText("English");

    // Ouvrir le sélecteur de langue
    await languageButton.click();

    // Vérifier que le menu déroulant est visible et au-dessus des autres éléments
    const dropdown = page.locator("div.absolute.z-50");
    await expect(dropdown).toBeVisible();

    // Sélectionner le français
    await page.locator('button:has-text("Français")').click();

    // Vérifier que l'URL a changé pour inclure /fr
    await expect(page).toHaveURL(/\/fr/);

    // Vérifier que le texte du bouton a changé pour afficher "Français"
    await expect(
      page.locator('button[aria-label="Select language"]')
    ).toContainText("Français");
  });

  test("should display the dropdown above other elements", async ({ page }) => {
    // Accéder à la page de connexion
    await page.goto("/en/signin");

    // Ouvrir le sélecteur de langue
    await page.locator('button[aria-label="Select language"]').click();

    // Vérifier que le menu déroulant est visible
    const dropdown = page.locator("div.absolute.z-50");
    await expect(dropdown).toBeVisible();

    // Vérifier que le z-index est correctement appliqué
    const zIndex = await dropdown.evaluate((el) => {
      return window.getComputedStyle(el).getPropertyValue("z-index");
    });

    expect(parseInt(zIndex)).toBeGreaterThanOrEqual(50);
  });
});
