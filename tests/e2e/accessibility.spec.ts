import { test, expect } from "@playwright/test";
import {
  goToHomePage,
  goToSignInPage,
  goToSignUpPage,
  waitForPageLoad,
} from "./utils";

test.describe("Accessibility", () => {
  test("home page should have proper heading structure", async ({ page }) => {
    await goToHomePage(page);
    await waitForPageLoad(page);

    // Vérifier que la page a un titre principal
    const h1Elements = await page.locator("h1").count();
    expect(h1Elements).toBeGreaterThan(0);

    // Vérifier que les boutons ont un attribut aria-label ou du texte visible
    // Note: Nous ne vérifions plus que tous les boutons ont un aria-label car certains peuvent avoir du texte visible
    const buttons = await page
      .locator("button:not([aria-label]):not([aria-labelledby]):empty")
      .count();
    expect(buttons).toBe(0);

    const links = await page
      .locator("a:not([aria-label]):not([aria-labelledby]):empty")
      .count();
    expect(links).toBe(0);
  });

  test("signin page should be keyboard navigable", async ({ page }) => {
    await goToSignInPage(page);
    await waitForPageLoad(page);

    // Vérifier que les champs de formulaire sont accessibles au clavier
    await page.keyboard.press("Tab"); // Focus sur le premier élément (généralement le logo ou le lien de retour)
    await page.keyboard.press("Tab"); // Focus sur le champ email

    // Vérifier que le focus est sur le champ email
    const activeElement = await page.evaluate(() => document.activeElement?.id);
    expect(activeElement).toBe("email");

    // Continuer la navigation au clavier
    await page.keyboard.press("Tab"); // Focus sur le champ mot de passe
    const activeElement2 = await page.evaluate(
      () => document.activeElement?.id
    );
    expect(activeElement2).toBe("password");

    await page.keyboard.press("Tab"); // Focus sur le bouton de connexion
    const activeElement3 = await page.evaluate(() =>
      document.activeElement?.tagName.toLowerCase()
    );
    expect(activeElement3).toBe("button");
  });

  test("signup page should have proper form labels", async ({ page }) => {
    await goToSignUpPage(page);
    await waitForPageLoad(page);

    // Vérifier que tous les champs de formulaire ont des labels associés
    const emailLabel = page.locator("label[for='email']");
    await expect(emailLabel).toBeVisible();

    const passwordLabel = page.locator("label[for='password']");
    await expect(passwordLabel).toBeVisible();

    const confirmPasswordLabel = page.locator("label[for='confirmPassword']");
    await expect(confirmPasswordLabel).toBeVisible();
  });

  test("language selector should be accessible", async ({ page }) => {
    await goToHomePage(page);
    await waitForPageLoad(page);

    // Vérifier que le sélecteur de langue a un attribut aria-label
    const languageSelector = page.getByRole("button", {
      name: /select language/i,
    });
    await expect(languageSelector).toBeVisible();

    // Vérifier que le menu déroulant est accessible au clavier
    await languageSelector.focus();
    await page.keyboard.press("Enter");

    // Vérifier que le menu est visible
    const languageMenu = page.locator(".absolute.right-0.top-full");
    await expect(languageMenu).toBeVisible();
  });
});
