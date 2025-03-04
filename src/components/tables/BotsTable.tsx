import { useTranslations } from "next-intl";
import ActionButton from "@/components/ui/ActionButton";
import Table from "@/components/ui/Table";

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

  const columns = [
    {
      key: "name",
      header: t("bots.table.name"),
      cell: (bot: Bot) => (
        <span className="font-medium text-gray-900">{bot.name}</span>
      ),
    },
    {
      key: "type",
      header: t("bots.table.type"),
      cell: (bot: Bot) => <span className="text-gray-500">{bot.type}</span>,
    },
    {
      key: "pair",
      header: t("bots.table.pair"),
      cell: (bot: Bot) => (
        <span className="text-gray-500">
          {bot.config?.baseAsset}/{bot.config?.quoteAsset}
        </span>
      ),
    },
    {
      key: "status",
      header: t("bots.table.status"),
      cell: (bot: Bot) => (
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
      ),
    },
    {
      key: "createdAt",
      header: t("bots.table.createdAt"),
      cell: (bot: Bot) => (
        <span className="text-gray-500">
          {new Date(bot.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("bots.table.actions"),
      cell: (bot: Bot) => (
        <ActionButton onClick={() => onDelete(bot.id)} variant="danger">
          {t("delete")}
        </ActionButton>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={bots}
      emptyMessage={t("bots.table.noBots")}
    />
  );
}
