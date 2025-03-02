import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignIn from "@/app/(auth)/signin/page";

// Mock de next-auth/react
const mockSignIn = jest.fn();
jest.mock("next-auth/react", () => ({
  signIn: (...args: any[]) => mockSignIn(...args),
}));

// Mock de next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

describe("SignIn Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the sign in form correctly", () => {
    // Arrange & Act
    render(<SignIn />);

    // Assert
    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(
      screen.getByText("Don't have an account? Sign up")
    ).toBeInTheDocument();
  });

  it("submits the form with email and password", async () => {
    // Arrange
    mockSignIn.mockResolvedValueOnce({ error: null });
    const user = userEvent.setup();
    render(<SignIn />);

    // Act
    await user.type(
      screen.getByPlaceholderText("Email address"),
      "test@example.com"
    );
    await user.type(screen.getByPlaceholderText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    // Assert
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "test@example.com",
        password: "password123",
        redirect: false,
      });
    });
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("displays an error message when sign in fails", async () => {
    // Arrange
    mockSignIn.mockResolvedValueOnce({ error: "Invalid credentials" });
    const user = userEvent.setup();
    render(<SignIn />);

    // Act
    await user.type(
      screen.getByPlaceholderText("Email address"),
      "test@example.com"
    );
    await user.type(screen.getByPlaceholderText("Password"), "wrongpassword");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows loading state during sign in process", async () => {
    // Arrange
    // Create a promise that we can resolve manually to control the timing
    let resolveSignIn: (value: any) => void;
    const signInPromise = new Promise((resolve) => {
      resolveSignIn = resolve;
    });
    mockSignIn.mockReturnValueOnce(signInPromise);

    const user = userEvent.setup();
    render(<SignIn />);

    // Act
    await user.type(
      screen.getByPlaceholderText("Email address"),
      "test@example.com"
    );
    await user.type(screen.getByPlaceholderText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    // Assert - Button should show loading state
    expect(screen.getByText("Signing in...")).toBeInTheDocument();

    // Resolve the promise to complete the sign in process
    resolveSignIn!({ error: null });

    // Wait for the sign in process to complete
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });
});
