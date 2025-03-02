import { test, expect } from "@playwright/test";
import { goToSignInPage } from "./utils";

test.describe("Page de connexion", () => {
  test("devrait afficher le formulaire de connexion", async ({ page }) => {
    await goToSignInPage(page);

    // Vérifier que le titre est présent
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();

    // Vérifier que les champs du formulaire sont présents
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();

    // Vérifier que le bouton de connexion est présent
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

    // Vérifier que le lien vers la page d'inscription est présent
    await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();

    // Vérifier que le lien vers la page de mot de passe oublié est présent
    await expect(
      page.getByRole("link", { name: /forgot password/i })
    ).toBeVisible();
  });

  // Ce test est commenté car il nécessite une adaptation à votre backend
  /*
  test("devrait afficher une erreur avec des identifiants invalides", async ({
    page,
  }) => {
    await goToSignInPage(page);

    // Remplir le formulaire avec des identifiants invalides
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");

    // Soumettre le formulaire
    await page.getByRole("button", { name: /sign in/i }).click();

    // Vérifier qu'un message d'erreur s'affiche
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({
      timeout: 5000,
    });
  });
  */
});
