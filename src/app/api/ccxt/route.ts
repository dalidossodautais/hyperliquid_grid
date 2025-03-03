import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { z } from "zod";
import ccxt, { Exchange } from "ccxt";

// Schéma de validation pour la création d'une connexion
const createConnectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  exchange: z.string().min(1, "Exchange is required"),
  apiKey: z.string().min(1, "API Key is required"),
  apiSecret: z.string().min(1, "API Secret is required"),
});

// Type pour la configuration de l'exchange
interface ExchangeConfig {
  apiKey: string;
  secret: string;
}

// Fonction pour tester la connexion à l'exchange
async function testExchangeConnection(
  exchange: string,
  apiKey: string,
  apiSecret: string
): Promise<boolean> {
  try {
    // Vérifier si l'exchange est supporté par CCXT
    const exchangeId = exchange.toLowerCase();
    const exchangeClass = ccxt[exchangeId as keyof typeof ccxt];

    if (!exchangeClass) {
      throw new Error(`Exchange ${exchange} not supported`);
    }

    // Créer une instance de l'exchange
    const exchangeInstance = new (exchangeClass as new (
      config: ExchangeConfig
    ) => Exchange)({
      apiKey,
      secret: apiSecret,
    });

    // Tester l'authentification en récupérant la balance
    await exchangeInstance.fetchBalance();
    return true;
  } catch (error) {
    console.error(`Error testing exchange connection: ${error}`);
    return false;
  }
}

// Récupérer toutes les connexions de l'utilisateur
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userWithConnections = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        connections: {
          select: {
            id: true,
            name: true,
            exchange: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!userWithConnections) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userWithConnections.connections);
  } catch (error) {
    console.error("Error fetching connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}

// Créer une nouvelle connexion
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = createConnectionSchema.parse(body);

    // Tester la connexion à l'exchange
    const isValid = await testExchangeConnection(
      validatedData.exchange,
      validatedData.apiKey,
      validatedData.apiSecret
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid exchange credentials" },
        { status: 400 }
      );
    }

    const connection = await prisma.cCXTConnection.create({
      data: {
        ...validatedData,
        userId: user.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        exchange: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(connection);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating connection:", error);
    return NextResponse.json(
      { error: "Failed to create connection" },
      { status: 500 }
    );
  }
}

// Supprimer une connexion
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get("id");

    if (!connectionId) {
      return NextResponse.json(
        { error: "Connection ID is required" },
        { status: 400 }
      );
    }

    // Vérifier que la connexion appartient à l'utilisateur
    const connection = await prisma.cCXTConnection.findFirst({
      where: {
        id: connectionId,
        user: {
          email: session.user.email,
        },
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.cCXTConnection.delete({
      where: { id: connectionId },
    });

    return NextResponse.json({ message: "Connection deleted successfully" });
  } catch (error) {
    console.error("Error deleting connection:", error);
    return NextResponse.json(
      { error: "Failed to delete connection" },
      { status: 500 }
    );
  }
}
