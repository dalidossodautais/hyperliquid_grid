import { Page } from "@playwright/test";

/**
 * Attend que la page soit chargée et prête
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState("networkidle");
}

/**
 * Navigue vers la page d'accueil
 */
export async function goToHomePage(page: Page) {
  await page.goto("/");
  await waitForPageLoad(page);
}

/**
 * Navigue vers la page de connexion
 */
export async function goToSignInPage(page: Page) {
  await page.goto("/signin");
  await waitForPageLoad(page);
}

/**
 * Navigue vers la page d'inscription
 */
export async function goToSignUpPage(page: Page) {
  await page.goto("/signup");
  await waitForPageLoad(page);
}

/**
 * Navigue vers la page de mot de passe oublié
 */
export async function goToForgotPasswordPage(page: Page) {
  await page.goto("/forgot-password");
  await waitForPageLoad(page);
}

/**
 * Vérifie si un élément est visible
 */
export async function isElementVisible(
  page: Page,
  selector: string
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: "visible", timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Change la langue de l'application
 * Note: Cette fonction est adaptée pour fonctionner avec le sélecteur de langue spécifique de l'application
 */
export async function changeLanguage(page: Page, language: string) {
  await page.getByRole("button", { name: /language/i }).click();
  await page.getByText(new RegExp(language, "i")).click();
  await waitForPageLoad(page);
}
