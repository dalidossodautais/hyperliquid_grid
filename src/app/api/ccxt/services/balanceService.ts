import { Exchange } from "ccxt";
import {
  Asset,
  AggregatedBalances,
  WalletBalance,
  ExtendedConnection,
} from "../types";
import { WALLET_TYPES, PRICE_CACHE_DURATION } from "../config";

export class BalanceService {
  private static balanceCache: Record<
    string,
    { balances: Asset[]; timestamp: number }
  > = {};
  private static priceCache: Record<
    string,
    { prices: Record<string, number>; timestamp: number }
  > = {};

  static async fetchBalances(
    exchangeInstance: Exchange,
    connection: ExtendedConnection,
    request: Request
  ): Promise<Asset[]> {
    const exchangeId = connection.exchange.toLowerCase();
    const allBalances: AggregatedBalances = {
      total: {},
      free: {},
      used: {},
    };

    try {
      if (exchangeId === "hyperliquid") {
        await this.handleHyperliquidBalances(
          exchangeInstance,
          connection,
          allBalances
        );
      } else {
        await this.handleOtherExchangeBalances(
          exchangeInstance,
          exchangeId,
          allBalances
        );
      }

      const assets = await this.processBalancesAndMarkets(
        exchangeInstance,
        allBalances
      );
      await this.addUsdValues(assets, connection, request);

      return assets;
    } catch (error) {
      console.error("Error fetching balances:", error);
      throw error;
    }
  }

  private static async handleHyperliquidBalances(
    exchangeInstance: Exchange,
    connection: ExtendedConnection,
    allBalances: AggregatedBalances
  ): Promise<void> {
    const balance = (await exchangeInstance.fetchBalance()) as WalletBalance;

    try {
      const stakingResponse = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: connection.key,
          type: "delegatorSummary",
        }),
      });

      if (stakingResponse.ok) {
        const stakingData = await stakingResponse.json();
        this.addStakingBalances(stakingData, allBalances);
      }
    } catch (error) {
      console.warn("Error fetching staking data:", error);
    }

    if (balance.total) {
      Object.keys(balance.total).forEach((asset) => {
        allBalances.total[asset] = balance.total?.[asset] as number;
        allBalances.free[asset] = balance.free?.[asset] as number;
        allBalances.used[asset] = balance.used?.[asset] as number;
      });
    }
  }

  private static async handleOtherExchangeBalances(
    exchangeInstance: Exchange,
    exchangeId: string,
    allBalances: AggregatedBalances
  ): Promise<void> {
    const walletTypes = WALLET_TYPES[exchangeId] || WALLET_TYPES.default;

    for (const type of walletTypes) {
      try {
        const typeBalance = (await exchangeInstance.fetchBalance({
          type,
        })) as WalletBalance;
        this.processWalletTypeBalance(typeBalance, allBalances);
      } catch (error) {
        console.warn(
          `Unable to retrieve balances for wallet type ${type}:`,
          error
        );
      }
    }

    if (Object.keys(allBalances.total).length === 0) {
      const balance = (await exchangeInstance.fetchBalance()) as WalletBalance;
      if (balance.total) {
        this.processWalletTypeBalance(balance, allBalances);
      }
    }
  }

  private static processWalletTypeBalance(
    balance: WalletBalance,
    allBalances: AggregatedBalances
  ): void {
    if (!balance.total) return;

    Object.keys(balance.total).forEach((asset) => {
      const amount = balance.total?.[asset] || 0;
      const numAmount =
        typeof amount === "string" ? parseFloat(amount) : Number(amount);

      if (asset in allBalances.total) {
        this.updateExistingBalance(balance, asset, allBalances, numAmount);
      } else {
        this.initializeNewBalance(balance, asset, allBalances, numAmount);
      }
    });
  }

  private static updateExistingBalance(
    balance: WalletBalance,
    asset: string,
    allBalances: AggregatedBalances,
    numAmount: number
  ): void {
    allBalances.total[asset] = (allBalances.total[asset] || 0) + numAmount;

    if (balance.free && asset in balance.free) {
      const freeAmount = balance.free[asset];
      const numFreeAmount =
        typeof freeAmount === "string"
          ? parseFloat(freeAmount)
          : Number(freeAmount);
      allBalances.free[asset] = (allBalances.free[asset] || 0) + numFreeAmount;
    }

    if (balance.used && asset in balance.used) {
      const usedAmount = balance.used[asset];
      const numUsedAmount =
        typeof usedAmount === "string"
          ? parseFloat(usedAmount)
          : Number(usedAmount);
      allBalances.used[asset] = (allBalances.used[asset] || 0) + numUsedAmount;
    }
  }

  private static initializeNewBalance(
    balance: WalletBalance,
    asset: string,
    allBalances: AggregatedBalances,
    numAmount: number
  ): void {
    allBalances.total[asset] = numAmount;

    if (balance.free && asset in balance.free) {
      const freeAmount = balance.free[asset];
      allBalances.free[asset] =
        typeof freeAmount === "string"
          ? parseFloat(freeAmount)
          : Number(freeAmount);
    } else {
      allBalances.free[asset] = 0;
    }

    if (balance.used && asset in balance.used) {
      const usedAmount = balance.used[asset];
      allBalances.used[asset] =
        typeof usedAmount === "string"
          ? parseFloat(usedAmount)
          : Number(usedAmount);
    } else {
      allBalances.used[asset] = 0;
    }
  }

  private static addStakingBalances(
    stakingData: {
      delegated?: string;
      undelegated?: string;
      totalPendingWithdrawal?: string;
    },
    allBalances: AggregatedBalances
  ): void {
    if (stakingData.delegated) {
      allBalances.total["HYPE-STAKED"] = parseFloat(stakingData.delegated);
      allBalances.free["HYPE-STAKED"] = 0;
      allBalances.used["HYPE-STAKED"] = parseFloat(stakingData.delegated);
    }

    if (stakingData.undelegated) {
      allBalances.total["HYPE-UNSTAKED"] = parseFloat(stakingData.undelegated);
      allBalances.free["HYPE-UNSTAKED"] = parseFloat(stakingData.undelegated);
      allBalances.used["HYPE-UNSTAKED"] = 0;
    }

    if (stakingData.totalPendingWithdrawal) {
      allBalances.total["HYPE-PENDING"] = parseFloat(
        stakingData.totalPendingWithdrawal
      );
      allBalances.free["HYPE-PENDING"] = 0;
      allBalances.used["HYPE-PENDING"] = parseFloat(
        stakingData.totalPendingWithdrawal
      );
    }
  }

  private static async processBalancesAndMarkets(
    exchangeInstance: Exchange,
    allBalances: AggregatedBalances
  ): Promise<Asset[]> {
    const markets = await exchangeInstance.loadMarkets();
    const allAssets = new Set<string>();

    Object.values(markets).forEach((market) => {
      if (market && market.base) allAssets.add(market.base);
      if (market && market.quote) allAssets.add(market.quote);
    });

    Object.keys(allBalances.total).forEach((asset) => {
      allAssets.add(asset);
    });

    return Array.from(allAssets)
      .sort()
      .map((asset) => ({
        asset,
        total: allBalances.total[asset] || 0,
        free: allBalances.free[asset] || 0,
        used: allBalances.used[asset] || 0,
      }));
  }

  private static async addUsdValues(
    assets: Asset[],
    connection: ExtendedConnection,
    request: Request
  ): Promise<void> {
    const nonUsdcAssets = assets.filter((asset) => asset.asset !== "USDC");
    if (nonUsdcAssets.length === 0) return;

    try {
      const symbols = nonUsdcAssets.map((asset) => asset.asset).join(",");
      const requestUrl = new URL(request.url);

      const cachedPrices = this.priceCache[connection.id];
      let prices: Record<string, number> = {};

      if (
        cachedPrices &&
        Date.now() - cachedPrices.timestamp < PRICE_CACHE_DURATION
      ) {
        prices = cachedPrices.prices;
      } else {
        const priceResponse = await fetch(
          `${requestUrl.origin}/api/ccxt/price?id=${connection.id}&symbols=${symbols}`,
          {
            headers: {
              cookie: request.headers.get("cookie") || "",
            },
          }
        );
        if (priceResponse.ok) {
          const { prices: newPrices } = await priceResponse.json();
          prices = newPrices;

          this.priceCache[connection.id] = {
            prices,
            timestamp: Date.now(),
          };
        }
      }

      assets.forEach((asset) => {
        if (asset.asset === "USDC") {
          asset.usdValue = asset.total;
        } else if (prices[asset.asset]) {
          asset.usdValue = asset.total * prices[asset.asset];
        }
      });
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  }
}
