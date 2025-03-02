import { test, expect } from "@playwright/test";
import { goToSignUpPage } from "./utils";

test.describe("Page d'inscription", () => {
  test("devrait afficher le formulaire d'inscription", async ({ page }) => {
    await goToSignUpPage(page);

    // Vérifier que le titre est présent
    await expect(page.getByRole("heading", { name: /sign up/i })).toBeVisible();

    // Vérifier que les champs du formulaire sont présents
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#confirmPassword")).toBeVisible();

    // Vérifier que le bouton d'inscription est présent
    await expect(page.getByRole("button", { name: /sign up/i })).toBeVisible();

    // Vérifier que le lien vers la page de connexion est présent
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  // Ce test est commenté car il nécessite une adaptation à votre backend
  /*
  test("devrait afficher une erreur si les mots de passe ne correspondent pas", async ({
    page,
  }) => {
    await goToSignUpPage(page);

    // Remplir le formulaire avec des mots de passe différents
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.locator('#password').fill("password123");
    await page.locator('#confirmPassword').fill("password456");

    // Soumettre le formulaire
    await page.getByRole("button", { name: /sign up/i }).click();

    // Vérifier qu'un message d'erreur s'affiche
    await expect(page.getByText(/passwords do not match/i)).toBeVisible({
      timeout: 5000,
    });
  });
  */
});
