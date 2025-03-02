import { test, expect } from "@playwright/test";

test.describe("Forgot Password Page", () => {
  test.beforeEach(async ({ page }) => {
    // Accéder à la page de mot de passe oublié
    await page.goto("/en/forgot-password");
  });

  test("should display the forgot password form", async ({ page }) => {
    // Vérifier que le titre est présent
    await expect(page.locator("h1")).toContainText("Forgot Password");

    // Vérifier que les instructions sont présentes
    await expect(page.getByText(/Enter your email address/)).toBeVisible();

    // Vérifier que le champ email est présent
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();

    // Vérifier que le bouton d'envoi est présent
    await expect(page.locator('button[type="submit"]')).toContainText(
      "Send Reset Link"
    );
  });

  test("should show validation error for invalid email", async ({ page }) => {
    // Entrer un email invalide
    await page.locator('input[name="email"]').fill("invalid-email");

    // Cliquer sur le bouton d'envoi
    await page.locator('button[type="submit"]').click();

    // Vérifier que le message d'erreur est affiché
    await expect(page.locator("p.text-red-600")).toBeVisible();
    await expect(page.locator("p.text-red-600")).toContainText(
      "Invalid email format"
    );
  });

  test("should navigate back to sign in page", async ({ page }) => {
    // Cliquer sur le lien de retour à la connexion
    await page.locator('a:has-text("Back to Sign In")').click();

    // Vérifier que l'URL a changé
    await expect(page).toHaveURL(/\/signin/);
  });

  test("should validate form fields before submission", async ({ page }) => {
    // Cliquer sur le bouton de soumission sans remplir les champs
    await page.locator('button[type="submit"]').click();

    // Vérifier que le formulaire n'a pas été soumis (nous sommes toujours sur la même page)
    await expect(page).toHaveURL(/\/forgot-password/);

    // Vérifier que le champ email est requis
    await expect(page.locator('input[name="email"]')).toHaveAttribute(
      "required",
      ""
    );
  });
});
