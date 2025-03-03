import { NextResponse } from "next/server";
import ccxt from "ccxt";

export async function GET() {
  try {
    // Get the list of supported exchanges from CCXT
    const exchanges = ccxt.exchanges;

    return NextResponse.json(exchanges);
  } catch (error) {
    console.error("Failed to fetch exchanges:", error);
    return NextResponse.json(
      { error: "Failed to fetch exchanges" },
      { status: 500 }
    );
  }
}
