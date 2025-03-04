import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import ccxt, { Exchange } from "ccxt";
import { authOptions } from "../../auth/[...nextauth]/route";

// Interface for exchange configuration
interface ExchangeConfig {
  apiKey: string;
  secret?: string;
  walletAddress?: string;
  apiWalletAddress?: string;
  apiPrivateKey?: string;
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

// Extended connection type to include optional API wallet fields
interface ExtendedConnection {
  id: string;
  userId: string;
  name: string;
  exchange: string;
  key: string;
  secret: string | null;
  apiWalletAddress?: string;
  apiPrivateKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Cache pour stocker les balances
interface BalanceCache {
  balances: any;
  timestamp: number;
}

const balanceCache: Record<string, BalanceCache> = {};
const CACHE_DURATION = 60 * 1000; // 1 minute en millisecondes

// Configuration des types de wallet par exchange
const WALLET_TYPES: Record<string, string[]> = {
  hyperliquid: ["spot"],
  binance: ["spot", "margin"],
  coinbase: ["spot"],
  kraken: ["spot", "margin"],
  default: ["spot"],
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

    // Vérifier le cache
    const cachedBalances = balanceCache[connectionId];
    if (
      cachedBalances &&
      Date.now() - cachedBalances.timestamp < CACHE_DURATION
    ) {
      return NextResponse.json(cachedBalances.balances);
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
        // Cast connection to ExtendedConnection to access optional fields
        const extConnection = connection as unknown as ExtendedConnection;
        if (extConnection.apiWalletAddress) {
          config.apiWalletAddress = extConnection.apiWalletAddress;
        }
        if (extConnection.apiPrivateKey) {
          config.apiPrivateKey = extConnection.apiPrivateKey;
        }
        config.options = {
          defaultType: "spot",
          fetchMarkets: ["spot"],
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
            defaultType: "spot",
          };
        } catch (error) {
          // Ignore error silently
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
        // For Hyperliquid, use spot balance and get staking info
        if (exchangeId === "hyperliquid") {
          balance = (await exchangeInstance.fetchBalance()) as WalletBalance;

          // Fetch staking data from Hyperliquid
          try {
            const stakingResponse = await fetch(
              "https://api.hyperliquid.xyz/info",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  user: connection.key,
                  type: "delegatorSummary",
                }),
              }
            );

            if (stakingResponse.ok) {
              const stakingData = await stakingResponse.json();

              // Add staking assets to the balance
              if (stakingData.delegated) {
                allBalances.total["HYPE-STAKED"] = parseFloat(
                  stakingData.delegated
                );
                allBalances.free["HYPE-STAKED"] = 0;
                allBalances.used["HYPE-STAKED"] = parseFloat(
                  stakingData.delegated
                );
              }

              if (stakingData.undelegated) {
                allBalances.total["HYPE-UNSTAKED"] = parseFloat(
                  stakingData.undelegated
                );
                allBalances.free["HYPE-UNSTAKED"] = parseFloat(
                  stakingData.undelegated
                );
                allBalances.used["HYPE-UNSTAKED"] = 0;
              }

              if (stakingData.totalPendingWithdrawal) {
                allBalances.total["HYPE-PENDING"] = parseFloat(
                  stakingData.totalPendingWithdrawal
                );
                allBalances.free["HYPE-PENDING"] = 0;
                allBalances.used["HYPE-PENDING"] = parseFloat(
                  stakingData.totalPendingWithdrawal
                );
              }
            }
          } catch (stakingError) {
            // Ignore staking error silently
          }

          if (balance.total) {
            // Use raw values directly without conversion
            Object.keys(balance.total).forEach((asset) => {
              const totalAmount = balance.total?.[asset];
              const freeAmount = balance.free?.[asset];
              const usedAmount = balance.used?.[asset];

              // Store raw values directly
              allBalances.total[asset] = totalAmount as number;
              allBalances.free[asset] = freeAmount as number;
              allBalances.used[asset] = usedAmount as number;
            });
          }
        } else {
          // Pour les autres exchanges, utiliser uniquement les types de wallet configurés
          const walletTypes = WALLET_TYPES[exchangeId] || WALLET_TYPES.default;

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
        ([asset, amount]) => {
          // Use raw values directly
          const total = amount as number;
          const free = allBalances.free?.[
            asset as keyof typeof allBalances.free
          ] as number;
          const used = allBalances.used?.[
            asset as keyof typeof allBalances.used
          ] as number;

          return {
            asset,
            total,
            free,
            used,
          };
        }
      );

      // Mettre à jour le cache
      balanceCache[connectionId] = {
        balances: assets,
        timestamp: Date.now(),
      };

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
