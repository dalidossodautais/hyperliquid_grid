import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Not authenticated" },
        { status: 401 }
      );
    }

    const bots = await prisma.bot.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const botsWithParsedConfig = bots.map((bot) => {
      const config = bot.config ? JSON.parse(bot.config) : null;
      return {
        ...bot,
        config,
        baseAsset: config?.baseAsset || null,
        quoteAsset: config?.quoteAsset || null,
      };
    });

    return NextResponse.json(botsWithParsedConfig);
  } catch {
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Failed to fetch bots" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, type, connectionId, config } = body;

    if (!name || !type || !connectionId || !config) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "Missing required fields" },
        { status: 400 }
      );
    }

    const serializedConfig = JSON.stringify(config);

    const bot = await prisma.bot.create({
      data: {
        name,
        type,
        status: "stopped",
        config: serializedConfig,
        userId: session.user.id,
      },
    });

    const botWithParsedConfig = {
      ...bot,
      config: bot.config ? JSON.parse(bot.config) : null,
    };

    return NextResponse.json(botWithParsedConfig);
  } catch {
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Failed to create bot" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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
        { code: "VALIDATION_ERROR", message: "Bot ID is required" },
        { status: 400 }
      );
    }

    const bot = await prisma.bot.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!bot) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Bot not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.bot.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: "Bot deleted successfully" });
  } catch {
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Failed to delete bot" },
      { status: 500 }
    );
  }
}
