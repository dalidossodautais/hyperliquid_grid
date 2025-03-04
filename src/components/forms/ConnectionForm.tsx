import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

interface ConnectionFormData {
  name: string;
  exchange: string;
  key: string;
  secret: string;
  apiWalletAddress: string;
  apiPrivateKey: string;
}

interface FormErrors {
  name?: string;
  exchange?: string;
  key?: string;
  secret?: string;
  apiWalletAddress?: string;
  apiPrivateKey?: string;
}

interface ConnectionFormProps {
  onSubmit: (data: ConnectionFormData) => Promise<void>;
  onCancel: () => void;
  exchanges: string[];
  error: string | null;
}

export default function ConnectionForm({
  onSubmit,
  onCancel,
  exchanges,
  error,
}: ConnectionFormProps) {
  const t = useTranslations("dashboard");
  const [formData, setFormData] = useState<ConnectionFormData>({
    name: "",
    exchange: "",
    key: "",
    secret: "",
    apiWalletAddress: "",
    apiPrivateKey: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isFormValid, setIsFormValid] = useState(false);

  const validateForm = useCallback(
    (data: ConnectionFormData): FormErrors => {
      const errors: FormErrors = {};

      if (!data.name) {
        errors.name = t("ccxt.form.errors.nameRequired");
      } else if (data.name.length < 3) {
        errors.name = t("ccxt.form.errors.nameLength");
      }

      if (!data.exchange) {
        errors.exchange = t("ccxt.form.errors.exchangeRequired");
      }

      if (!data.key) {
        errors.key = t("ccxt.form.errors.apiKeyRequired");
      }

      if (data.exchange.toLowerCase() === "hyperliquid") {
        if (data.apiWalletAddress && !data.apiPrivateKey) {
          errors.apiPrivateKey = t("ccxt.form.errors.apiPrivateKeyRequired");
        } else if (!data.apiWalletAddress && data.apiPrivateKey) {
          errors.apiWalletAddress = t(
            "ccxt.form.errors.apiWalletAddressRequired"
          );
        }
      } else if (!data.secret) {
        errors.secret = t("ccxt.form.errors.apiSecretRequired");
      }

      return errors;
    },
    [t]
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);
    setFormErrors({});
    const errors = validateForm(updatedFormData);
    setFormErrors(errors);
    setIsFormValid(Object.keys(errors).length === 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    await onSubmit(formData);
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
        label={t("ccxt.form.name")}
        value={formData.name}
        onChange={handleInputChange}
        error={formErrors.name}
        required
      />
      <Select
        id="exchange"
        name="exchange"
        label={t("ccxt.form.exchange")}
        value={formData.exchange}
        onChange={handleInputChange}
        options={exchanges.map((exchange) => ({
          value: exchange,
          label: exchange.charAt(0).toUpperCase() + exchange.slice(1),
        }))}
        error={formErrors.exchange}
        required
        placeholder={t("ccxt.form.selectExchange")}
      />
      <Input
        id="key"
        name="key"
        label={
          formData.exchange.toLowerCase() === "hyperliquid"
            ? t("ccxt.form.walletAddress")
            : t("ccxt.form.apiKey")
        }
        value={formData.key}
        onChange={handleInputChange}
        error={formErrors.key}
        required
      />
      {formData.exchange.toLowerCase() !== "hyperliquid" && (
        <Input
          id="secret"
          name="secret"
          label={t("ccxt.form.apiSecret")}
          type="password"
          value={formData.secret}
          onChange={handleInputChange}
          error={formErrors.secret}
          required
        />
      )}
      {formData.exchange.toLowerCase() === "hyperliquid" && (
        <>
          <Input
            id="apiWalletAddress"
            name="apiWalletAddress"
            label={t("ccxt.form.apiWalletAddress")}
            value={formData.apiWalletAddress}
            onChange={handleInputChange}
            error={formErrors.apiWalletAddress}
            placeholder={t("ccxt.form.apiWalletAddressHelp")}
          />
          <Input
            id="apiPrivateKey"
            name="apiPrivateKey"
            label={t("ccxt.form.apiPrivateKey")}
            type="password"
            value={formData.apiPrivateKey}
            onChange={handleInputChange}
            error={formErrors.apiPrivateKey}
            placeholder={t("ccxt.form.apiPrivateKeyHelp")}
          />
        </>
      )}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={!isFormValid}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {t("create")}
        </button>
      </div>
    </form>
  );
}
