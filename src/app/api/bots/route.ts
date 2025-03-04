import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    return NextResponse.json(bots);
  } catch (error) {
    console.error("Error fetching bots:", error);
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
    const { name, type } = body;

    if (!name) {
      return NextResponse.json(
        { code: "INVALID_INPUT", message: "Name is required" },
        { status: 400 }
      );
    }

    if (type && type !== "dca") {
      return NextResponse.json(
        { code: "INVALID_INPUT", message: "Only DCA bot type is supported" },
        { status: 400 }
      );
    }

    const bot = await prisma.bot.create({
      data: {
        name,
        type: "dca",
        status: "stopped",
        userId: session.user.id,
      },
    });

    return NextResponse.json(bot);
  } catch (error) {
    console.error("Error creating bot:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Failed to create bot" },
      { status: 500 }
    );
  }
}
