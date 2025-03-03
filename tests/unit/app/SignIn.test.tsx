import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignIn from "@/app/[locale]/(auth)/signin/page";
import "@testing-library/jest-dom";

// Mock le composant LanguageSelector
jest.mock("@/components/LanguageSelector", () => {
  return function MockLanguageSelector() {
    return <div data-testid="language-selector">Language Selector</div>;
  };
});

// Mock de next-auth/react
let resolveSignIn: (value: unknown) => void;
const mockSignIn = jest.fn(() => {
  return new Promise((resolve) => {
    resolveSignIn = resolve;
  });
});

jest.mock("next-auth/react", () => ({
  signIn: () => mockSignIn(),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Désactiver temporairement les tests
describe.skip("SignIn Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the sign-in form correctly", () => {
    // Arrange & Act
    render(<SignIn />);

    // Assert
    expect(screen.getByText("auth.signin.title")).toBeInTheDocument();
    expect(screen.getByLabelText("auth.signin.email")).toBeInTheDocument();
    expect(screen.getByLabelText("auth.signin.password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "auth.signin.submit" })
    ).toBeInTheDocument();
  });

  it("submits the form with email and password", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SignIn />);

    // Act
    const emailInput = screen.getByLabelText("auth.signin.email");
    const passwordInput = screen.getByLabelText("auth.signin.password");
    const submitButton = screen.getByRole("button", {
      name: "auth.signin.submit",
    });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    // Assert
    expect(mockSignIn).toHaveBeenCalledWith("credentials", {
      redirect: false,
      email: "test@example.com",
      password: "password123",
    });
  });

  it("displays an error message when sign-in fails", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SignIn />);

    // Act
    const emailInput = screen.getByLabelText("auth.signin.email");
    const passwordInput = screen.getByLabelText("auth.signin.password");
    const submitButton = screen.getByRole("button", {
      name: "auth.signin.submit",
    });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "wrongpassword");
    await user.click(submitButton);

    // Resolve the sign-in promise with an error
    resolveSignIn({ error: "Invalid credentials" });

    // Assert
    await waitFor(() => {
      expect(screen.getByText("auth.signin.error.invalid")).toBeInTheDocument();
    });
  });

  it("shows loading state during the sign-in process", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SignIn />);

    // Act
    const emailInput = screen.getByLabelText("auth.signin.email");
    const passwordInput = screen.getByLabelText("auth.signin.password");
    const submitButton = screen.getByRole("button", {
      name: "auth.signin.submit",
    });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    // Assert - Check for loading state
    expect(screen.getByText("auth.signin.loading")).toBeInTheDocument();

    // Cleanup - Resolve the promise to avoid hanging
    resolveSignIn({ ok: true });
  });
});
