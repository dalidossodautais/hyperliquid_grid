"use client";

import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import LanguageSelector from "@/components/LanguageSelector";
import Modal from "@/components/Modal";

interface CCXTConnection {
  id: string;
  name: string;
  exchange: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ConnectionFormData {
  name: string;
  exchange: string;
  apiKey: string;
  apiSecret: string;
}

interface FormErrors {
  name?: string;
  exchange?: string;
  apiKey?: string;
  apiSecret?: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const t = useTranslations("dashboard");
  const [connections, setConnections] = useState<CCXTConnection[]>([]);
  const [exchanges, setExchanges] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<ConnectionFormData>({
    name: "",
    exchange: "",
    apiKey: "",
    apiSecret: "",
  });

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
        const response = await fetch("/api/ccxt");
        if (!response.ok) {
          throw new Error(t("ccxt.errors.fetchFailed"));
        }
        const data = await response.json();
        setConnections(data);
      } catch (error) {
        setError(t("ccxt.errors.fetchFailed"));
        console.error(error);
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("ccxt.errors.createFailed"));
      }

      const newConnection = await response.json();
      setConnections((prev) => [...prev, newConnection]);
      setShowAddForm(false);
      setFormData({
        name: "",
        exchange: "",
        apiKey: "",
        apiSecret: "",
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : t("ccxt.errors.createFailed")
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/ccxt?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(t("ccxt.errors.deleteFailed"));
      }

      setConnections((prev) => prev.filter((conn) => conn.id !== id));
    } catch (error) {
      setError(t("ccxt.errors.deleteFailed"));
      console.error(error);
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

    if (!data.apiKey.trim()) {
      errors.apiKey = t("ccxt.form.errors.apiKeyRequired");
    }

    if (!data.apiSecret.trim()) {
      errors.apiSecret = t("ccxt.form.errors.apiSecretRequired");
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

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Modal
              isOpen={showAddForm}
              onClose={() => {
                setShowAddForm(false);
                setFormData({
                  name: "",
                  exchange: "",
                  apiKey: "",
                  apiSecret: "",
                });
                setFormErrors({});
                setError(null);
              }}
              title={t("ccxt.form.title")}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    htmlFor="apiKey"
                    className="block text-sm font-medium text-gray-800"
                  >
                    {t("ccxt.form.apiKey")}
                  </label>
                  <input
                    type="text"
                    id="apiKey"
                    name="apiKey"
                    value={formData.apiKey}
                    onChange={handleInputChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black [color:black]"
                    required
                  />
                  {formErrors.apiKey && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.apiKey}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="apiSecret"
                    className="block text-sm font-medium text-gray-800"
                  >
                    {t("ccxt.form.apiSecret")}
                  </label>
                  <input
                    type="password"
                    id="apiSecret"
                    name="apiSecret"
                    value={formData.apiSecret}
                    onChange={handleInputChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black [color:black]"
                    required
                  />
                  {formErrors.apiSecret && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.apiSecret}
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
                        apiKey: "",
                        apiSecret: "",
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
                        <button
                          onClick={() => handleDelete(connection.id)}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                        >
                          {t("ccxt.table.delete")}
                        </button>
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
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
