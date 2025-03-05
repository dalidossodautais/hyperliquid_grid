import { useTranslations } from "next-intl";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
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
      <Label title={t("bots.form.quantity")} required>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <div className="relative">
              <Input
                id="baseAssetQuantity"
                name="baseAssetQuantity"
                label=""
                type="number"
                value={baseAssetQuantity}
                onChange={(e) =>
                  onQuantityChange(e.target.name, e.target.value)
                }
                error={quantityError}
                required
                min={0}
                step={0.00000001}
                unit={baseAsset}
                disabled={isLoadingAssets}
                maxValue={
                  availableAssets.find((a) => a.asset === baseAsset)?.free
                }
                onMaxClick={() => onUseAvailableAsset(baseAsset)}
              />
            </div>
          </div>
        </div>
      </Label>

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
  );
}
