import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageSelector from "@/components/LanguageSelector";

// Mock des hooks de next/navigation et next-intl
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/en/dashboard",
}));

jest.mock("next-intl", () => ({
  useLocale: () => "en",
}));

describe("LanguageSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with English as default language", async () => {
    // Arrange
    render(<LanguageSelector />);

    // Act - wait for useEffect to complete
    await waitFor(() => {
      expect(screen.getByLabelText("Select language")).toBeInTheDocument();
    });

    // Assert
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("🇺🇸")).toBeInTheDocument();
  });

  it("opens the dropdown when clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<LanguageSelector />);

    // Act - wait for useEffect to complete
    await waitFor(() => {
      expect(screen.getByLabelText("Select language")).toBeInTheDocument();
    });

    // Act - click the button to open dropdown
    await user.click(screen.getByLabelText("Select language"));

    // Assert - dropdown is open and shows language options
    expect(screen.getByText("Français")).toBeInTheDocument();
    expect(screen.getByText("Español")).toBeInTheDocument();
    expect(screen.getByText("Deutsch")).toBeInTheDocument();
    expect(screen.getByText("Italiano")).toBeInTheDocument();
  });

  it("changes language when a language option is selected", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<LanguageSelector />);

    // Act - wait for useEffect to complete
    await waitFor(() => {
      expect(screen.getByLabelText("Select language")).toBeInTheDocument();
    });

    // Act - open dropdown and select French
    await user.click(screen.getByLabelText("Select language"));
    await user.click(screen.getByText("Français"));

    // Assert - router.push was called with the correct path
    expect(mockPush).toHaveBeenCalledWith("/fr/dashboard");
  });
});
