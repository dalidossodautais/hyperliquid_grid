import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { z } from "zod";
import ccxt, { Exchange } from "ccxt";
import { authOptions } from "../auth/[...nextauth]/route";

// Schéma de validation pour la création d'une connexion
const createConnectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  exchange: z.string().min(1, "Exchange is required"),
  key: z.string().min(1, "Key is required"),
  secret: z.string().optional(),
});

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

// Fonction pour tester la connexion à l'exchange
async function testExchangeConnection(
  exchange: string,
  key: string,
  secret?: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Vérifier si l'exchange est supporté par CCXT
    const exchangeId = exchange.toLowerCase();

    const exchangeClass = ccxt[exchangeId as keyof typeof ccxt];

    if (!exchangeClass) {
      return { isValid: false, error: "EXCHANGE_NOT_SUPPORTED" };
    }

    // Créer une instance de l'exchange avec plus d'options de configuration
    const exchangeInstance = new (exchangeClass as new (
      config: ExchangeConfig
    ) => Exchange)({
      apiKey: key,
      secret,
      enableRateLimit: true,
      timeout: 30000, // 30 secondes de timeout
    });

    // Si pas de secret, on considère que c'est une connexion en lecture seule (wallet)
    if (!secret) {
      // Pour Hyperliquid, on utilise l'adresse du wallet comme paramètre
      if (exchange.toLowerCase() === "hyperliquid") {
        try {
          // Créer une instance spécifique pour Hyperliquid
          const exchangeInstance = new (exchangeClass as new (
            config: ExchangeConfig
          ) => Exchange)({
            apiKey: key,
            walletAddress: key, // Utiliser l'adresse comme walletAddress
            enableRateLimit: true,
            timeout: 30000,
            options: {
              defaultType: "swap",
              fetchMarkets: ["swap"],
            },
          });

          // Tester la connexion avec le wallet
          const balance = await exchangeInstance.fetchBalance();
          return { isValid: true };
        } catch (error) {
          console.error("Hyperliquid error:", error);
          return { isValid: false, error: "INVALID_WALLET" };
        }
      }
      return { isValid: true };
    }

    // Activer les logs détaillés
    exchangeInstance.verbose = true;

    try {
      // Tester d'abord loadMarkets qui est moins restrictif
      await exchangeInstance.loadMarkets();

      // Ensuite tester l'authentification
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

// Récupérer toutes les connexions de l'utilisateur
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

    const connections = await prisma.exchangeConnection.findMany({
      where: {
        userId: user.id,
      },
    });

    return NextResponse.json(connections);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// Créer une nouvelle connexion
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

    // Pour Hyperliquid, on teste toujours la connexion
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
    // Pour les autres exchanges, on teste seulement si un secret est fourni
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
      return NextResponse.json({ code: "CREATE_FAILED" }, { status: 500 });
    }
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ code: "CREATE_FAILED" }, { status: 500 });
  }
}

// Supprimer une connexion
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

    const connection = await prisma.exchangeConnection.findFirst({
      where: {
        id: connectionId,
        User: {
          email: session.user.email,
        },
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
