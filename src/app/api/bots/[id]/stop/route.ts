import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    if (bot.status === "stopped") {
      return NextResponse.json(
        { code: "INVALID_STATE", message: "Bot is already stopped" },
        { status: 400 }
      );
    }

    const updatedBot = await prisma.bot.update({
      where: {
        id: params.id,
      },
      data: {
        status: "stopped",
      },
    });

    return NextResponse.json(updatedBot);
  } catch (error) {
    console.error("Error stopping bot:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Failed to stop bot" },
      { status: 500 }
    );
  }
}
