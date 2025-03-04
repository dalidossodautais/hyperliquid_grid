import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";

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
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-800"
        >
          {t("ccxt.form.name")}
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black [color:black]"
          required
        />
        {formErrors.name && (
          <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="exchange"
          className="block text-sm font-medium text-gray-800"
        >
          {t("ccxt.form.exchange")}
        </label>
        <select
          id="exchange"
          name="exchange"
          value={formData.exchange}
          onChange={handleInputChange}
          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black [color:black]"
          required
        >
          <option value="">{t("ccxt.form.selectExchange")}</option>
          {exchanges.map((exchange) => (
            <option key={exchange} value={exchange}>
              {exchange.charAt(0).toUpperCase() + exchange.slice(1)}
            </option>
          ))}
        </select>
        {formErrors.exchange && (
          <p className="mt-1 text-sm text-red-600">{formErrors.exchange}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="key"
          className="block text-sm font-medium text-gray-800"
        >
          {formData.exchange.toLowerCase() === "hyperliquid"
            ? t("ccxt.form.walletAddress")
            : t("ccxt.form.apiKey")}
        </label>
        <input
          type="text"
          id="key"
          name="key"
          value={formData.key}
          onChange={handleInputChange}
          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black [color:black]"
          required
        />
        {formErrors.key && (
          <p className="mt-1 text-sm text-red-600">{formErrors.key}</p>
        )}
      </div>
      {formData.exchange.toLowerCase() !== "hyperliquid" && (
        <div>
          <label
            htmlFor="secret"
            className="block text-sm font-medium text-gray-800"
          >
            {t("ccxt.form.apiSecret")}
          </label>
          <input
            type="password"
            id="secret"
            name="secret"
            value={formData.secret}
            onChange={handleInputChange}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black [color:black]"
            required
          />
          {formErrors.secret && (
            <p className="mt-1 text-sm text-red-600">{formErrors.secret}</p>
          )}
        </div>
      )}
      {formData.exchange.toLowerCase() === "hyperliquid" && (
        <>
          <div>
            <label
              htmlFor="apiWalletAddress"
              className="block text-sm font-medium text-gray-800"
            >
              {t("ccxt.form.apiWalletAddress")}
            </label>
            <input
              type="text"
              id="apiWalletAddress"
              name="apiWalletAddress"
              value={formData.apiWalletAddress}
              onChange={handleInputChange}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black [color:black]"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t("ccxt.form.apiWalletAddressHelp")}
            </p>
            {formErrors.apiWalletAddress && (
              <p className="mt-1 text-sm text-red-600">
                {formErrors.apiWalletAddress}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="apiPrivateKey"
              className="block text-sm font-medium text-gray-800"
            >
              {t("ccxt.form.apiPrivateKey")}
            </label>
            <input
              type="password"
              id="apiPrivateKey"
              name="apiPrivateKey"
              value={formData.apiPrivateKey}
              onChange={handleInputChange}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black [color:black]"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t("ccxt.form.apiPrivateKeyHelp")}
            </p>
            {formErrors.apiPrivateKey && (
              <p className="mt-1 text-sm text-red-600">
                {formErrors.apiPrivateKey}
              </p>
            )}
          </div>
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
