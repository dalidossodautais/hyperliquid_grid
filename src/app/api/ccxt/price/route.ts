import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ccxt, { Exchange, Ticker } from "ccxt";

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

const priceCache: { [key: string]: PriceCache } = {};
const exchangeCache: { [key: string]: ExchangeCache } = {};
const CACHE_DURATION = 30 * 1000; // 30 seconds
const REQUEST_TIMEOUT = 15000; // 15 seconds timeout for each request
const MAX_RETRIES = 2; // Maximum number of retries for failed requests

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const symbols = searchParams.get("symbols")?.split(",") || [];

    if (!id || symbols.length === 0) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Vérifier le cache des prix
    const cachedPrices: { [key: string]: number } = {};
    const uncachedSymbols: string[] = [];

    symbols.forEach((symbol) => {
      const cacheKey = `${id}-${symbol}`;
      const cached = priceCache[cacheKey];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        cachedPrices[symbol] = cached.price;
      } else {
        uncachedSymbols.push(symbol);
      }
    });

    // Si tous les prix sont en cache, les retourner
    if (uncachedSymbols.length === 0) {
      return NextResponse.json({ prices: cachedPrices });
    }

    // Récupérer la connexion depuis la base de données
    const connection = await prisma.exchangeConnection.findUnique({
      where: { id },
      select: {
        exchange: true,
        key: true,
        secret: true,
        apiWalletAddress: true,
        apiPrivateKey: true,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Connection not found" },
        { status: 404 }
      );
    }

    // Vérifier le cache de l'instance d'exchange
    const exchangeCacheKey = `${connection.exchange}-${connection.key}`;
    let exchange: Exchange;

    const cachedExchange = exchangeCache[exchangeCacheKey];
    if (
      cachedExchange &&
      Date.now() - cachedExchange.timestamp < CACHE_DURATION
    ) {
      exchange = cachedExchange.instance;
    } else {
      const exchangeName = connection.exchange.toLowerCase();
      const ExchangeClass = ccxt[
        exchangeName as keyof typeof ccxt
      ] as new (config: {
        apiKey: string;
        secret?: string;
        apiWalletAddress?: string;
        apiPrivateKey?: string;
      }) => Exchange;

      if (!ExchangeClass) {
        return NextResponse.json(
          { code: "UNSUPPORTED_EXCHANGE", message: "Unsupported exchange" },
          { status: 400 }
        );
      }

      exchange = new ExchangeClass({
        apiKey: connection.key,
        secret: connection.secret || undefined,
        apiWalletAddress: connection.apiWalletAddress || undefined,
        apiPrivateKey: connection.apiPrivateKey || undefined,
      });

      exchangeCache[exchangeCacheKey] = {
        instance: exchange,
        timestamp: Date.now(),
      };
    }

    // Récupérer les prix pour les symboles non cachés
    const prices: { [key: string]: number } = { ...cachedPrices };

    if (uncachedSymbols.length > 0) {
      try {
        // Récupérer tous les prix en parallèle
        const pricePromises = uncachedSymbols.map(async (symbol) => {
          let retries = 0;
          while (retries <= MAX_RETRIES) {
            try {
              // Pour Hyperliquid, utiliser le symbole de base
              const baseSymbol = symbol.endsWith("-STAKED")
                ? symbol.replace("-STAKED", "")
                : symbol;

              // Construire le symbole de trading
              const tradingSymbol = `${baseSymbol}/USDC`;

              // Ajouter un timeout à la requête
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(
                  () => reject(new Error("Request timeout")),
                  REQUEST_TIMEOUT
                );
              });

              const tickerPromise = exchange.fetchTicker(tradingSymbol);

              const ticker = (await Promise.race([
                tickerPromise,
                timeoutPromise,
              ])) as Ticker;
              const price = ticker.last || ticker.close;

              if (price) {
                // Mettre en cache le prix
                priceCache[`${id}-${symbol}`] = {
                  price,
                  timestamp: Date.now(),
                };
                return { symbol, price };
              }
            } catch (error) {
              console.error(
                `Error fetching price for ${symbol} (attempt ${retries + 1}/${
                  MAX_RETRIES + 1
                }):`,
                error
              );
              retries++;
              if (retries <= MAX_RETRIES) {
                // Attendre un peu avant de réessayer
                await new Promise((resolve) =>
                  setTimeout(resolve, 1000 * retries)
                );
              }
            }
          }
          return { symbol, price: 0 };
        });

        const results = await Promise.allSettled(pricePromises);
        results.forEach((result) => {
          if (result.status === "fulfilled" && result.value.price > 0) {
            prices[result.value.symbol] = result.value.price;
          }
        });
      } catch (error) {
        console.error("Error fetching prices:", error);
      }
    }

    return NextResponse.json({ prices });
  } catch (error) {
    console.error("Error in price route:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}
