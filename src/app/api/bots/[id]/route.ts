import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
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

    await prisma.bot.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bot:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Failed to delete bot" },
      { status: 500 }
    );
  }
}
