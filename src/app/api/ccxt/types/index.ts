// Interface for exchange configuration
export interface ExchangeConfig {
  apiKey: string;
  secret?: string;
  walletAddress?: string;
  apiWalletAddress?: string;
  apiPrivateKey?: string;
  enableRateLimit?: boolean;
  timeout?: number;
  options?: {
    defaultType?: string;
    fetchMarkets?: string[];
  };
}

// Interface for aggregated balances
export interface AggregatedBalances {
  total: Record<string, number>;
  free: Record<string, number>;
  used: Record<string, number>;
  [key: string]: Record<string, number> | unknown;
}

// Type for specific wallet balance
export type WalletBalance = {
  free?: Record<string, number>;
  used?: Record<string, number>;
  total?: Record<string, number>;
  [key: string]: Record<string, number> | unknown;
};

// Extended connection type to include optional API wallet fields
export interface ExtendedConnection {
  id: string;
  userId: string;
  name: string;
  exchange: string;
  key: string;
  secret: string | null;
  apiWalletAddress?: string | null;
  apiPrivateKey?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for asset
export interface Asset {
  asset: string;
  total: number;
  free: number;
  used: number;
  usdValue?: number;
}

// Cache pour stocker les balances
export interface BalanceCache {
  balances: Asset[];
  timestamp: number;
}

// Interface for market
export interface Market {
  base: string;
  quote: string;
  [key: string]: unknown;
}
