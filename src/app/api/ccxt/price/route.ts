import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ccxt from "ccxt";

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
    const ExchangeClass = ccxt[exchangeName as keyof typeof ccxt];

    if (!ExchangeClass) {
      return NextResponse.json(
        { code: "EXCHANGE_NOT_SUPPORTED" },
        { status: 400 }
      );
    }

    const exchangeInstance = new ExchangeClass({
      apiKey: connection.key,
      secret: connection.secret,
      enableRateLimit: true,
    });

    try {
      const ticker = await exchangeInstance.fetchTicker(symbol);
      return NextResponse.json({ price: ticker.last });
    } catch (error) {
      console.error("Error fetching price:", error);
      return NextResponse.json({ code: "PRICE_FETCH_ERROR" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in price route:", error);
    return NextResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
