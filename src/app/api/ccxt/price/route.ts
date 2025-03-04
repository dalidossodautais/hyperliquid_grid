import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ccxt, { Exchange } from "ccxt";

// Cache pour stocker les prix
interface PriceCache {
  price: number;
  timestamp: number;
}

const priceCache: Record<string, PriceCache> = {};
const CACHE_DURATION = 60 * 1000; // 1 minute en millisecondes

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const symbol = searchParams.get("symbol");

    if (!id || !symbol) {
      return NextResponse.json({ code: "MISSING_PARAMETERS" }, { status: 400 });
    }

    // Extraire le symbole de base pour les tokens spéciaux (ex: HYPE-STAKED -> HYPE)
    const baseSymbol = symbol.split("-")[0];

    // Vérifier le cache
    const cacheKey = `${id}-${baseSymbol}`;
    const cachedPrice = priceCache[cacheKey];
    if (cachedPrice && Date.now() - cachedPrice.timestamp < CACHE_DURATION) {
      return NextResponse.json({ price: cachedPrice.price });
    }

    const connection = await prisma.exchangeConnection.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { code: "CONNECTION_NOT_FOUND" },
        { status: 404 }
      );
    }

    const exchangeName = connection.exchange.toLowerCase();
    const ExchangeClass = ccxt[
      exchangeName as keyof typeof ccxt
    ] as new (config: {
      apiKey: string;
      secret?: string;
      enableRateLimit?: boolean;
    }) => Exchange;

    if (!ExchangeClass) {
      return NextResponse.json(
        { code: "EXCHANGE_NOT_SUPPORTED" },
        { status: 400 }
      );
    }

    const exchangeInstance = new ExchangeClass({
      apiKey: connection.key,
      secret: connection.secret || undefined,
      enableRateLimit: true,
    });

    try {
      // Ajouter la paire de trading pour Hyperliquid
      const tradingSymbol =
        exchangeName === "hyperliquid" ? `${baseSymbol}/USDC` : baseSymbol;
      const ticker = await exchangeInstance.fetchTicker(tradingSymbol);

      if (!ticker || !ticker.last) {
        return NextResponse.json(
          { code: "INVALID_TICKER_DATA" },
          { status: 500 }
        );
      }

      const price = ticker.last;

      // Mettre à jour le cache
      priceCache[cacheKey] = {
        price,
        timestamp: Date.now(),
      };

      return NextResponse.json({ price });
    } catch (error) {
      return NextResponse.json(
        {
          code: "PRICE_FETCH_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
