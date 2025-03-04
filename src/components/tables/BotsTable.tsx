import { useTranslations } from "next-intl";

interface Bot {
  id: string;
  name: string;
  type: string;
  status: "running" | "stopped" | "error";
  createdAt: string;
  updatedAt: string;
  config: {
    baseAsset: string;
    quoteAsset: string;
    baseAssetQuantity: number;
    quoteAssetQuantity: number;
  } | null;
}

interface BotsTableProps {
  bots: Bot[];
  onDelete: (id: string) => Promise<void>;
}

export default function BotsTable({ bots, onDelete }: BotsTableProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("bots.table.name")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("bots.table.type")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("bots.table.pair")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("bots.table.quantities")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("bots.table.status")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("bots.table.createdAt")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("bots.table.actions")}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bots.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-6 py-4 text-center text-sm text-gray-500"
              >
                {t("bots.table.noBots")}
              </td>
            </tr>
          ) : (
            bots.map((bot) => (
              <tr key={bot.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {bot.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {bot.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {bot.config?.baseAsset}/{bot.config?.quoteAsset}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {bot.config?.baseAssetQuantity} {bot.config?.baseAsset} /{" "}
                  {bot.config?.quoteAssetQuantity} {bot.config?.quoteAsset}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      bot.status === "running"
                        ? "bg-green-100 text-green-800"
                        : bot.status === "stopped"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {t(`bots.status.${bot.status}`)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(bot.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => onDelete(bot.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    {t("delete")}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
