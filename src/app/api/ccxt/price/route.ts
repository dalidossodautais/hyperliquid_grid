import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ccxt, { Exchange } from "ccxt";

// Configuration
const REQUEST_TIMEOUT = 30000; // 30 seconds timeout

// Interface pour la configuration de l'exchange
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

// Interface pour la connexion étendue
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

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", redirect: "/signin" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get("id");
    const symbolsParam = searchParams.get("symbols");

    if (!connectionId || !symbolsParam) {
      return NextResponse.json({ code: "MISSING_PARAMS" }, { status: 400 });
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

    const exchangeId = connection.exchange.toLowerCase();
    const exchangeClass = ccxt[exchangeId as keyof typeof ccxt];

    if (!exchangeClass) {
      return NextResponse.json(
        { code: "EXCHANGE_NOT_SUPPORTED" },
        { status: 400 }
      );
    }

    const config: ExchangeConfig = {
      apiKey: connection.key,
      enableRateLimit: true,
      timeout: REQUEST_TIMEOUT,
    };

    if (connection.secret) {
      config.secret = connection.secret;
    }

    if (exchangeId === "hyperliquid") {
      config.walletAddress = connection.key;
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
    }

    const exchange = new (exchangeClass as new (
      config: ExchangeConfig
    ) => Exchange)(config);
    await exchange.loadMarkets();

    const symbols = symbolsParam.split(",");
    const validSymbols = symbols.filter((symbol) => {
      const tradingSymbol = `${symbol}/USDC`;
      return exchange.markets[tradingSymbol] !== undefined;
    });

    console.log(`Fetching prices for ${validSymbols.length} symbols`);

    // Récupérer tous les prix en une seule requête
    const tickers = await exchange.fetchTickers(
      validSymbols.map((symbol) => `${symbol}/USDC`)
    );

    // Extraire les prix
    const prices: Record<string, number> = {};
    validSymbols.forEach((symbol) => {
      const ticker = tickers[`${symbol}/USDC`];
      if (ticker && ticker.last) {
        prices[symbol] = ticker.last;
      }
    });

    console.log(`Successfully fetched ${Object.keys(prices).length} prices`);
    return NextResponse.json({ prices });
  } catch (error) {
    console.error("GET price error:", error);
    return NextResponse.json(
      {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
