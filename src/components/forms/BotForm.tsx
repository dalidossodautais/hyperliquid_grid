import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";

interface BotFormData {
  name: string;
  baseAssetQuantity: string;
  quoteAssetQuantity: string;
}

interface BotFormErrors {
  name?: string;
  connection?: string;
  baseAsset?: string;
  baseAssetQuantity?: string;
  quoteAsset?: string;
  quoteAssetQuantity?: string;
  submit?: string;
}

interface ExchangeConnection {
  id: string;
  name: string;
  exchange: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  availableSymbols?: string[];
}

interface BotFormProps {
  onSubmit: (data: {
    name: string;
    connectionId: string;
    baseAsset: string;
    quoteAsset: string;
    baseAssetQuantity: number;
    quoteAssetQuantity: number;
  }) => Promise<void>;
  onCancel: () => void;
  connections: ExchangeConnection[];
  error: string | null;
  onFetchSymbols: (connectionId: string) => Promise<string[]>;
}

export default function BotForm({
  onSubmit,
  onCancel,
  connections,
  error,
  onFetchSymbols,
}: BotFormProps) {
  const t = useTranslations("dashboard");
  const [botFormData, setBotFormData] = useState<BotFormData>({
    name: "",
    baseAssetQuantity: "",
    quoteAssetQuantity: "",
  });
  const [botFormErrors, setBotFormErrors] = useState<BotFormErrors>({});
  const [isBotFormValid, setIsBotFormValid] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<string>("");
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  const [baseAsset, setBaseAsset] = useState<string>("");
  const [quoteAsset, setQuoteAsset] = useState<string>("");
  const [validBaseAssets, setValidBaseAssets] = useState<string[]>([]);
  const [validQuoteAssets, setValidQuoteAssets] = useState<string[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);

  const cleanSymbol = useCallback((symbol: string): string => {
    return symbol.replace(/:USDC$/, "");
  }, []);

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

      if (!data.baseAssetQuantity) {
        errors.baseAssetQuantity = t(
          "bots.form.errors.baseAssetQuantityRequired"
        );
      } else if (parseFloat(data.baseAssetQuantity) <= 0) {
        errors.baseAssetQuantity = t(
          "bots.form.errors.baseAssetQuantityInvalid"
        );
      }

      if (!quoteAsset) {
        errors.quoteAsset = t("bots.form.errors.quoteAssetRequired");
      }

      if (!data.quoteAssetQuantity) {
        errors.quoteAssetQuantity = t(
          "bots.form.errors.quoteAssetQuantityRequired"
        );
      } else if (parseFloat(data.quoteAssetQuantity) <= 0) {
        errors.quoteAssetQuantity = t(
          "bots.form.errors.quoteAssetQuantityInvalid"
        );
      }

      if (baseAsset === quoteAsset) {
        errors.quoteAsset = t("bots.form.errors.sameAsset");
      }

      const cleanedTradingPair = `${cleanSymbol(baseAsset)}/${cleanSymbol(
        quoteAsset
      )}`;
      if (
        baseAsset &&
        quoteAsset &&
        !availableSymbols.some(
          (symbol) => cleanSymbol(symbol) === cleanedTradingPair
        )
      ) {
        errors.quoteAsset = t("bots.form.errors.invalidTradingPair");
      }

      setBotFormErrors(errors);
      const isValid = Object.keys(errors).length === 0;
      setIsBotFormValid(isValid);
      return isValid;
    },
    [
      t,
      selectedConnection,
      baseAsset,
      quoteAsset,
      availableSymbols,
      cleanSymbol,
    ]
  );

  useEffect(() => {
    validateBotForm(botFormData);
  }, [botFormData, validateBotForm]);

  useEffect(() => {
    if (availableSymbols.length > 0) {
      const baseAssets = new Set<string>();
      availableSymbols.forEach((symbol) => {
        const [base] = symbol.split("/");
        baseAssets.add(cleanSymbol(base));
      });
      setValidBaseAssets(Array.from(baseAssets).sort());
    } else {
      setValidBaseAssets([]);
    }
  }, [availableSymbols, cleanSymbol]);

  useEffect(() => {
    if (baseAsset && availableSymbols.length > 0) {
      const quoteAssets = new Set<string>();
      availableSymbols.forEach((symbol) => {
        const [base, quote] = symbol.split("/");
        if (cleanSymbol(base) === baseAsset && quote) {
          quoteAssets.add(cleanSymbol(quote));
        }
      });
      setValidQuoteAssets(Array.from(quoteAssets).sort());
    } else {
      setValidQuoteAssets([]);
    }
  }, [baseAsset, availableSymbols, cleanSymbol]);

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
    setValidBaseAssets([]);
    setValidQuoteAssets([]);

    if (connectionId) {
      setIsLoadingAssets(true);
      try {
        const symbols = await onFetchSymbols(connectionId);
        setAvailableSymbols(symbols);
      } finally {
        setIsLoadingAssets(false);
      }
    } else {
      setAvailableSymbols([]);
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
      baseAssetQuantity: parseFloat(botFormData.baseAssetQuantity),
      quoteAssetQuantity: parseFloat(botFormData.quoteAssetQuantity),
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
          <div className="relative">
            <select
              id="baseAsset"
              name="baseAsset"
              value={baseAsset}
              onChange={handleBaseAssetChange}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black [color:black]"
              required
              disabled={isLoadingAssets}
            >
              <option value="">{t("bots.form.selectBaseAsset")}</option>
              {validBaseAssets.map((asset) => (
                <option key={asset} value={asset}>
                  {asset}
                </option>
              ))}
            </select>
            {isLoadingAssets && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
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
            htmlFor="baseAssetQuantity"
            className="block text-sm font-medium text-gray-800"
          >
            {t("bots.form.baseAssetQuantity")}
          </label>
          <input
            type="number"
            id="baseAssetQuantity"
            name="baseAssetQuantity"
            value={botFormData.baseAssetQuantity}
            onChange={handleBotInputChange}
            min="0"
            step="any"
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black [color:black]"
            required
          />
          {botFormErrors.baseAssetQuantity && (
            <p className="mt-1 text-sm text-red-600">
              {botFormErrors.baseAssetQuantity}
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
            {validQuoteAssets.map((asset) => (
              <option key={asset} value={asset}>
                {asset}
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
      {quoteAsset && !botFormErrors.quoteAsset && (
        <div className="mb-4">
          <label
            htmlFor="quoteAssetQuantity"
            className="block text-sm font-medium text-gray-800"
          >
            {t("bots.form.quoteAssetQuantity")}
          </label>
          <input
            type="number"
            id="quoteAssetQuantity"
            name="quoteAssetQuantity"
            value={botFormData.quoteAssetQuantity}
            onChange={handleBotInputChange}
            min="0"
            step="any"
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black [color:black]"
            required
          />
          {botFormErrors.quoteAssetQuantity && (
            <p className="mt-1 text-sm text-red-600">
              {botFormErrors.quoteAssetQuantity}
            </p>
          )}
        </div>
      )}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={!isBotFormValid}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {t("create")}
        </button>
      </div>
    </form>
  );
}
