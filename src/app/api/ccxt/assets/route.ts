import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import ccxt, { Exchange } from "ccxt";
import { authOptions } from "../../auth/[...nextauth]/route";

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

// Interface for aggregated balances
interface AggregatedBalances {
  total: Record<string, number>;
  free: Record<string, number>;
  used: Record<string, number>;
  [key: string]: Record<string, number> | unknown;
}

// Type for specific wallet balance
type WalletBalance = {
  free?: Record<string, number>;
  used?: Record<string, number>;
  total?: Record<string, number>;
  [key: string]: Record<string, number> | unknown;
};

// Retrieve assets from a connection
export async function GET(request: Request) {
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

    // Retrieve the connection
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

    // Create an exchange instance
    try {
      const exchangeId = connection.exchange.toLowerCase();
      const exchangeClass = ccxt[exchangeId as keyof typeof ccxt];

      if (!exchangeClass) {
        return NextResponse.json(
          { code: "EXCHANGE_NOT_SUPPORTED" },
          { status: 400 }
        );
      }

      // Basic configuration for the exchange
      const config: ExchangeConfig = {
        apiKey: connection.key,
        enableRateLimit: true,
        timeout: 30000,
      };

      // Add secret if available
      if (connection.secret) {
        config.secret = connection.secret;
      }

      // Specific configuration for Hyperliquid
      if (exchangeId === "hyperliquid") {
        config.walletAddress = connection.key;
        config.options = {
          defaultType: "swap",
          fetchMarkets: ["swap"],
        };
      } else {
        // For other exchanges, configure to use spot by default
        config.options = {
          defaultType: "spot",
        };
      }

      // Create the exchange instance
      const exchangeInstance = new (exchangeClass as new (
        config: ExchangeConfig
      ) => Exchange)(config);

      // Set market type to spot if available
      if (exchangeInstance.has["fetchBalance"]) {
        try {
          // Some exchanges require explicitly specifying the account type
          exchangeInstance.options = {
            ...exchangeInstance.options,
            defaultType: exchangeId === "hyperliquid" ? "swap" : "spot",
          };
        } catch (error) {
          console.warn("Unable to set defaultType:", error);
        }
      }

      // Retrieve balances
      let balance: WalletBalance;
      const allBalances: AggregatedBalances = {
        total: {},
        free: {},
        used: {},
      };

      try {
        // Try to retrieve balances from all wallet types
        const walletTypes = [
          "spot",
          "margin",
          "future",
          "futures",
          "swap",
          "funding",
        ];

        // For Hyperliquid, only use swap
        if (exchangeId === "hyperliquid") {
          balance = (await exchangeInstance.fetchBalance()) as WalletBalance;
          if (balance.total) {
            allBalances.total = { ...balance.total };
            allBalances.free = { ...(balance.free || {}) };
            allBalances.used = { ...(balance.used || {}) };
          }
        } else {
          // For other exchanges, try all wallet types
          for (const type of walletTypes) {
            try {
              const typeBalance = (await exchangeInstance.fetchBalance({
                type,
              })) as WalletBalance;

              // Process balances for this wallet type
              if (typeBalance && typeBalance.total) {
                Object.keys(typeBalance.total).forEach((asset) => {
                  const assetKey = asset;
                  const amount = typeBalance.total?.[asset] || 0;
                  const numAmount =
                    typeof amount === "string"
                      ? parseFloat(amount)
                      : Number(amount);

                  // If the asset already exists, add the amounts
                  if (assetKey in allBalances.total) {
                    allBalances.total[assetKey] =
                      (allBalances.total[assetKey] || 0) + numAmount;

                    if (typeBalance.free && asset in typeBalance.free) {
                      const freeAmount = typeBalance.free[asset];
                      const numFreeAmount =
                        typeof freeAmount === "string"
                          ? parseFloat(freeAmount)
                          : Number(freeAmount);
                      allBalances.free[assetKey] =
                        (allBalances.free[assetKey] || 0) + numFreeAmount;
                    }

                    if (typeBalance.used && asset in typeBalance.used) {
                      const usedAmount = typeBalance.used[asset];
                      const numUsedAmount =
                        typeof usedAmount === "string"
                          ? parseFloat(usedAmount)
                          : Number(usedAmount);
                      allBalances.used[assetKey] =
                        (allBalances.used[assetKey] || 0) + numUsedAmount;
                    }
                  } else {
                    // Otherwise, initialize the values
                    allBalances.total[assetKey] = numAmount;

                    if (typeBalance.free && asset in typeBalance.free) {
                      const freeAmount = typeBalance.free[asset];
                      allBalances.free[assetKey] =
                        typeof freeAmount === "string"
                          ? parseFloat(freeAmount)
                          : Number(freeAmount);
                    } else {
                      allBalances.free[assetKey] = 0;
                    }

                    if (typeBalance.used && asset in typeBalance.used) {
                      const usedAmount = typeBalance.used[asset];
                      allBalances.used[assetKey] =
                        typeof usedAmount === "string"
                          ? parseFloat(usedAmount)
                          : Number(usedAmount);
                    } else {
                      allBalances.used[assetKey] = 0;
                    }
                  }
                });
              }
            } catch (typeError: unknown) {
              const errorMessage =
                typeError instanceof Error
                  ? typeError.message
                  : String(typeError);
              console.warn(
                `Unable to retrieve balances for wallet type ${type}:`,
                errorMessage
              );
            }
          }
        }

        // If no balance was retrieved, try without parameters
        if (Object.keys(allBalances.total).length === 0) {
          balance = (await exchangeInstance.fetchBalance()) as WalletBalance;

          if (balance.total) {
            Object.keys(balance.total).forEach((asset) => {
              const amount = balance.total?.[asset] || 0;
              allBalances.total[asset] =
                typeof amount === "string"
                  ? parseFloat(amount)
                  : Number(amount);

              if (balance.free && asset in balance.free) {
                const freeAmount = balance.free[asset];
                allBalances.free[asset] =
                  typeof freeAmount === "string"
                    ? parseFloat(freeAmount)
                    : Number(freeAmount);
              } else {
                allBalances.free[asset] = 0;
              }

              if (balance.used && asset in balance.used) {
                const usedAmount = balance.used[asset];
                allBalances.used[asset] =
                  typeof usedAmount === "string"
                    ? parseFloat(usedAmount)
                    : Number(usedAmount);
              } else {
                allBalances.used[asset] = 0;
              }
            });
          }
        }
      } catch (error) {
        console.error("Error retrieving balances:", error);
        throw error;
      }

      // Filter to include all assets, even those with zero balance
      const assets = Object.entries(allBalances.total || {}).map(
        ([asset, amount]) => ({
          asset,
          total: amount || 0,
          free: allBalances.free?.[asset as keyof typeof allBalances.free] || 0,
          used: allBalances.used?.[asset as keyof typeof allBalances.used] || 0,
        })
      );

      return NextResponse.json(assets);
    } catch (error) {
      console.error("Error fetching assets:", error);

      if (error instanceof Error) {
        // Handle specific errors
        const errorMessage = error.message.toLowerCase();

        if (
          errorMessage.includes("key") ||
          errorMessage.includes("signature") ||
          errorMessage.includes("auth")
        ) {
          return NextResponse.json(
            { code: "INVALID_CREDENTIALS", message: error.message },
            { status: 401 }
          );
        }

        if (
          errorMessage.includes("timeout") ||
          errorMessage.includes("network")
        ) {
          return NextResponse.json(
            { code: "CONNECTION_ERROR", message: error.message },
            { status: 503 }
          );
        }

        return NextResponse.json(
          { code: "EXCHANGE_ERROR", message: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ code: "UNKNOWN_ERROR" }, { status: 500 });
    }
  } catch (error) {
    console.error("GET assets error:", error);
    return NextResponse.json(
      {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
