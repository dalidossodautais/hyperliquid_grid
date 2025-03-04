import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getExchangeInstance } from "@/app/api/ccxt/services/exchangeService";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Connection ID is required" },
        { status: 400 }
      );
    }

    const connection = await prisma.exchangeConnection.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
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

    if (!connection.key || !connection.secret) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Connection credentials are required" },
        { status: 400 }
      );
    }

    const exchange = getExchangeInstance({
      id: connection.id,
      name: connection.name,
      exchange: connection.exchange,
      key: connection.key,
      secret: connection.secret,
      apiWalletAddress: connection.apiWalletAddress || undefined,
      apiPrivateKey: connection.apiPrivateKey || undefined,
    });

    const markets = await exchange.fetchMarkets();

    // Filtrer les marchés actifs et extraire les symboles
    const symbols = markets
      .filter((market) => Boolean(market?.active && market?.symbol))
      .map((market) => market!.symbol);

    return NextResponse.json(symbols);
  } catch (error) {
    console.error("Error fetching symbols:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Failed to fetch symbols" },
      { status: 500 }
    );
  }
}
