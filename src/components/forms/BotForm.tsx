import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Label from "@/components/ui/Label";

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
  quantities?: string;
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
    baseAssetQuantity: number;
    quoteAssetQuantity: number;
  }) => Promise<void>;
  onCancel: () => void;
  connections: ExchangeConnection[];
  error: string | null;
  onFetchSymbols: (connectionId: string) => Promise<string[]>;
  onFetchAssets: (connectionId: string) => Promise<Asset[]>;
}

export default function BotForm({
  onSubmit,
  onCancel,
  connections,
  error,
  onFetchSymbols,
  onFetchAssets,
}: BotFormProps) {
  const t = useTranslations("dashboard");
  const [botFormData, setBotFormData] = useState<BotFormData>({
    name: "",
    baseAssetQuantity: "0",
    quoteAssetQuantity: "0",
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);

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

      if (!quoteAsset) {
        errors.quoteAsset = t("bots.form.errors.quoteAssetRequired");
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

      // Validation globale des quantités
      if (!data.baseAssetQuantity || !data.quoteAssetQuantity) {
        errors.quantities = t("bots.form.errors.quantitiesRequired");
      } else if (
        parseFloat(data.baseAssetQuantity) <= 0 &&
        parseFloat(data.quoteAssetQuantity) <= 0
      ) {
        errors.quantities = t("bots.form.errors.quantitiesInvalid");
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
    setAvailableAssets([]);

    if (connectionId) {
      setIsLoadingAssets(true);
      try {
        const [symbols, assets] = await Promise.all([
          onFetchSymbols(connectionId),
          onFetchAssets(connectionId),
        ]);
        setAvailableSymbols(symbols);
        setAvailableAssets(assets);
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

  const handleUseAvailableAsset = (asset: string, type: "base" | "quote") => {
    const availableAsset = availableAssets.find((a) => a.asset === asset);
    if (availableAsset) {
      setBotFormData((prev) => ({
        ...prev,
        [type === "base" ? "baseAssetQuantity" : "quoteAssetQuantity"]:
          availableAsset.free.toString(),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBotFormErrors({});

    if (!validateBotForm(botFormData)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: botFormData.name,
        connectionId: selectedConnection,
        baseAsset,
        quoteAsset,
        baseAssetQuantity: parseFloat(botFormData.baseAssetQuantity),
        quoteAssetQuantity: parseFloat(botFormData.quoteAssetQuantity),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert type="error">{error}</Alert>}
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
        error={botFormErrors.connection}
        required
        options={connections.map((connection) => ({
          value: connection.id,
          label: `${connection.name} (${connection.exchange})`,
        }))}
        placeholder={t("bots.form.selectConnection")}
        isLoading={isLoadingAssets}
      />
      {selectedConnection && !botFormErrors.connection && (
        <div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              id="baseAsset"
              name="baseAsset"
              label={t("bots.form.baseAsset")}
              value={baseAsset}
              onChange={handleBaseAssetChange}
              error={botFormErrors.baseAsset}
              required
              options={validBaseAssets.map((asset) => ({
                value: asset,
                label: asset,
              }))}
              placeholder={t("bots.form.selectBaseAsset")}
              disabled={isLoadingAssets}
            />
            {baseAsset && !botFormErrors.baseAsset && (
              <Select
                id="quoteAsset"
                name="quoteAsset"
                label={t("bots.form.quoteAsset")}
                value={quoteAsset}
                onChange={handleQuoteAssetChange}
                error={botFormErrors.quoteAsset}
                required
                options={validQuoteAssets.map((asset) => ({
                  value: asset,
                  label: asset,
                }))}
                placeholder={t("bots.form.selectQuoteAsset")}
                disabled={isLoadingAssets}
              />
            )}
          </div>
          {baseAsset &&
            !botFormErrors.baseAsset &&
            quoteAsset &&
            !botFormErrors.quoteAsset && (
              <Label
                title={t("bots.form.quantity")}
                error={botFormErrors.quantities}
                required
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="relative">
                      <Input
                        id="baseAssetQuantity"
                        name="baseAssetQuantity"
                        label=""
                        type="number"
                        value={botFormData.baseAssetQuantity}
                        onChange={handleBotInputChange}
                        error={botFormErrors.baseAssetQuantity}
                        required
                        min={0}
                        step={0.00000001}
                        unit={baseAsset}
                        disabled={isLoadingAssets}
                      />
                      {availableAssets.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleUseAvailableAsset(baseAsset, "base")
                          }
                          className="absolute -bottom-6 right-0 text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          {`${
                            availableAssets.find((a) => a.asset === baseAsset)
                              ?.free || 0
                          } ${baseAsset}`}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="relative">
                      <Input
                        id="quoteAssetQuantity"
                        name="quoteAssetQuantity"
                        label=""
                        type="number"
                        value={botFormData.quoteAssetQuantity}
                        onChange={handleBotInputChange}
                        error={botFormErrors.quoteAssetQuantity}
                        required
                        min={0}
                        step={0.00000001}
                        unit={quoteAsset}
                        disabled={isLoadingAssets}
                      />
                      {availableAssets.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleUseAvailableAsset(quoteAsset, "quote")
                          }
                          className="absolute -bottom-6 right-0 text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          {`${
                            availableAssets.find((a) => a.asset === quoteAsset)
                              ?.free || 0
                          } ${quoteAsset}`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Label>
            )}
        </div>
      )}
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t("cancel")}
        </Button>
        <Button
          type="submit"
          disabled={!isBotFormValid || isSubmitting}
          isLoading={isSubmitting}
        >
          {t("create")}
        </Button>
      </div>
    </form>
  );
}
