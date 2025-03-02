import { test, expect } from "@playwright/test";
import { goToSignInPage, goToSignUpPage } from "./utils";

test.describe("Form Validation", () => {
  test.describe("Sign In Form", () => {
    test("should prevent submission with empty email", async ({ page }) => {
      await goToSignInPage(page);

      // Soumettre le formulaire sans remplir l'email
      await page.fill("#password", "password123");
      await page.click('button[type="submit"]');

      // Vérifier que nous sommes toujours sur la page de connexion
      await expect(page.url()).toContain("/signin");

      // Vérifier que le champ email a l'attribut required
      const emailRequired = await page
        .locator("#email")
        .getAttribute("required");
      expect(emailRequired).not.toBeNull();
    });

    test("should prevent submission with empty password", async ({ page }) => {
      await goToSignInPage(page);

      // Soumettre le formulaire sans remplir le mot de passe
      await page.fill("#email", "test@example.com");
      await page.click('button[type="submit"]');

      // Vérifier que nous sommes toujours sur la page de connexion
      await expect(page.url()).toContain("/signin");

      // Vérifier que le champ password a l'attribut required
      const passwordRequired = await page
        .locator("#password")
        .getAttribute("required");
      expect(passwordRequired).not.toBeNull();
    });

    test("should prevent submission with invalid email format", async ({
      page,
    }) => {
      await goToSignInPage(page);

      // Soumettre le formulaire avec un email invalide
      await page.fill("#email", "invalid-email");
      await page.fill("#password", "password123");
      await page.click('button[type="submit"]');

      // Vérifier que nous sommes toujours sur la page de connexion
      await expect(page.url()).toContain("/signin");
    });
  });

  test.describe("Sign Up Form", () => {
    test("should prevent submission with empty email", async ({ page }) => {
      await goToSignUpPage(page);

      // Soumettre le formulaire sans remplir l'email
      await page.fill("#password", "password123");
      await page.fill("#confirmPassword", "password123");
      await page.click('button[type="submit"]');

      // Vérifier que nous sommes toujours sur la page d'inscription
      await expect(page.url()).toContain("/signup");

      // Vérifier que le champ email a l'attribut required
      const emailRequired = await page
        .locator("#email")
        .getAttribute("required");
      expect(emailRequired).not.toBeNull();
    });

    test("should prevent submission with empty password", async ({ page }) => {
      await goToSignUpPage(page);

      // Soumettre le formulaire sans remplir le mot de passe
      await page.fill("#email", "test@example.com");
      await page.fill("#confirmPassword", "password123");
      await page.click('button[type="submit"]');

      // Vérifier que nous sommes toujours sur la page d'inscription
      await expect(page.url()).toContain("/signup");

      // Vérifier que le champ password a l'attribut required
      const passwordRequired = await page
        .locator("#password")
        .getAttribute("required");
      expect(passwordRequired).not.toBeNull();
    });

    test("should prevent submission with password mismatch", async ({
      page,
    }) => {
      await goToSignUpPage(page);

      // Soumettre le formulaire avec des mots de passe différents
      await page.fill("#email", "test@example.com");
      await page.fill("#password", "password123");
      await page.fill("#confirmPassword", "different-password");
      await page.click('button[type="submit"]');

      // Vérifier que nous sommes toujours sur la page d'inscription
      await expect(page.url()).toContain("/signup");
    });

    test("should prevent submission with invalid email format", async ({
      page,
    }) => {
      await goToSignUpPage(page);

      // Soumettre le formulaire avec un email invalide
      await page.fill("#email", "invalid-email");
      await page.fill("#password", "password123");
      await page.fill("#confirmPassword", "password123");
      await page.click('button[type="submit"]');

      // Vérifier que nous sommes toujours sur la page d'inscription
      await expect(page.url()).toContain("/signup");
    });
  });
});
