import { useTranslations } from "next-intl";
import Input from "@/components/ui/Input";
import DurationInput, { Duration } from "@/components/ui/DurationInput";
import { Asset } from "./types";

interface AutoInvestBotFormProps {
  baseAsset: string;
  baseAssetQuantity: string;
  frequency: Duration;
  availableAssets: Asset[];
  isLoadingAssets: boolean;
  quantityError?: string;
  totalDurationError?: string;
  durationPerShareError?: string;
  onQuantityChange: (name: string, value: string) => void;
  onFrequencyChange: (name: string, duration: Duration) => void;
  onUseAvailableAsset: (asset: string) => void;
  numberOfShares: number;
  totalDuration: Duration;
  salePerShare: string;
  onNumberOfSharesChange: (name: string, value: number) => void;
  onTotalDurationChange: (name: string, duration: Duration) => void;
  onSalePerShareChange: (name: string, value: string) => void;
}

// Créer un composant réutilisable pour les champs de durée
const DurationField = ({
  id,
  name,
  label,
  duration,
  error,
  onChange,
  disabled,
}: {
  id: string;
  name: string;
  label: string;
  duration: Duration;
  error?: string;
  onChange: (name: string, duration: Duration) => void;
  disabled: boolean;
}) => {
  return (
    <div>
      <DurationInput
        id={id}
        name={name}
        label={label}
        value={duration.value}
        onChange={(name, value, unit) =>
          onChange(name, { value, unit: unit || duration.unit })
        }
        error={error}
        required
        disabled={disabled}
        unit={duration.unit}
      />
    </div>
  );
};

export default function AutoInvestBotForm({
  baseAsset,
  baseAssetQuantity,
  frequency,
  availableAssets,
  isLoadingAssets,
  quantityError,
  totalDurationError,
  durationPerShareError,
  onQuantityChange,
  onFrequencyChange,
  onUseAvailableAsset,
  numberOfShares,
  totalDuration,
  salePerShare,
  onNumberOfSharesChange,
  onTotalDurationChange,
  onSalePerShareChange,
}: AutoInvestBotFormProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-4">
      <div>
        <Input
          id="baseAssetQuantity"
          name="baseAssetQuantity"
          label={t("bots.form.totalQuantity")}
          value={baseAssetQuantity}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onQuantityChange(e.target.name, e.target.value)
          }
          error={quantityError}
          required
          disabled={isLoadingAssets}
          maxValue={availableAssets.find((a) => a.asset === baseAsset)?.free}
          onMaxClick={() => onUseAvailableAsset(baseAsset)}
          unit={baseAsset}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            id="numberOfShares"
            name="numberOfShares"
            label={t("bots.form.numberOfShares")}
            value={numberOfShares.toString()}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onNumberOfSharesChange(
                e.target.name,
                parseInt(e.target.value, 10)
              )
            }
            required
            disabled={isLoadingAssets}
          />
        </div>
        <DurationField
          id="totalDuration"
          name="totalDuration"
          label={t("bots.form.totalDuration")}
          duration={totalDuration}
          error={totalDurationError}
          onChange={onTotalDurationChange}
          disabled={isLoadingAssets}
        />
        <DurationField
          id="durationPerShare"
          name="frequency"
          label={t("bots.form.frequency")}
          duration={frequency}
          error={durationPerShareError}
          onChange={onFrequencyChange}
          disabled={isLoadingAssets}
        />
        <div>
          <Input
            id="salePerShare"
            name="salePerShare"
            label={t("bots.form.salePerShare")}
            value={salePerShare}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onSalePerShareChange(e.target.name, e.target.value)
            }
            required
            disabled={isLoadingAssets}
          />
        </div>
      </div>
    </div>
  );
}
