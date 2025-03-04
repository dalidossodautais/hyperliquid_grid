import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Not authenticated" },
        { status: 401 }
      );
    }

    const bot = await prisma.bot.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!bot) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Bot not found" },
        { status: 404 }
      );
    }

    if (bot.status === "running") {
      return NextResponse.json(
        { code: "INVALID_STATE", message: "Bot is already running" },
        { status: 400 }
      );
    }

    const updatedBot = await prisma.bot.update({
      where: {
        id: params.id,
      },
      data: {
        status: "running",
      },
    });

    return NextResponse.json(updatedBot);
  } catch (error) {
    console.error("Error starting bot:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Failed to start bot" },
      { status: 500 }
    );
  }
}
