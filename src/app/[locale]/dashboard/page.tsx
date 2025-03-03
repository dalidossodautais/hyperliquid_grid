"use client";

import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import LanguageSelector from "@/components/LanguageSelector";

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

export default function Dashboard() {
  const { data: session, status } = useSession();
  const t = useTranslations("dashboard");
  const [connections, setConnections] = useState<CCXTConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<ConnectionFormData>({
    name: "",
    exchange: "",
    apiKey: "",
    apiSecret: "",
  });

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
              <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
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
              <h2 className="text-2xl font-bold">{t("ccxt.title")}</h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {showAddForm ? t("ccxt.cancelButton") : t("ccxt.addButton")}
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {showAddForm && (
              <form onSubmit={handleSubmit} className="mb-6 space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("ccxt.form.name")}
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="exchange"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("ccxt.form.exchange")}
                  </label>
                  <input
                    type="text"
                    id="exchange"
                    value={formData.exchange}
                    onChange={(e) =>
                      setFormData({ ...formData, exchange: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="apiKey"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("ccxt.form.apiKey")}
                  </label>
                  <input
                    type="text"
                    id="apiKey"
                    value={formData.apiKey}
                    onChange={(e) =>
                      setFormData({ ...formData, apiKey: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="apiSecret"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("ccxt.form.apiSecret")}
                  </label>
                  <input
                    type="password"
                    id="apiSecret"
                    value={formData.apiSecret}
                    onChange={(e) =>
                      setFormData({ ...formData, apiSecret: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t("ccxt.form.submit")}
                </button>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("ccxt.table.name")}
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("ccxt.table.exchange")}
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("ccxt.table.status")}
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("ccxt.table.createdAt")}
                    </th>
                    <th className="px-6 py-3 bg-gray-50"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {connections.map((connection) => (
                    <tr key={connection.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {connection.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(connection.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(connection.id)}
                          className="text-red-600 hover:text-red-900"
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
                        className="px-6 py-4 text-center text-sm text-gray-500"
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
