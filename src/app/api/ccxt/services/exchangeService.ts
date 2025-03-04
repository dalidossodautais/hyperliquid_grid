import ccxt, { Exchange } from "ccxt";
import { ExchangeConfig, ExtendedConnection } from "../types";

export class ExchangeService {
  static createExchangeInstance(connection: ExtendedConnection): Exchange {
    const exchangeId = connection.exchange.toLowerCase();
    const exchangeClass = ccxt[exchangeId as keyof typeof ccxt];

    if (!exchangeClass) {
      throw new Error("EXCHANGE_NOT_SUPPORTED");
    }

    const config: ExchangeConfig = {
      apiKey: connection.key,
      enableRateLimit: true,
      timeout: 30000,
    };

    if (connection.secret) {
      config.secret = connection.secret;
    }

    if (exchangeId === "hyperliquid") {
      config.walletAddress = connection.key;
      const extConnection = connection as ExtendedConnection;
      if (extConnection.apiWalletAddress) {
        config.apiWalletAddress = extConnection.apiWalletAddress;
      }
      if (extConnection.apiPrivateKey) {
        config.apiPrivateKey = extConnection.apiPrivateKey;
      }
      config.options = {
        defaultType: "spot",
        fetchMarkets: ["spot"],
      };
    } else {
      config.options = {
        defaultType: "spot",
      };
    }

    const exchangeInstance = new (exchangeClass as new (
      config: ExchangeConfig
    ) => Exchange)(config);

    if (exchangeInstance.has["fetchBalance"]) {
      try {
        exchangeInstance.options = {
          ...exchangeInstance.options,
          defaultType: "spot",
        };
      } catch {
        // Ignore error silently
      }
    }

    return exchangeInstance;
  }

  static handleExchangeError(error: unknown): {
    code: string;
    message: string;
    status: number;
  } {
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (
        errorMessage.includes("key") ||
        errorMessage.includes("signature") ||
        errorMessage.includes("auth")
      ) {
        return {
          code: "INVALID_CREDENTIALS",
          message: error.message,
          status: 401,
        };
      }

      if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("network")
      ) {
        return {
          code: "CONNECTION_ERROR",
          message: error.message,
          status: 503,
        };
      }

      return { code: "EXCHANGE_ERROR", message: error.message, status: 500 };
    }

    return {
      code: "UNKNOWN_ERROR",
      message: "An unknown error occurred",
      status: 500,
    };
  }
}
