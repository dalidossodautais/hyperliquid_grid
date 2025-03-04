import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";

interface Asset {
  asset: string;
  total: number;
  free: number;
  used: number;
  usdValue?: number;
}

interface ExchangeConnection {
  id: string;
  name: string;
  exchange: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assets?: Asset[];
}

interface ConnectionsTableProps {
  connections: ExchangeConnection[];
  onDelete: (id: string) => Promise<void>;
  onFetchAssets: (connectionId: string) => Promise<Asset[]>;
  onUpdateConnection: (connectionId: string, assets: Asset[]) => void;
}

const formatAssetValue = (value: number): string => {
  if (value === 0) return "0";
  if (value < 0.00000001) return "<0.00000001";
  if (value < 0.0001) return value.toFixed(8);
  if (value < 0.01) return value.toFixed(6);
  if (value < 1) return value.toFixed(4);
  if (value < 1000) return value.toFixed(2);
  return value.toFixed(2);
};

export default function ConnectionsTable({
  connections,
  onDelete,
  onFetchAssets,
  onUpdateConnection,
}: ConnectionsTableProps) {
  const t = useTranslations("dashboard");
  const [expandedConnections, setExpandedConnections] = useState<Set<string>>(
    new Set()
  );

  const toggleConnectionExpand = useCallback(
    async (connectionId: string) => {
      const newExpandedConnections = new Set(expandedConnections);
      if (newExpandedConnections.has(connectionId)) {
        newExpandedConnections.delete(connectionId);
      } else {
        newExpandedConnections.add(connectionId);
        const assets = await onFetchAssets(connectionId);
        onUpdateConnection(connectionId, assets);
      }
      setExpandedConnections(newExpandedConnections);
    },
    [expandedConnections, onFetchAssets, onUpdateConnection]
  );

  const calculateTotalValue = useCallback((assets: Asset[]): number => {
    return assets.reduce((sum, asset) => {
      if (asset.asset === "USDC") {
        return sum + asset.total;
      }
      return sum + (asset.usdValue || 0);
    }, 0);
  }, []);

  const calculateAssetValue = useCallback(
    (asset: Asset, value: number): number => {
      if (!asset.usdValue || asset.total === 0) return 0;
      return value * (asset.usdValue / asset.total);
    },
    []
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-black uppercase tracking-wider">
              {t("ccxt.table.name")}
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-black uppercase tracking-wider">
              {t("ccxt.table.exchange")}
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-black uppercase tracking-wider">
              {t("ccxt.table.status")}
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-black uppercase tracking-wider">
              {t("ccxt.table.createdAt")}
            </th>
            <th className="px-6 py-3 bg-gray-50"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {connections.map((connection) => (
            <tr key={connection.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                {connection.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                {connection.exchange}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    connection.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {connection.isActive
                    ? t("ccxt.table.active")
                    : t("ccxt.table.inactive")}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                {new Date(connection.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => toggleConnectionExpand(connection.id)}
                    className="text-blue-600 hover:text-blue-900 cursor-pointer"
                  >
                    {expandedConnections.has(connection.id)
                      ? t("ccxt.table.hideAssets")
                      : t("ccxt.table.showAssets")}
                  </button>
                  <button
                    onClick={() => onDelete(connection.id)}
                    className="text-red-600 hover:text-red-900 cursor-pointer"
                  >
                    {t("delete")}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {connections.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-6 py-4 text-center text-sm text-black"
              >
                {t("ccxt.table.noConnections")}
              </td>
            </tr>
          )}

          {connections.map(
            (connection) =>
              expandedConnections.has(connection.id) && (
                <tr key={`assets-${connection.id}`}>
                  <td colSpan={5} className="px-6 py-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {t("ccxt.assets.title")}
                          </h3>
                        </div>
                      </div>
                      {connection.assets && connection.assets.length > 0 && (
                        <div className="mb-4 text-right text-sm font-medium text-gray-900">
                          {t("ccxt.assets.totalValue")}: $
                          {calculateTotalValue(connection.assets).toFixed(2)}
                        </div>
                      )}
                      {connection.assets && connection.assets.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-4 py-2 bg-gray-100 text-left text-xs font-medium text-black uppercase tracking-wider">
                                  {t("ccxt.assets.asset")}
                                </th>
                                <th className="px-4 py-2 bg-gray-100 text-right text-xs font-medium text-black uppercase tracking-wider">
                                  {t("ccxt.assets.total")}
                                </th>
                                <th className="px-4 py-2 bg-gray-100 text-right text-xs font-medium text-black uppercase tracking-wider">
                                  {t("ccxt.assets.free")}
                                </th>
                                <th className="px-4 py-2 bg-gray-100 text-right text-xs font-medium text-black uppercase tracking-wider">
                                  {t("ccxt.assets.used")}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {connection.assets
                                .filter((asset) => asset.total > 0)
                                .map((asset, index) => (
                                  <tr
                                    key={`${connection.id}-${asset.asset}-${index}`}
                                  >
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-black">
                                      {asset.asset}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-black">
                                      {formatAssetValue(asset.total)}
                                      {asset.usdValue &&
                                        asset.total > 0 &&
                                        ` ($${asset.usdValue.toFixed(2)})`}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-black">
                                      {formatAssetValue(asset.free)}
                                      {asset.usdValue &&
                                        asset.free > 0 &&
                                        ` ($${calculateAssetValue(
                                          asset,
                                          asset.free
                                        ).toFixed(2)})`}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-black">
                                      {formatAssetValue(asset.used)}
                                      {asset.usdValue &&
                                        asset.used > 0 &&
                                        ` ($${calculateAssetValue(
                                          asset,
                                          asset.used
                                        ).toFixed(2)})`}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-center text-gray-500">
                          {t("ccxt.assets.noAssets")}
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )
          )}
        </tbody>
      </table>
    </div>
  );
}
