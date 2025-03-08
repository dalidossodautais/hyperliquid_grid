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
  frequencyError?: string;
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

export default function AutoInvestBotForm({
  baseAsset,
  baseAssetQuantity,
  frequency,
  availableAssets,
  isLoadingAssets,
  quantityError,
  frequencyError,
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
        <div>
          <DurationInput
            id="totalDuration"
            name="totalDuration"
            label={t("bots.form.totalDuration")}
            value={totalDuration.value}
            onChange={(name, value) =>
              onTotalDurationChange(name, { value, unit: totalDuration.unit })
            }
            required
            disabled={isLoadingAssets}
            unit={totalDuration.unit}
          />
        </div>
        <div>
          <DurationInput
            id="durationPerShare"
            name="frequency"
            label={t("bots.form.durationPerShare")}
            value={frequency.value}
            onChange={(name, value, unit) => {
              if (name === "frequency" && unit) {
                onFrequencyChange(name, { value, unit });
              } else {
                onFrequencyChange(name, {
                  value,
                  unit: unit || frequency.unit,
                });
              }
            }}
            error={frequencyError}
            required
            disabled={isLoadingAssets}
            unit={frequency.unit}
          />
        </div>
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
