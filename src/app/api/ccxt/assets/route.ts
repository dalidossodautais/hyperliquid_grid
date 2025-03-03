import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import ccxt, { Exchange } from "ccxt";
import { authOptions } from "../../auth/[...nextauth]/route";

// Type pour la configuration de l'exchange
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

// Interface pour les balances agrégées
interface AggregatedBalances {
  total: Record<string, number>;
  free: Record<string, number>;
  used: Record<string, number>;
  [key: string]: Record<string, number> | unknown;
}

// Type pour les balances d'un portefeuille spécifique
type WalletBalance = {
  free?: Record<string, number>;
  used?: Record<string, number>;
  total?: Record<string, number>;
  [key: string]: Record<string, number> | unknown;
};

// Récupérer les assets d'une connexion
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

    // Récupérer la connexion
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

    // Créer une instance de l'exchange
    try {
      const exchangeId = connection.exchange.toLowerCase();
      const exchangeClass = ccxt[exchangeId as keyof typeof ccxt];

      if (!exchangeClass) {
        return NextResponse.json(
          { code: "EXCHANGE_NOT_SUPPORTED" },
          { status: 400 }
        );
      }

      // Configuration de base pour l'exchange
      const config: ExchangeConfig = {
        apiKey: connection.key,
        enableRateLimit: true,
        timeout: 30000,
      };

      // Ajouter le secret si disponible
      if (connection.secret) {
        config.secret = connection.secret;
      }

      // Configuration spécifique pour Hyperliquid
      if (exchangeId === "hyperliquid") {
        config.walletAddress = connection.key;
        config.options = {
          defaultType: "swap",
          fetchMarkets: ["swap"],
        };
      } else {
        // Pour les autres exchanges, configurer pour utiliser le spot par défaut
        config.options = {
          defaultType: "spot",
        };
      }

      // Créer l'instance de l'exchange
      const exchangeInstance = new (exchangeClass as new (
        config: ExchangeConfig
      ) => Exchange)(config);

      // Définir le type de marché sur spot si disponible
      if (exchangeInstance.has["fetchBalance"]) {
        try {
          // Certains exchanges nécessitent de spécifier explicitement le type de compte
          exchangeInstance.options = {
            ...exchangeInstance.options,
            defaultType: exchangeId === "hyperliquid" ? "swap" : "spot",
          };
        } catch (error) {
          console.warn("Impossible de définir defaultType:", error);
        }
      }

      // Récupérer les balances
      let balance: WalletBalance;
      const allBalances: AggregatedBalances = {
        total: {},
        free: {},
        used: {},
      };

      try {
        // Essayer de récupérer les balances de tous les types de portefeuilles
        const walletTypes = [
          "spot",
          "margin",
          "future",
          "futures",
          "swap",
          "funding",
        ];

        // Pour Hyperliquid, on utilise uniquement swap
        if (exchangeId === "hyperliquid") {
          balance = (await exchangeInstance.fetchBalance()) as WalletBalance;
          if (balance.total) {
            allBalances.total = { ...balance.total };
            allBalances.free = { ...(balance.free || {}) };
            allBalances.used = { ...(balance.used || {}) };
          }
        } else {
          // Pour les autres exchanges, essayer tous les types de portefeuilles
          for (const type of walletTypes) {
            try {
              console.log(
                `Tentative de récupération des balances pour le portefeuille ${type}...`
              );
              const typeBalance = (await exchangeInstance.fetchBalance({
                type,
              })) as WalletBalance;

              // Traiter les balances de ce type de portefeuille
              if (typeBalance && typeBalance.total) {
                Object.keys(typeBalance.total).forEach((asset) => {
                  const assetKey = asset;
                  const amount = typeBalance.total?.[asset] || 0;
                  const numAmount =
                    typeof amount === "string"
                      ? parseFloat(amount)
                      : Number(amount);

                  // Si l'asset existe déjà, additionner les montants
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
                    // Sinon, initialiser les valeurs
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

              console.log(`Balances récupérées pour le portefeuille ${type}`);
            } catch (typeError: unknown) {
              const errorMessage =
                typeError instanceof Error
                  ? typeError.message
                  : String(typeError);
              console.warn(
                `Impossible de récupérer les balances pour le type ${type}:`,
                errorMessage
              );
            }
          }
        }

        // Si aucune balance n'a été récupérée, essayer sans paramètres
        if (Object.keys(allBalances.total).length === 0) {
          console.log(
            "Tentative de récupération des balances sans spécifier de type..."
          );
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
        console.error("Erreur lors de la récupération des balances:", error);
        throw error;
      }

      console.log("Balances brutes:", JSON.stringify(allBalances, null, 2));

      // Filtrer pour inclure tous les assets, même ceux avec un solde nul
      const assets = Object.entries(allBalances.total || {}).map(
        ([asset, amount]) => ({
          asset,
          total: amount || 0,
          free: allBalances.free?.[asset as keyof typeof allBalances.free] || 0,
          used: allBalances.used?.[asset as keyof typeof allBalances.used] || 0,
        })
      );

      console.log("Assets filtrés:", JSON.stringify(assets, null, 2));

      return NextResponse.json(assets);
    } catch (error) {
      console.error("Error fetching assets:", error);

      if (error instanceof Error) {
        // Gérer les erreurs spécifiques
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
