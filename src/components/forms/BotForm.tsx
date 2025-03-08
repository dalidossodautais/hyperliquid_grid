import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import GridBotForm from "./GridBotForm";
import AutoInvestBotForm from "./AutoInvestBotForm";
import { Asset } from "./types";
import { Duration } from "@/components/ui/DurationInput";

interface BotFormData {
  name: string;
  type: string;
  baseAssetQuantity: string;
  quoteAssetQuantity: string;
  frequency: Duration;
  numberOfShares: number;
  totalDuration: Duration;
  durationPerShare: Duration;
  salePerShare: string;
}

interface BotFormErrors {
  name?: string;
  type?: string;
  connection?: string;
  baseAsset?: string;
  baseAssetQuantity?: string;
  quoteAsset?: string;
  quoteAssetQuantity?: string;
  submit?: string;
  quantities?: string;
  frequency?: string;
  totalDuration?: string;
  durationPerShare?: string;
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
    frequencyValue: number;
    frequencyUnit: string;
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
    type: "grid",
    baseAssetQuantity: "0",
    quoteAssetQuantity: "0",
    frequency: { value: "1", unit: "days" },
    numberOfShares: 1,
    totalDuration: { value: "1", unit: "days" },
    durationPerShare: { value: "1", unit: "days" },
    salePerShare: "0",
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

  // Ajouter une fonction de validation générique pour les objets Duration
  const validateDuration = useCallback(
    (
      duration: Duration,
      errorType: "frequency" | "duration"
    ): string | undefined => {
      if (!duration.value || !duration.unit) {
        return t(`bots.form.errors.${errorType}Required`);
      } else if (duration.value.includes(".") || duration.value.includes(",")) {
        return t(`bots.form.errors.${errorType}ValueDecimal`);
      } else {
        const value = parseInt(duration.value);
        if (isNaN(value) || value <= 0) {
          return t(`bots.form.errors.${errorType}ValueInvalid`);
        }
      }
      return undefined;
    },
    [t]
  );

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
      if (!data.baseAssetQuantity) {
        errors.baseAssetQuantity = t(
          "bots.form.errors.baseAssetQuantityRequired"
        );
      } else if (parseFloat(data.baseAssetQuantity) <= 0) {
        errors.baseAssetQuantity = t(
          "bots.form.errors.baseAssetQuantityInvalid"
        );
      }

      if (
        data.type === "grid" &&
        (!data.quoteAssetQuantity || parseFloat(data.quoteAssetQuantity) <= 0)
      ) {
        errors.quantities = t("bots.form.errors.quantitiesInvalid");
      }

      // Validation des durées pour les bots auto-invest
      if (data.type === "dca") {
        // Validation de l'objet Duration pour la fréquence
        errors.frequency = validateDuration(data.frequency, "frequency");

        // Validation de l'objet Duration pour totalDuration
        errors.totalDuration = validateDuration(data.totalDuration, "duration");

        // Validation de l'objet Duration pour durationPerShare
        errors.durationPerShare = validateDuration(
          data.durationPerShare,
          "duration"
        );
      } else {
        // Réinitialiser les erreurs de durée pour les bots grid
        errors.frequency = undefined;
        errors.totalDuration = undefined;
        errors.durationPerShare = undefined;
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
      validateDuration,
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

  const handleBotInputChange = (name: string, value: string) => {
    setBotFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDurationChange = (name: string, duration: Duration) => {
    setBotFormData((prev) => ({
      ...prev,
      [name]: duration,
    }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleBotInputChange(e.target.name, e.target.value);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleBotInputChange(e.target.name, e.target.value);
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

  const handleQuantityChange = (name: string, value: string) => {
    handleBotInputChange(name, value);
  };

  const handleNumberOfSharesChange = (name: string, value: number) => {
    setBotFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBotFormValid) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: botFormData.name,
        connectionId: selectedConnection,
        baseAsset,
        quoteAsset,
        baseAssetQuantity:
          botFormData.type === "grid"
            ? parseFloat(botFormData.baseAssetQuantity)
            : 0,
        quoteAssetQuantity:
          botFormData.type === "grid"
            ? parseFloat(botFormData.quoteAssetQuantity)
            : 0,
        frequencyValue:
          botFormData.type === "dca"
            ? parseFloat(botFormData.frequency.value)
            : 0,
        frequencyUnit:
          botFormData.type === "dca" ? botFormData.frequency.unit : "",
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
        onChange={handleNameChange}
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
              disabled={isLoadingAssets || validBaseAssets.length === 0}
            />
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
              disabled={
                isLoadingAssets || !baseAsset || validQuoteAssets.length === 0
              }
            />
          </div>
          <Select
            id="type"
            name="type"
            label={t("bots.form.type")}
            value={botFormData.type}
            onChange={handleTypeChange}
            error={botFormErrors.type}
            required
            options={[
              { value: "grid", label: "Grid" },
              { value: "dca", label: "Auto-Invest" },
            ]}
            placeholder={t("bots.form.selectType")}
          />
          {baseAsset &&
            !botFormErrors.baseAsset &&
            quoteAsset &&
            !botFormErrors.quoteAsset &&
            botFormData.type && (
              <>
                {botFormData.type === "grid" ? (
                  <GridBotForm
                    baseAsset={baseAsset}
                    quoteAsset={quoteAsset}
                    baseAssetQuantity={botFormData.baseAssetQuantity}
                    quoteAssetQuantity={botFormData.quoteAssetQuantity}
                    availableAssets={availableAssets}
                    isLoadingAssets={isLoadingAssets}
                    error={botFormErrors.quantities}
                    onQuantityChange={handleQuantityChange}
                    onUseAvailableAsset={handleUseAvailableAsset}
                  />
                ) : (
                  <AutoInvestBotForm
                    baseAsset={baseAsset}
                    baseAssetQuantity={botFormData.baseAssetQuantity}
                    frequency={botFormData.frequency}
                    availableAssets={availableAssets}
                    isLoadingAssets={isLoadingAssets}
                    quantityError={botFormErrors.baseAssetQuantity}
                    totalDurationError={botFormErrors.totalDuration}
                    durationPerShareError={botFormErrors.frequency}
                    onQuantityChange={handleQuantityChange}
                    onFrequencyChange={handleDurationChange}
                    onUseAvailableAsset={(asset) =>
                      handleUseAvailableAsset(asset, "base")
                    }
                    numberOfShares={botFormData.numberOfShares}
                    totalDuration={botFormData.totalDuration}
                    salePerShare={botFormData.salePerShare}
                    onNumberOfSharesChange={handleNumberOfSharesChange}
                    onTotalDurationChange={handleDurationChange}
                    onSalePerShareChange={handleBotInputChange}
                  />
                )}
              </>
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
