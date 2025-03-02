import { test, expect } from "@playwright/test";

test.describe("Sign In Page", () => {
  test.beforeEach(async ({ page }) => {
    // Accéder à la page de connexion
    await page.goto("/en/signin");
  });

  test("should display the sign in form", async ({ page }) => {
    // Vérifier que le titre est présent
    await expect(page.locator("h1")).toContainText("Sign In");

    // Vérifier que les champs du formulaire sont présents
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText(
      "Sign In"
    );
  });

  test("should show validation error for invalid email", async ({ page }) => {
    // Entrer un email invalide
    await page.locator('input[name="email"]').fill("invalid-email");

    // Cliquer ailleurs pour déclencher la validation
    await page.locator('input[name="password"]').click();

    // Vérifier que le message d'erreur est affiché
    await expect(page.locator("p.text-red-600")).toBeVisible();
    await expect(page.locator("p.text-red-600")).toContainText(
      "Invalid email format"
    );
  });

  test("should toggle password visibility", async ({ page }) => {
    // Vérifier que le mot de passe est initialement masqué
    await expect(page.locator('input[name="password"]')).toHaveAttribute(
      "type",
      "password"
    );

    // Cliquer sur le bouton pour afficher le mot de passe
    await page.locator("button.absolute.inset-y-0.right-0").click();

    // Vérifier que le mot de passe est maintenant visible
    await expect(page.locator('input[name="password"]')).toHaveAttribute(
      "type",
      "text"
    );

    // Cliquer à nouveau pour masquer le mot de passe
    await page.locator("button.absolute.inset-y-0.right-0").click();

    // Vérifier que le mot de passe est à nouveau masqué
    await expect(page.locator('input[name="password"]')).toHaveAttribute(
      "type",
      "password"
    );
  });

  test("should navigate to sign up page", async ({ page }) => {
    // Cliquer sur le lien d'inscription
    await page.locator('a:has-text("Don\'t have an account? Sign up")').click();

    // Vérifier que l'URL a changé
    await expect(page).toHaveURL(/\/signup/);
  });

  test("should navigate to forgot password page", async ({ page }) => {
    // Cliquer sur le lien de mot de passe oublié
    await page.locator('a:has-text("Forgot password?")').click();

    // Vérifier que l'URL a changé
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});
