import { useTranslations } from "next-intl";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import { Asset } from "./types";

interface AutoInvestBotFormProps {
  baseAsset: string;
  baseAssetQuantity: string;
  availableAssets: Asset[];
  isLoadingAssets: boolean;
  error?: string;
  onQuantityChange: (name: string, value: string) => void;
  onUseAvailableAsset: (asset: string) => void;
}

export default function AutoInvestBotForm({
  baseAsset,
  baseAssetQuantity,
  availableAssets,
  isLoadingAssets,
  error,
  onQuantityChange,
  onUseAvailableAsset,
}: AutoInvestBotFormProps) {
  const t = useTranslations("dashboard");

  return (
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
              onChange={(e) => onQuantityChange(e.target.name, e.target.value)}
              error={error}
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
  );
}
