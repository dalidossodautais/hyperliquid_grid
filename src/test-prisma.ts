import prisma from "./lib/prisma";

async function testPrismaConnection() {
  try {
    const connection = await prisma.exchangeConnection.create({
      data: {
        name: "Test Connection",
        exchange: "hyperliquid",
        key: "test-key",
        secret: "test-secret",
        apiWalletAddress: "test-wallet-address",
        apiPrivateKey: "test-private-key",
        userId: "test-user-id", // Remplacez par un ID utilisateur valide de votre base de données
      },
    });
    console.log("Connection created successfully:", connection);
  } catch (error) {
    console.error("Error creating connection:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaConnection();
