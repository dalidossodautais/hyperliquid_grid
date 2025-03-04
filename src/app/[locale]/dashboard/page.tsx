"use client";

import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import LanguageSelector from "@/components/LanguageSelector";
import Modal from "@/components/Modal";

interface ExchangeConnection {
  id: string;
  name: string;
  exchange: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assets?: Asset[];
}

interface Asset {
  asset: string;
  total: number;
  free: number;
  used: number;
  usdValue?: number;
}

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

const formatAssetValue = (value: number): string => {
  if (value === 0) return "0";
  if (value < 0.00000001) return "<0.00000001";
  if (value < 0.0001) return value.toFixed(8);
  if (value < 0.01) return value.toFixed(6);
  if (value < 1) return value.toFixed(4);
  if (value < 1000) return value.toFixed(2);
  return value.toFixed(2);
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const t = useTranslations("dashboard");
  const [connections, setConnections] = useState<ExchangeConnection[]>([]);
  const [exchanges, setExchanges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<ConnectionFormData>({
    name: "",
    exchange: "",
    key: "",
    secret: "",
    apiWalletAddress: "",
    apiPrivateKey: "",
  });
  const [expandedConnections, setExpandedConnections] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const fetchExchanges = async () => {
      try {
        const response = await fetch("/api/exchanges");
        if (!response.ok) {
          throw new Error("Failed to fetch exchanges");
        }
        const data = await response.json();
        setExchanges(data);
      } catch (error) {
        console.error("Error fetching exchanges:", error);
      }
    };

    fetchExchanges();
  }, []);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        if (!session?.user) {
          return;
        }

        const response = await fetch("/api/ccxt");
        const data = await response.json();

        if (!response.ok) {
          if (data.redirect) {
            window.location.href = data.redirect;
            return;
          }
          throw new Error(t(`ccxt.errors.${data.code}`));
        }

        setConnections(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(t("ccxt.errors.INTERNAL_ERROR"));
        }
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchConnections();
    }
  }, [session, t]);

  // Fonction pour charger les assets d'une connexion
  const fetchAssets = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/ccxt/assets?id=${connectionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch assets");
      }
      const data = await response.json();
      return data.assets;
    } catch {
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch("/api/ccxt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.redirect) {
          window.location.href = data.redirect;
          return;
        }
        if (data.message) {
          throw new Error(`${t(`ccxt.errors.${data.code}`)}: ${data.message}`);
        } else {
          throw new Error(t(`ccxt.errors.${data.code}`));
        }
      }

      setConnections((prev) => [...prev, data]);
      setShowAddForm(false);
      setFormData({
        name: "",
        exchange: "",
        key: "",
        secret: "",
        apiWalletAddress: "",
        apiPrivateKey: "",
      });
    } catch (error) {
      console.error("Detailed error:", error);
      setError(
        error instanceof Error ? error.message : t("ccxt.errors.INTERNAL_ERROR")
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/ccxt?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.redirect) {
          window.location.href = data.redirect;
          return;
        }
        if (data.message) {
          throw new Error(`${t(`ccxt.errors.${data.code}`)}: ${data.message}`);
        } else {
          throw new Error(t(`ccxt.errors.${data.code}`));
        }
      }

      setConnections((prev) => prev.filter((conn) => conn.id !== id));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : t("ccxt.errors.INTERNAL_ERROR")
      );
      console.error("Delete error:", error);
    }
  };

  // Fonction de validation du formulaire qui retourne les erreurs
  const validateForm = (data: ConnectionFormData): FormErrors => {
    const errors: FormErrors = {};

    // Validation des champs requis
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

    // Validation spécifique selon le type d'exchange
    if (data.exchange.toLowerCase() === "hyperliquid") {
      // Pour Hyperliquid, vérifier que les deux champs API sont soit tous deux remplis, soit tous deux vides
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
  };

  // Vérifier si le formulaire est valide
  const isFormValid = () => {
    const errors = validateForm(formData);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Mettre à jour les données du formulaire
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);

    // Réinitialiser toutes les erreurs
    setFormErrors({});

    // Valider le formulaire et mettre à jour les erreurs
    const errors = validateForm(updatedFormData);
    setFormErrors(errors);
  };

  const toggleConnectionExpand = async (connectionId: string) => {
    const newExpandedConnections = new Set(expandedConnections);
    if (newExpandedConnections.has(connectionId)) {
      newExpandedConnections.delete(connectionId);
    } else {
      newExpandedConnections.add(connectionId);
      const assets = await fetchAssets(connectionId);
      setConnections((prev) =>
        prev.map((conn) =>
          conn.id === connectionId ? { ...conn, assets } : conn
        )
      );
    }
    setExpandedConnections(newExpandedConnections);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800">{t("title")}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-800">
                {t("welcome", {
                  name: session.user.name || session.user.email,
                })}
              </span>
              <div className="h-10">
                <LanguageSelector />
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/signin" })}
                className="h-10 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
              >
                {t("signout")}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {t("ccxt.title")}
              </h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
              >
                {t("ccxt.addButton")}
              </button>
            </div>

            <Modal
              isOpen={showAddForm}
              onClose={() => {
                setShowAddForm(false);
                setFormData({
                  name: "",
                  exchange: "",
                  key: "",
                  secret: "",
                  apiWalletAddress: "",
                  apiPrivateKey: "",
                });
                setFormErrors({});
                setError(null);
              }}
              title={t("ccxt.form.title")}
            >
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
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.name}
                    </p>
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
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.exchange}
                    </p>
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
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.key}
                    </p>
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
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.secret}
                      </p>
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
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormData({
                        name: "",
                        exchange: "",
                        key: "",
                        secret: "",
                        apiWalletAddress: "",
                        apiPrivateKey: "",
                      });
                      setFormErrors({});
                      setError(null);
                    }}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
                  >
                    {t("ccxt.form.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid()}
                    className={`w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      !isFormValid()
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-blue-700 cursor-pointer"
                    }`}
                  >
                    {t("ccxt.form.submit")}
                  </button>
                </div>
              </form>
            </Modal>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-black uppercase tracking-wider">
                      {t("ccxt.table.name")}
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-black uppercase tracking-wider">
                      {t("ccxt.table.exchange")}
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-black uppercase tracking-wider">
                      {t("ccxt.table.status")}
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-black uppercase tracking-wider">
                      {t("ccxt.table.createdAt")}
                    </th>
                    <th className="px-6 py-3 bg-gray-50"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {connections.map((connection) => (
                    <tr key={connection.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {connection.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {connection.exchange}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            connection.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {connection.isActive
                            ? t("ccxt.table.active")
                            : t("ccxt.table.inactive")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {new Date(connection.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-4">
                          <button
                            onClick={() =>
                              toggleConnectionExpand(connection.id)
                            }
                            className="text-blue-600 hover:text-blue-900 cursor-pointer"
                          >
                            {expandedConnections.has(connection.id)
                              ? t("ccxt.table.hideAssets")
                              : t("ccxt.table.showAssets")}
                          </button>
                          <button
                            onClick={() => handleDelete(connection.id)}
                            className="text-red-600 hover:text-red-900 cursor-pointer"
                          >
                            {t("ccxt.table.delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {connections.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-center text-sm text-black"
                      >
                        {t("ccxt.table.noConnections")}
                      </td>
                    </tr>
                  )}

                  {connections.map(
                    (connection) =>
                      expandedConnections.has(connection.id) && (
                        <tr key={`assets-${connection.id}`}>
                          <td colSpan={5} className="px-6 py-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex justify-between items-center mb-4">
                                <div>
                                  <h3 className="text-lg font-medium text-gray-900">
                                    {t("ccxt.assets.title")}
                                  </h3>
                                </div>
                              </div>
                              {connection.assets &&
                                connection.assets.length > 0 && (
                                  <div className="mb-4 text-right text-sm font-medium text-gray-900">
                                    {t("ccxt.assets.totalValue")}: $
                                    {connection.assets
                                      .reduce((sum, asset) => {
                                        if (asset.asset === "USDC") {
                                          return sum + asset.total;
                                        }
                                        return sum + (asset.usdValue || 0);
                                      }, 0)
                                      .toFixed(2)}
                                  </div>
                                )}
                              {connection.assets &&
                              connection.assets.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                      <tr>
                                        <th className="px-4 py-2 bg-gray-100 text-left text-xs font-medium text-black uppercase tracking-wider">
                                          {t("ccxt.assets.asset")}
                                        </th>
                                        <th className="px-4 py-2 bg-gray-100 text-right text-xs font-medium text-black uppercase tracking-wider">
                                          {t("ccxt.assets.total")}
                                        </th>
                                        <th className="px-4 py-2 bg-gray-100 text-right text-xs font-medium text-black uppercase tracking-wider">
                                          {t("ccxt.assets.free")}
                                        </th>
                                        <th className="px-4 py-2 bg-gray-100 text-right text-xs font-medium text-black uppercase tracking-wider">
                                          {t("ccxt.assets.used")}
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {connection.assets
                                        .filter((asset) => asset.total > 0)
                                        .map((asset, index) => (
                                          <tr
                                            key={`${connection.id}-${asset.asset}-${index}`}
                                          >
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-black">
                                              {asset.asset}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-black">
                                              {formatAssetValue(asset.total)}
                                              {asset.usdValue &&
                                                asset.total > 0 &&
                                                ` ($${asset.usdValue.toFixed(
                                                  2
                                                )})`}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-black">
                                              {formatAssetValue(asset.free)}
                                              {asset.usdValue &&
                                                asset.free > 0 &&
                                                ` ($${(
                                                  asset.free *
                                                  (asset.usdValue / asset.total)
                                                ).toFixed(2)})`}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-black">
                                              {formatAssetValue(asset.used)}
                                              {asset.usdValue &&
                                                asset.used > 0 &&
                                                ` ($${(
                                                  asset.used *
                                                  (asset.usdValue / asset.total)
                                                ).toFixed(2)})`}
                                            </td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-center text-gray-500">
                                  {t("ccxt.assets.noAssets")}
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
