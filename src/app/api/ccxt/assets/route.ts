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
      let balance;
      try {
        // Essayer d'abord avec des paramètres spécifiques pour le spot
        balance = await exchangeInstance.fetchBalance({ type: "spot" });
      } catch (error) {
        console.warn(
          "Erreur lors de la récupération des balances spot avec paramètres:",
          error
        );
        try {
          // Si ça échoue, essayer sans paramètres
          balance = await exchangeInstance.fetchBalance();
        } catch (secondError) {
          console.error(
            "Erreur lors de la récupération des balances:",
            secondError
          );
          throw secondError;
        }
      }

      console.log("Balance brute:", JSON.stringify(balance, null, 2));

      // Filtrer pour inclure tous les assets, même ceux avec un solde nul
      const assets = Object.entries(balance.total || {}).map(
        ([asset, amount]) => ({
          asset,
          total: amount || 0,
          free: balance.free?.[asset as keyof typeof balance.free] || 0,
          used: balance.used?.[asset as keyof typeof balance.used] || 0,
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
