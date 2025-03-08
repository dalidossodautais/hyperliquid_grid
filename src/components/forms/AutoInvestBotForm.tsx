import { useTranslations } from "next-intl";
import Input from "@/components/ui/Input";
import DurationInput from "@/components/ui/DurationInput";
import { Asset } from "./types";

interface AutoInvestBotFormProps {
  baseAsset: string;
  baseAssetQuantity: string;
  frequencyValue: string;
  frequencyUnit: string;
  availableAssets: Asset[];
  isLoadingAssets: boolean;
  quantityError?: string;
  frequencyError?: string;
  onQuantityChange: (name: string, value: string) => void;
  onFrequencyChange: (name: string, value: string) => void;
  onUseAvailableAsset: (asset: string) => void;
  numberOfShares: number;
  totalDuration: string;
  salePerShare: string;
  onNumberOfSharesChange: (name: string, value: number) => void;
  onTotalDurationChange: (name: string, value: string) => void;
  onSalePerShareChange: (name: string, value: string) => void;
  totalDurationUnit: string;
}

export default function AutoInvestBotForm({
  baseAsset,
  baseAssetQuantity,
  frequencyValue,
  frequencyUnit,
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
  totalDurationUnit,
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
            value={totalDuration}
            onChange={onTotalDurationChange}
            required
            disabled={isLoadingAssets}
            unit={totalDurationUnit}
          />
        </div>
        <div>
          <DurationInput
            id="durationPerShare"
            name="frequency"
            label={t("bots.form.durationPerShare")}
            value={frequencyValue}
            onChange={onFrequencyChange}
            error={frequencyError}
            required
            disabled={isLoadingAssets}
            unit={frequencyUnit}
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
