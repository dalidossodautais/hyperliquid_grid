import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import ActionButton from "@/components/ui/ActionButton";
import Table from "@/components/ui/Table";

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

  const columns = [
    {
      key: "name",
      header: t("ccxt.table.name"),
      cell: (connection: ExchangeConnection) => (
        <span className="text-black">{connection.name}</span>
      ),
    },
    {
      key: "exchange",
      header: t("ccxt.table.exchange"),
      cell: (connection: ExchangeConnection) => (
        <span className="text-black">{connection.exchange}</span>
      ),
    },
    {
      key: "status",
      header: t("ccxt.table.status"),
      cell: (connection: ExchangeConnection) => (
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
      ),
    },
    {
      key: "createdAt",
      header: t("ccxt.table.createdAt"),
      cell: (connection: ExchangeConnection) => (
        <span className="text-black">
          {new Date(connection.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (connection: ExchangeConnection) => (
        <div className="flex justify-end space-x-4">
          <ActionButton
            onClick={() => toggleConnectionExpand(connection.id)}
            variant="primary"
          >
            {expandedConnections.has(connection.id)
              ? t("ccxt.table.hideAssets")
              : t("ccxt.table.showAssets")}
          </ActionButton>
          <ActionButton
            onClick={() => onDelete(connection.id)}
            variant="danger"
          >
            {t("delete")}
          </ActionButton>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        data={connections}
        emptyMessage={t("ccxt.table.noConnections")}
      />

      {connections.map(
        (connection) =>
          expandedConnections.has(connection.id) && (
            <div key={`assets-${connection.id}`} className="mt-4">
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
                  <Table
                    columns={[
                      {
                        key: "asset",
                        header: t("ccxt.assets.asset"),
                        cell: (asset: Asset) => (
                          <span className="font-medium text-black">
                            {asset.asset}
                          </span>
                        ),
                      },
                      {
                        key: "total",
                        header: t("ccxt.assets.total"),
                        cell: (asset: Asset) => (
                          <span className="text-right text-black">
                            {formatAssetValue(asset.total)}
                            {asset.usdValue &&
                              asset.total > 0 &&
                              ` ($${asset.usdValue.toFixed(2)})`}
                          </span>
                        ),
                      },
                      {
                        key: "free",
                        header: t("ccxt.assets.free"),
                        cell: (asset: Asset) => (
                          <span className="text-right text-black">
                            {formatAssetValue(asset.free)}
                            {asset.usdValue &&
                              asset.free > 0 &&
                              ` ($${calculateAssetValue(
                                asset,
                                asset.free
                              ).toFixed(2)})`}
                          </span>
                        ),
                      },
                      {
                        key: "used",
                        header: t("ccxt.assets.used"),
                        cell: (asset: Asset) => (
                          <span className="text-right text-black">
                            {formatAssetValue(asset.used)}
                            {asset.usdValue &&
                              asset.used > 0 &&
                              ` ($${calculateAssetValue(
                                asset,
                                asset.used
                              ).toFixed(2)})`}
                          </span>
                        ),
                      },
                    ]}
                    data={connection.assets.filter((asset) => asset.total > 0)}
                    emptyMessage={t("ccxt.assets.noAssets")}
                  />
                ) : (
                  <p className="text-center text-gray-500">
                    {t("ccxt.assets.noAssets")}
                  </p>
                )}
              </div>
            </div>
          )
      )}
    </div>
  );
}
