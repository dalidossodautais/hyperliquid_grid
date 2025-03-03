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
}

interface ConnectionFormData {
  name: string;
  exchange: string;
  key: string;
  secret: string;
}

interface FormErrors {
  name?: string;
  exchange?: string;
  key?: string;
  secret?: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const t = useTranslations("dashboard");
  const [connections, setConnections] = useState<ExchangeConnection[]>([]);
  const [exchanges, setExchanges] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<ConnectionFormData>({
    name: "",
    exchange: "",
    key: "",
    secret: "",
  });
  const [expandedConnection, setExpandedConnection] = useState<string | null>(
    null
  );
  const [loadingAssets, setLoadingAssets] = useState<string | null>(null);

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
          console.log("No session or user found");
          return;
        }

        const response = await fetch("/api/ccxt");
        const data = await response.json();

        if (!response.ok) {
          console.error("Error response:", data);
          if (data.redirect) {
            window.location.href = data.redirect;
            return;
          }
          throw new Error(t(`ccxt.errors.${data.code}`));
        }

        setConnections(data);
      } catch (error) {
        console.error("Detailed fetch error:", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(t("ccxt.errors.INTERNAL_ERROR"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchConnections();
    }
  }, [session, t]);

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

  // Validation des champs
  const validateForm = (data: ConnectionFormData): FormErrors => {
    const errors: FormErrors = {};

    if (!data.name.trim()) {
      errors.name = t("ccxt.form.errors.nameRequired");
    } else if (data.name.length < 3) {
      errors.name = t("ccxt.form.errors.nameLength");
    }

    if (!data.exchange) {
      errors.exchange = t("ccxt.form.errors.exchangeRequired");
    }

    if (!data.key.trim()) {
      errors.key = t("ccxt.form.errors.apiKeyRequired");
    }

    if (!data.secret.trim()) {
      errors.secret = t("ccxt.form.errors.apiSecretRequired");
    }

    return errors;
  };

  // Vérifier si le formulaire est valide
  const isFormValid = (): boolean => {
    const errors = validateForm(formData);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Valider le champ modifié
    const errors = validateForm({ ...formData, [name]: value });
    setFormErrors((prev) => ({
      ...prev,
      [name]: errors[name as keyof FormErrors],
    }));
  };

  const fetchAssets = async (connectionId: string) => {
    try {
      console.log("Fetching assets for connection:", connectionId);
      setLoadingAssets(connectionId);
      const response = await fetch(`/api/ccxt/assets?id=${connectionId}`);
      const data = await response.json();

      console.log("Assets response:", data);

      if (!response.ok) {
        console.error("Error response:", data);
        throw new Error(t(`ccxt.errors.${data.code}`));
      }

      setConnections((prevConnections) =>
        prevConnections.map((conn) =>
          conn.id === connectionId ? { ...conn, assets: data } : conn
        )
      );

      console.log("Updated connections:", connections);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoadingAssets(null);
    }
  };

  const toggleConnectionExpand = (connectionId: string) => {
    if (expandedConnection === connectionId) {
      setExpandedConnection(null);
    } else {
      setExpandedConnection(connectionId);
      const connection = connections.find((conn) => conn.id === connectionId);
      if (connection && !connection.assets) {
        fetchAssets(connectionId);
      }
    }
  };

  if (status === "loading" || isLoading) {
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
                    {t("ccxt.form.apiKey")}
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
                            {expandedConnection === connection.id
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
                      expandedConnection === connection.id && (
                        <tr key={`assets-${connection.id}`}>
                          <td colSpan={5} className="px-6 py-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {t("ccxt.assets.title")}
                              </h3>
                              {loadingAssets === connection.id ? (
                                <div className="flex justify-center py-4">
                                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
                                </div>
                              ) : connection.assets &&
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
                                      {connection.assets.map((asset, index) => (
                                        <tr
                                          key={`${connection.id}-${asset.asset}-${index}`}
                                        >
                                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-black">
                                            {asset.asset}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-black">
                                            {asset.total.toFixed(8)}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-black">
                                            {asset.free.toFixed(8)}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-black">
                                            {asset.used.toFixed(8)}
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
