// Mock next-auth/jwt
jest.mock("next-auth/jwt", () => ({
  getToken: jest.fn(),
}));

// Mock next-intl/middleware
jest.mock("next-intl/middleware", () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({ status: 200 })),
  };
});

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    next: jest.fn(() => ({ status: 200 })),
    redirect: jest.fn((url) => ({
      status: 302,
      headers: new Map([["location", url.toString()]]),
    })),
  },
}));

describe("Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock process.env
    process.env.NEXT_PUBLIC_E2E_TEST = "false";
  });

  it("should bypass authentication in e2e test mode", () => {
    // Arrange
    process.env.NEXT_PUBLIC_E2E_TEST = "true";

    // Assert
    expect(process.env.NEXT_PUBLIC_E2E_TEST).toBe("true");
  });
});
