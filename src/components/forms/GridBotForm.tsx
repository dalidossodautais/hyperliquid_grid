import { useTranslations } from "next-intl";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import { Asset } from "./types";

interface GridBotFormProps {
  baseAsset: string;
  quoteAsset: string;
  baseAssetQuantity: string;
  quoteAssetQuantity: string;
  availableAssets: Asset[];
  isLoadingAssets: boolean;
  error?: string;
  onQuantityChange: (name: string, value: string) => void;
  onUseAvailableAsset: (asset: string, type: "base" | "quote") => void;
}

export default function GridBotForm({
  baseAsset,
  quoteAsset,
  baseAssetQuantity,
  quoteAssetQuantity,
  availableAssets,
  isLoadingAssets,
  error,
  onQuantityChange,
  onUseAvailableAsset,
}: GridBotFormProps) {
  const t = useTranslations("dashboard");

  return (
    <Label title={t("bots.form.quantity")} required>
      <div className="grid grid-cols-2 gap-4">
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
              onMaxClick={() => onUseAvailableAsset(baseAsset, "base")}
            />
          </div>
        </div>
        <div>
          <div className="relative">
            <Input
              id="quoteAssetQuantity"
              name="quoteAssetQuantity"
              label=""
              type="number"
              value={quoteAssetQuantity}
              onChange={(e) => onQuantityChange(e.target.name, e.target.value)}
              error={error}
              required
              min={0}
              step={0.00000001}
              unit={quoteAsset}
              disabled={isLoadingAssets}
              maxValue={
                availableAssets.find((a) => a.asset === quoteAsset)?.free
              }
              onMaxClick={() => onUseAvailableAsset(quoteAsset, "quote")}
            />
          </div>
        </div>
      </div>
    </Label>
  );
}
