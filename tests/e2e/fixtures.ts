import { test as base, Page } from "@playwright/test";
import { mockAuthentication } from "./utils";

// Extend Playwright's fixture type to include our authenticated user
export type AuthFixture = {
  userId: string;
  email: string;
  name: string;
};

// Default test user data
export const defaultUser: AuthFixture = {
  userId: "test-user-id",
  email: "test@example.com",
  name: "Test User",
};

// Create an extended version of Playwright's test with our authentication fixture
export const test = base.extend<{
  authenticatedPage: Page;
  authUser: AuthFixture;
}>({
  // Define the authenticatedPage fixture
  authenticatedPage: async (
    { page, authUser },
    use: (page: Page) => Promise<void>
  ) => {
    // Authenticate the user before running the test
    await mockAuthentication(page, {
      id: authUser.userId,
      name: authUser.name,
      email: authUser.email,
    });

    // Provide the authenticated page to the test
    await use(page);
  },

  // Provide the authenticated page and user data to the test
  authUser: [defaultUser, { option: true }],
});

// Re-export expect from Playwright for easier usage
export { expect } from "@playwright/test";
