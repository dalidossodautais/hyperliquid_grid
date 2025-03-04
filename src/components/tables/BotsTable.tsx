import { useTranslations } from "next-intl";

interface Bot {
  id: string;
  name: string;
  type: string;
  status: "running" | "stopped" | "error";
  createdAt: string;
  updatedAt: string;
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
        <thead>
          <tr>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-black uppercase tracking-wider">
              {t("bots.table.name")}
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-black uppercase tracking-wider">
              {t("bots.table.type")}
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-black uppercase tracking-wider">
              {t("bots.table.status")}
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-black uppercase tracking-wider">
              {t("bots.table.createdAt")}
            </th>
            <th className="px-6 py-3 bg-gray-50"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bots.map((bot) => (
            <tr key={bot.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                {bot.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                {bot.type}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                {new Date(bot.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => onDelete(bot.id)}
                    className="text-red-600 hover:text-red-900 cursor-pointer"
                  >
                    {t("bots.table.delete")}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {bots.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-6 py-4 text-center text-sm text-black"
              >
                {t("bots.table.noBots")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
