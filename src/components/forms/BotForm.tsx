import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";

interface BotFormData {
  name: string;
}

interface BotFormErrors {
  name?: string;
  connection?: string;
  baseAsset?: string;
  quoteAsset?: string;
  submit?: string;
}

interface ExchangeConnection {
  id: string;
  name: string;
  exchange: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Asset {
  asset: string;
  total: number;
  free: number;
  used: number;
  usdValue?: number;
}

interface BotFormProps {
  onSubmit: (data: {
    name: string;
    connectionId: string;
    baseAsset: string;
    quoteAsset: string;
  }) => Promise<void>;
  onCancel: () => void;
  connections: ExchangeConnection[];
  error: string | null;
  onFetchAssets: (connectionId: string) => Promise<Asset[]>;
}

export default function BotForm({
  onSubmit,
  onCancel,
  connections,
  error,
  onFetchAssets,
}: BotFormProps) {
  const t = useTranslations("dashboard");
  const [botFormData, setBotFormData] = useState<BotFormData>({
    name: "",
  });
  const [botFormErrors, setBotFormErrors] = useState<BotFormErrors>({});
  const [isBotFormValid, setIsBotFormValid] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<string>("");
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [baseAsset, setBaseAsset] = useState<string>("");
  const [quoteAsset, setQuoteAsset] = useState<string>("");

  const validateBotForm = useCallback(
    (data: BotFormData): boolean => {
      const errors: BotFormErrors = {};

      if (!data.name) {
        errors.name = t("bots.form.errors.nameRequired");
      } else if (data.name.length < 3) {
        errors.name = t("bots.form.errors.nameLength");
      }

      if (!selectedConnection) {
        errors.connection = t("bots.form.errors.connectionRequired");
      }

      if (!baseAsset) {
        errors.baseAsset = t("bots.form.errors.baseAssetRequired");
      }

      if (!quoteAsset) {
        errors.quoteAsset = t("bots.form.errors.quoteAssetRequired");
      }

      if (baseAsset === quoteAsset) {
        errors.quoteAsset = t("bots.form.errors.sameAsset");
      }

      setBotFormErrors(errors);
      const isValid = Object.keys(errors).length === 0;
      setIsBotFormValid(isValid);
      return isValid;
    },
    [t, selectedConnection, baseAsset, quoteAsset]
  );

  useEffect(() => {
    validateBotForm(botFormData);
  }, [botFormData, validateBotForm]);

  const handleBotInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setBotFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConnectionChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const connectionId = e.target.value;
    setSelectedConnection(connectionId);
    setBaseAsset("");
    setQuoteAsset("");

    if (connectionId) {
      const assets = await onFetchAssets(connectionId);
      setAvailableAssets(assets);
    } else {
      setAvailableAssets([]);
    }
  };

  const handleBaseAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBaseAsset(e.target.value);
    setQuoteAsset("");
  };

  const handleQuoteAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuoteAsset(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBotFormErrors({});

    if (!validateBotForm(botFormData)) {
      return;
    }

    await onSubmit({
      name: botFormData.name,
      connectionId: selectedConnection,
      baseAsset,
      quoteAsset,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-800"
        >
          {t("bots.form.name")}
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={botFormData.name}
          onChange={handleBotInputChange}
          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black [color:black]"
          required
        />
        {botFormErrors.name && (
          <p className="mt-1 text-sm text-red-600">{botFormErrors.name}</p>
        )}
      </div>
      <div className="mb-4">
        <label
          htmlFor="connection"
          className="block text-sm font-medium text-gray-800"
        >
          {t("bots.form.connection")}
        </label>
        <select
          id="connection"
          name="connection"
          value={selectedConnection}
          onChange={handleConnectionChange}
          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black [color:black]"
          required
        >
          <option value="">{t("bots.form.selectConnection")}</option>
          {connections.map((connection) => (
            <option key={connection.id} value={connection.id}>
              {connection.name} ({connection.exchange})
            </option>
          ))}
        </select>
        {botFormErrors.connection && (
          <p className="mt-1 text-sm text-red-600">
            {botFormErrors.connection}
          </p>
        )}
      </div>
      {selectedConnection && !botFormErrors.connection && (
        <div className="mb-4">
          <label
            htmlFor="baseAsset"
            className="block text-sm font-medium text-gray-800"
          >
            {t("bots.form.baseAsset")}
          </label>
          <select
            id="baseAsset"
            name="baseAsset"
            value={baseAsset}
            onChange={handleBaseAssetChange}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black [color:black]"
            required
          >
            <option value="">{t("bots.form.selectBaseAsset")}</option>
            {availableAssets.map((asset) => (
              <option key={asset.asset} value={asset.asset}>
                {asset.asset}
              </option>
            ))}
          </select>
          {botFormErrors.baseAsset && (
            <p className="mt-1 text-sm text-red-600">
              {botFormErrors.baseAsset}
            </p>
          )}
        </div>
      )}
      {baseAsset && !botFormErrors.baseAsset && (
        <div className="mb-4">
          <label
            htmlFor="quoteAsset"
            className="block text-sm font-medium text-gray-800"
          >
            {t("bots.form.quoteAsset")}
          </label>
          <select
            id="quoteAsset"
            name="quoteAsset"
            value={quoteAsset}
            onChange={handleQuoteAssetChange}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black [color:black]"
            required
          >
            <option value="">{t("bots.form.selectQuoteAsset")}</option>
            {availableAssets
              .filter((asset) => asset.asset !== baseAsset)
              .map((asset) => (
                <option key={asset.asset} value={asset.asset}>
                  {asset.asset}
                </option>
              ))}
          </select>
          {botFormErrors.quoteAsset && (
            <p className="mt-1 text-sm text-red-600">
              {botFormErrors.quoteAsset}
            </p>
          )}
        </div>
      )}
      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
        >
          {t("bots.form.cancel")}
        </button>
        <button
          type="submit"
          disabled={!isBotFormValid}
          className={`w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            !isBotFormValid
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-blue-700 cursor-pointer"
          }`}
        >
          {t("bots.form.submit")}
        </button>
      </div>
    </form>
  );
}
