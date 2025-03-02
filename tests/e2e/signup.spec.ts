import { test, expect } from "@playwright/test";

test.describe("Sign Up Page", () => {
  test.beforeEach(async ({ page }) => {
    // Accéder à la page d'inscription
    await page.goto("/en/signup");
  });

  test("should display the sign up form", async ({ page }) => {
    // Vérifier que le titre est présent
    await expect(page.locator("h1")).toContainText("Sign Up");

    // Vérifier que les champs du formulaire sont présents
    await expect(page.locator('label[for="name"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText(
      "Sign Up"
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

    // Utiliser un sélecteur plus précis pour le bouton de visibilité du mot de passe
    await page.locator('input[name="password"] ~ button').click();

    // Vérifier que le mot de passe est maintenant visible
    await expect(page.locator('input[name="password"]')).toHaveAttribute(
      "type",
      "text"
    );

    // Cliquer à nouveau pour masquer le mot de passe
    await page.locator('input[name="password"] ~ button').click();

    // Vérifier que le mot de passe est à nouveau masqué
    await expect(page.locator('input[name="password"]')).toHaveAttribute(
      "type",
      "password"
    );
  });

  test("should navigate to sign in page", async ({ page }) => {
    // Cliquer sur le lien de connexion
    await page
      .locator('a:has-text("Already have an account? Sign in")')
      .click();

    // Vérifier que l'URL a changé
    await expect(page).toHaveURL(/\/signin/);
  });

  test("should validate form fields before submission", async ({ page }) => {
    // Cliquer sur le bouton de soumission sans remplir les champs
    await page.locator('button[type="submit"]').click();

    // Vérifier que le formulaire n'a pas été soumis (nous sommes toujours sur la même page)
    await expect(page).toHaveURL(/\/signup/);

    // Vérifier que les champs requis sont mis en évidence
    // Note: La façon exacte dont les champs requis sont mis en évidence peut varier
    // selon l'implémentation, mais nous pouvons vérifier les attributs required
    await expect(page.locator('input[name="name"]')).toHaveAttribute(
      "required",
      ""
    );
    await expect(page.locator('input[name="email"]')).toHaveAttribute(
      "required",
      ""
    );
    await expect(page.locator('input[name="password"]')).toHaveAttribute(
      "required",
      ""
    );
  });
});
