import { test, expect } from "./fixtures";

test.describe("Dashboard Page", () => {
  // For dashboard tests, we need to simulate a logged-in user
  // This can be done by configuring a test state or using mocks

  test("should redirect to signin when not authenticated", async ({ page }) => {
    // Access the dashboard without being authenticated
    await page.goto("/en/dashboard");

    // Check that the user is redirected to the login page
    await expect(page).toHaveURL(/\/signin/);

    // Check that the login page is displayed
    await expect(page.locator("h1")).toContainText("Sign In");
  });

  // The following tests use our authentication fixture
  test.describe("Authenticated User", () => {
    test.skip("should display the dashboard with welcome message in header", async ({
      authenticatedPage,
    }) => {
      const { page, userData } = authenticatedPage;

      // The page is already loaded with mocked authentication

      // Check that the dashboard title is present
      await expect(page.locator("h1")).toContainText("Dashboard");

      // Check that the welcome message in the header contains the user's name
      await expect(
        page.locator("nav .flex.items-center span.text-gray-700")
      ).toContainText(`Welcome, ${userData.name}`);

      // Check that the sign out button is present
      await expect(page.getByText("Sign Out")).toBeVisible();
    });

    test.skip("should sign out when clicking the sign out button", async ({
      authenticatedPage,
    }) => {
      const { page } = authenticatedPage;

      // The page is already loaded with mocked authentication

      // Click on the sign out button
      await page.getByText("Sign Out").click();

      // Check that the user is redirected to the login page
      await expect(page).toHaveURL(/\/signin/);
    });

    test.skip("should maintain language preference and display localized welcome message", async ({
      authenticatedPage,
    }) => {
      const { page, userData } = authenticatedPage;

      // The page is already loaded with mocked authentication

      // Open the language selector
      await page.locator('button[aria-label="Select language"]').click();

      // Select French
      await page.locator('button:has-text("Français")').click();

      // Check that the URL has changed to include /fr
      await expect(page).toHaveURL(/\/fr\/dashboard/);

      // Check that the content is in French
      await expect(page.locator("h1")).toContainText("Tableau de bord");

      // Check that the welcome message in the header is in French and contains the user's name
      await expect(
        page.locator("nav .flex.items-center span.text-gray-700")
      ).toContainText(`Bienvenue, ${userData.name}`);
    });

    test("should allow user to logout", async ({ authenticatedPage }) => {
      const { page } = authenticatedPage;

      // The page is already loaded with mocked authentication

      // Click on the sign out button
      await page.getByText("Sign Out").click();

      // Check that the user is redirected to the login page
      await expect(page).toHaveURL(/\/signin/);
    });

    test("should allow changing language", async ({ authenticatedPage }) => {
      const { page } = authenticatedPage;

      // The page is already loaded with mocked authentication

      // Open the language selector
      await page.locator('button[aria-label="Select language"]').click();

      // Select French
      await page.locator('button:has-text("Français")').click();

      // Check that the URL has changed to include /fr
      await expect(page).toHaveURL(/\/fr\/dashboard/);

      // Check that the content is in French
      await expect(page.locator("h1")).toContainText("Tableau de bord");

      // Check that the welcome message in the header is in French and contains the user's name
      await expect(
        page.locator("nav .flex.items-center span.text-gray-700")
      ).toContainText(`Bienvenue, ${authenticatedPage.userData.name}`);
    });
  });
});
