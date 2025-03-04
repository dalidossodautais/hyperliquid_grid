import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

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
      <Input
        id="name"
        name="name"
        label={t("bots.form.name")}
        value={botFormData.name}
        onChange={handleBotInputChange}
        error={botFormErrors.name}
        required
      />
      <Select
        id="connection"
        name="connection"
        label={t("bots.form.connection")}
        value={selectedConnection}
        onChange={handleConnectionChange}
        options={connections.map((connection) => ({
          value: connection.id,
          label: `${connection.name} (${connection.exchange})`,
        }))}
        error={botFormErrors.connection}
        required
        placeholder={t("bots.form.selectConnection")}
      />
      {selectedConnection && !botFormErrors.connection && (
        <Select
          id="baseAsset"
          name="baseAsset"
          label={t("bots.form.baseAsset")}
          value={baseAsset}
          onChange={handleBaseAssetChange}
          options={validBaseAssets.map((asset) => ({
            value: asset,
            label: asset,
          }))}
          error={botFormErrors.baseAsset}
          required
          disabled={isLoadingAssets}
          placeholder={t("bots.form.selectBaseAsset")}
          isLoading={isLoadingAssets}
        />
      )}
      {baseAsset && !botFormErrors.baseAsset && (
        <Input
          id="baseAssetQuantity"
          name="baseAssetQuantity"
          label={t("bots.form.baseAssetQuantity")}
          type="number"
          value={botFormData.baseAssetQuantity}
          onChange={handleBotInputChange}
          error={botFormErrors.baseAssetQuantity}
          required
          min={0}
          step="any"
        />
      )}
      {baseAsset && !botFormErrors.baseAsset && (
        <Select
          id="quoteAsset"
          name="quoteAsset"
          label={t("bots.form.quoteAsset")}
          value={quoteAsset}
          onChange={handleQuoteAssetChange}
          options={validQuoteAssets.map((asset) => ({
            value: asset,
            label: asset,
          }))}
          error={botFormErrors.quoteAsset}
          required
          placeholder={t("bots.form.selectQuoteAsset")}
        />
      )}
      {quoteAsset && !botFormErrors.quoteAsset && (
        <Input
          id="quoteAssetQuantity"
          name="quoteAssetQuantity"
          label={t("bots.form.quoteAssetQuantity")}
          type="number"
          value={botFormData.quoteAssetQuantity}
          onChange={handleBotInputChange}
          error={botFormErrors.quoteAssetQuantity}
          required
          min={0}
          step="any"
        />
      )}
      <div className="flex justify-end space-x-3">
        <Button type="button" onClick={onCancel} variant="outline">
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={!isBotFormValid}>
          {t("create")}
        </Button>
      </div>
    </form>
  );
}
