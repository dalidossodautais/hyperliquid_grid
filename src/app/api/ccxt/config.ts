// Cache durations
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes
export const PRICE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes

// Configuration des types de wallet par exchange
export const WALLET_TYPES: Record<string, string[]> = {
  hyperliquid: ["spot"],
  binance: ["spot", "margin"],
  coinbase: ["spot"],
  kraken: ["spot", "margin"],
  default: ["spot"],
};
