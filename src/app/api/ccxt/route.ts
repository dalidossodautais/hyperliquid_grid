import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { z } from "zod";
import ccxt, { Exchange } from "ccxt";
import { authOptions } from "../auth/[...nextauth]/route";

// Validation schema for connection creation
const createConnectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  exchange: z.string().min(1, "Exchange is required"),
  key: z.string().min(1, "Key is required"),
  secret: z.string().optional(),
});

// Type for exchange configuration
interface ExchangeConfig {
  apiKey: string;
  secret?: string;
  walletAddress?: string;
  enableRateLimit?: boolean;
  timeout?: number;
  options?: {
    defaultType?: string;
    fetchMarkets?: string[];
  };
}

// Function to test the exchange connection
async function testExchangeConnection(
  exchange: string,
  key: string,
  secret?: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Check if the exchange is supported by CCXT
    const exchangeId = exchange.toLowerCase();

    const exchangeClass = ccxt[exchangeId as keyof typeof ccxt];

    if (!exchangeClass) {
      return { isValid: false, error: "EXCHANGE_NOT_SUPPORTED" };
    }

    // Create an exchange instance with more configuration options
    const exchangeInstance = new (exchangeClass as new (
      config: ExchangeConfig
    ) => Exchange)({
      apiKey: key,
      secret,
      enableRateLimit: true,
      timeout: 30000, // 30 seconds timeout
    });

    // If no secret is provided, consider it a read-only connection (wallet)
    if (!secret) {
      // For Hyperliquid, use the wallet address as a parameter
      if (exchange.toLowerCase() === "hyperliquid") {
        try {
          // Create a specific instance for Hyperliquid
          const exchangeInstance = new (exchangeClass as new (
            config: ExchangeConfig
          ) => Exchange)({
            apiKey: key,
            walletAddress: key, // Use the address as walletAddress
            enableRateLimit: true,
            timeout: 30000,
            options: {
              defaultType: "swap",
              fetchMarkets: ["swap"],
            },
          });

          // Test the connection with the wallet
          const balance = await exchangeInstance.fetchBalance();
          console.log(
            "Balance fetched successfully:",
            Object.keys(balance).length > 0
          );
          return { isValid: true };
        } catch (error) {
          console.error("Hyperliquid error:", error);
          return { isValid: false, error: "INVALID_WALLET" };
        }
      }
      return { isValid: true };
    }

    // Enable detailed logs
    exchangeInstance.verbose = true;

    try {
      // First test loadMarkets which is less restrictive
      await exchangeInstance.loadMarkets();

      // Then test authentication
      if (exchange.toLowerCase() === "hyperliquid") {
        await exchangeInstance.fetchBalance({ wallet: key });
      } else {
        await exchangeInstance.fetchBalance();
      }
      return { isValid: true };
    } catch (error) {
      console.error("Exchange API error:", error);

      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (
          errorMessage.includes("key") ||
          errorMessage.includes("signature") ||
          errorMessage.includes("auth") ||
          errorMessage.includes("invalid api")
        ) {
          return { isValid: false, error: "INVALID_CREDENTIALS" };
        }

        if (
          errorMessage.includes("timeout") ||
          errorMessage.includes("network") ||
          errorMessage.includes("request failed")
        ) {
          return { isValid: false, error: "CONNECTION_ERROR" };
        }

        if (
          errorMessage.includes("market") ||
          errorMessage.includes("symbol") ||
          errorMessage.includes("trading")
        ) {
          return { isValid: false, error: "EXCHANGE_CONFIG_ERROR" };
        }

        return { isValid: false, error: "EXCHANGE_ERROR" };
      }
      return { isValid: false, error: "UNKNOWN_ERROR" };
    }
  } catch (error) {
    console.error("Critical error:", error);
    return { isValid: false, error: "CONNECTION_ERROR" };
  }
}

// Retrieve all user connections
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        {
          code: "UNAUTHORIZED",
          details: "No session found",
          redirect: "/signin",
        },
        { status: 401 }
      );
    }

    if (!session.user?.email) {
      return NextResponse.json(
        {
          code: "UNAUTHORIZED",
          details: "No email in session",
          redirect: "/signin",
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { code: "USER_NOT_FOUND", redirect: "/signin" },
        { status: 404 }
      );
    }

    try {
      const connections = await prisma.exchangeConnection.findMany({
        where: {
          userId: user.id,
        },
      });

      return NextResponse.json(connections);
    } catch (dbError) {
      console.error("Database error in GET:", dbError);
      return NextResponse.json(
        {
          code: "DATABASE_ERROR",
          message:
            dbError instanceof Error
              ? dbError.message
              : "Unknown database error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Create a new connection
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", redirect: "/signin" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { code: "USER_NOT_FOUND", redirect: "/signin" },
        { status: 404 }
      );
    }

    const body = await request.json();

    let validatedData;
    try {
      validatedData = createConnectionSchema.parse(body);
    } catch (error) {
      console.error("Validation error:", error);
      return NextResponse.json(
        { code: "VALIDATION_ERROR", details: error },
        { status: 400 }
      );
    }

    // For Hyperliquid, always test the connection
    if (validatedData.exchange.toLowerCase() === "hyperliquid") {
      const testResult = await testExchangeConnection(
        validatedData.exchange,
        validatedData.key
      );

      if (!testResult.isValid) {
        return NextResponse.json(
          {
            code: testResult.error || "INVALID_CREDENTIALS",
            details: testResult.error,
          },
          { status: 400 }
        );
      }
    }
    // For other exchanges, only test if a secret is provided
    else if (validatedData.secret) {
      const testResult = await testExchangeConnection(
        validatedData.exchange,
        validatedData.key,
        validatedData.secret
      );

      if (!testResult.isValid) {
        return NextResponse.json(
          {
            code: testResult.error || "INVALID_CREDENTIALS",
            details: testResult.error,
          },
          { status: 400 }
        );
      }
    }

    try {
      const connection = await prisma.exchangeConnection.create({
        data: {
          name: validatedData.name,
          exchange: validatedData.exchange,
          key: validatedData.key,
          secret: validatedData.secret,
          userId: user.id,
        },
      });
      return NextResponse.json(connection);
    } catch (error) {
      console.error("Database error:", error);
      // Improved error handling to identify the specific problem
      if (error instanceof Error) {
        // Check if it's a unique constraint error
        if (error.message.includes("Unique constraint failed")) {
          return NextResponse.json(
            {
              code: "DUPLICATE_CONNECTION",
              message:
                "A connection with this name or credentials already exists",
            },
            { status: 400 }
          );
        }

        // Check if it's a missing field error
        if (error.message.includes("Field required")) {
          return NextResponse.json(
            {
              code: "MISSING_FIELD",
              message: error.message,
            },
            { status: 400 }
          );
        }

        // Other errors with detailed message
        return NextResponse.json(
          {
            code: "CREATE_FAILED",
            message: error.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ code: "CREATE_FAILED" }, { status: 500 });
    }
  } catch (error) {
    console.error("POST error:", error);
    // Improved general error handling
    if (error instanceof Error) {
      return NextResponse.json(
        {
          code: "CREATE_FAILED",
          message: error.message,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ code: "CREATE_FAILED" }, { status: 500 });
  }
}

// Delete a connection
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get("id");

    if (!connectionId) {
      return NextResponse.json({ code: "MISSING_ID" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { code: "USER_NOT_FOUND", redirect: "/signin" },
        { status: 404 }
      );
    }

    const connection = await prisma.exchangeConnection.findFirst({
      where: {
        id: connectionId,
        userId: user.id,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { code: "CONNECTION_NOT_FOUND" },
        { status: 404 }
      );
    }

    await prisma.exchangeConnection.delete({
      where: { id: connectionId },
    });

    return NextResponse.json({ message: "Connection deleted successfully" });
  } catch (error) {
    console.error("Error deleting connection:", error);
    return NextResponse.json({ code: "DELETE_FAILED" }, { status: 500 });
  }
}
