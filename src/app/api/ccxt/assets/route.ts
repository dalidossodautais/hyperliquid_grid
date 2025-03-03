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
      }

      // Créer l'instance de l'exchange
      const exchangeInstance = new (exchangeClass as new (
        config: ExchangeConfig
      ) => Exchange)(config);

      // Récupérer les balances
      const balance = await exchangeInstance.fetchBalance();

      // Filtrer pour ne garder que les assets avec un solde non nul
      const assets = Object.entries(balance.total)
        .filter(([, amount]) => amount > 0)
        .map(([asset, amount]) => ({
          asset,
          total: amount,
          free: balance.free[asset as keyof typeof balance.free] || 0,
          used: balance.used[asset as keyof typeof balance.used] || 0,
        }));

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
