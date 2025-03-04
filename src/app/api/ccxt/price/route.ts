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

// Cache pour stocker les instances d'exchange
interface ExchangeCache {
  instance: Exchange;
  timestamp: number;
}

// Cache pour stocker les connexions
interface ConnectionCache {
  connection: {
    exchange: string;
    key: string;
    secret: string | null;
  };
  timestamp: number;
}

const priceCache: Record<string, PriceCache> = {};
const exchangeCache: Record<string, ExchangeCache> = {};
const connectionCache: Record<string, ConnectionCache> = {};
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

    // Vérifier le cache des prix
    const priceCacheKey = `${id}-${baseSymbol}`;
    const cachedPrice = priceCache[priceCacheKey];
    if (cachedPrice && Date.now() - cachedPrice.timestamp < CACHE_DURATION) {
      return NextResponse.json({ price: cachedPrice.price });
    }

    // Vérifier le cache de l'exchange
    const exchangeCacheKey = `${id}-${session.user.id}`;
    let exchangeInstance: Exchange;

    if (
      exchangeCache[exchangeCacheKey] &&
      Date.now() - exchangeCache[exchangeCacheKey].timestamp < CACHE_DURATION
    ) {
      exchangeInstance = exchangeCache[exchangeCacheKey].instance;
    } else {
      // Vérifier le cache des connexions
      const connectionCacheKey = `${id}-${session.user.id}`;
      let connection;

      if (
        connectionCache[connectionCacheKey] &&
        Date.now() - connectionCache[connectionCacheKey].timestamp <
          CACHE_DURATION
      ) {
        connection = connectionCache[connectionCacheKey].connection;
      } else {
        connection = await prisma.exchangeConnection.findFirst({
          where: {
            id,
            userId: session.user.id,
          },
          select: {
            exchange: true,
            key: true,
            secret: true,
          },
        });

        if (!connection) {
          return NextResponse.json(
            { code: "CONNECTION_NOT_FOUND" },
            { status: 404 }
          );
        }

        // Mettre en cache la connexion
        connectionCache[connectionCacheKey] = {
          connection,
          timestamp: Date.now(),
        };
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

      exchangeInstance = new ExchangeClass({
        apiKey: connection.key,
        secret: connection.secret || undefined,
        enableRateLimit: true,
      });

      // Mettre en cache l'instance d'exchange
      exchangeCache[exchangeCacheKey] = {
        instance: exchangeInstance,
        timestamp: Date.now(),
      };
    }

    try {
      // Ajouter la paire de trading pour Hyperliquid
      const exchangeName = exchangeInstance.id;
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

      // Mettre à jour le cache des prix
      priceCache[priceCacheKey] = {
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
