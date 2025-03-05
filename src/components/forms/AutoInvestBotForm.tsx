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
      <div>
        <DurationInput
          id="frequency"
          name="frequency"
          label={t("bots.form.frequency")}
          value={frequencyValue}
          unit={frequencyUnit}
          onChange={onFrequencyChange}
          error={frequencyError}
          required
          disabled={isLoadingAssets}
        />
      </div>
    </div>
  );
}
