"use client";

import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import LanguageSelector from "@/components/LanguageSelector";
import Modal from "@/components/Modal";
import ConnectionForm from "@/components/forms/ConnectionForm";
import ConnectionsTable from "@/components/tables/ConnectionsTable";
import BotForm from "@/components/forms/BotForm";
import BotsTable from "@/components/tables/BotsTable";
import DashboardGrid from "@/components/ui/DashboardGrid";
import { DashboardCard } from "@/components/ui/DashboardGrid";

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

interface Bot {
  id: string;
  name: string;
  type: string;
  status: "running" | "stopped" | "error";
  createdAt: string;
  updatedAt: string;
  config: {
    baseAsset: string;
    quoteAsset: string;
    baseAssetQuantity: number;
    quoteAssetQuantity: number;
  } | null;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const t = useTranslations("dashboard");
  const [connections, setConnections] = useState<ExchangeConnection[]>([]);
  const [exchanges, setExchanges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [bots, setBots] = useState<Bot[]>([]);
  const [showBotForm, setShowBotForm] = useState(false);

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
        const contentType = response.headers.get("content-type");

        if (response.redirected) {
          window.location.href = response.url;
          return;
        }

        if (!contentType || !contentType.includes("application/json")) {
          const textContent = await response.text();
          console.error("Non-JSON response received:", textContent);
          throw new Error(
            "Server returned non-JSON response. Please check your authentication."
          );
        }

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
        console.error("Error fetching connections:", error);
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

  useEffect(() => {
    const fetchBots = async () => {
      try {
        if (!session?.user) {
          return;
        }

        const response = await fetch("/api/bots");
        const contentType = response.headers.get("content-type");

        if (response.redirected) {
          window.location.href = response.url;
          return;
        }

        if (!contentType || !contentType.includes("application/json")) {
          const textContent = await response.text();
          console.error("Non-JSON response received for bots:", textContent);
          throw new Error(
            "Server returned non-JSON response for bots. Please check your authentication."
          );
        }

        const data = await response.json();

        if (!response.ok) {
          if (data.redirect) {
            window.location.href = data.redirect;
            return;
          }
          const errorMessage = t(`bots.errors.${data.code}`, {
            fallback: data.message || "Une erreur est survenue",
          });
          throw new Error(errorMessage);
        }

        setBots(data);
      } catch (error) {
        console.error("Error fetching bots:", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(t("bots.errors.INTERNAL_ERROR"));
        }
      }
    };

    if (session?.user) {
      fetchBots();
    }
  }, [session, t]);

  const fetchAssets = async (connectionId: string) => {
    try {
      const response = await fetch(
        `/api/ccxt/assets?id=${connectionId}&all=true`
      );
      const contentType = response.headers.get("content-type");

      if (response.redirected) {
        window.location.href = response.url;
        return [];
      }

      if (!contentType || !contentType.includes("application/json")) {
        const textContent = await response.text();
        console.error("Non-JSON response received for assets:", textContent);
        throw new Error(
          "Server returned non-JSON response for assets. Please check your authentication."
        );
      }

      if (!response.ok) {
        throw new Error("Failed to fetch assets");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching assets:", error);
      return [];
    }
  };

  const fetchSymbols = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/ccxt/symbols?id=${connectionId}`);
      const contentType = response.headers.get("content-type");

      if (response.redirected) {
        window.location.href = response.url;
        return [];
      }

      if (!contentType || !contentType.includes("application/json")) {
        const textContent = await response.text();
        console.error("Non-JSON response received for symbols:", textContent);
        throw new Error(
          "Server returned non-JSON response for symbols. Please check your authentication."
        );
      }

      if (!response.ok) {
        throw new Error("Failed to fetch symbols");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching symbols:", error);
      return [];
    }
  };

  const handleConnectionSubmit = async (formData: {
    name: string;
    exchange: string;
    key: string;
    secret: string;
    apiWalletAddress: string;
    apiPrivateKey: string;
  }) => {
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
      setError(null);
    } catch (error) {
      console.error("Detailed error:", error);
      setError(
        error instanceof Error ? error.message : t("ccxt.errors.INTERNAL_ERROR")
      );
    }
  };

  const handleConnectionDelete = async (id: string) => {
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

  const handleBotSubmit = async (data: {
    name: string;
    connectionId: string;
    baseAsset: string;
    quoteAsset: string;
    baseAssetQuantity: number;
    quoteAssetQuantity: number;
  }) => {
    try {
      const response = await fetch("/api/bots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          type: "dca",
          connectionId: data.connectionId,
          config: {
            baseAsset: data.baseAsset,
            quoteAsset: data.quoteAsset,
            baseAssetQuantity: data.baseAssetQuantity,
            quoteAssetQuantity: data.quoteAssetQuantity,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create bot");
      }

      const newBot = await response.json();
      setBots((prev) => [...prev, newBot]);
      setShowBotForm(false);
      setError(null);
    } catch (error) {
      console.error("Error creating bot:", error);
      setError(
        error instanceof Error ? error.message : t("bots.errors.INTERNAL_ERROR")
      );
    }
  };

  const handleBotDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/bots?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.redirect) {
          window.location.href = data.redirect;
          return;
        }
        if (data.message) {
          throw new Error(`${t(`bots.errors.${data.code}`)}: ${data.message}`);
        } else {
          throw new Error(t(`bots.errors.${data.code}`));
        }
      }

      setBots((prev) => prev.filter((bot) => bot.id !== id));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : t("bots.errors.INTERNAL_ERROR")
      );
      console.error("Delete error:", error);
    }
  };

  const handleUpdateConnection = (connectionId: string, assets: Asset[]) => {
    setConnections((prev) =>
      prev.map((conn) =>
        conn.id === connectionId ? { ...conn, assets } : conn
      )
    );
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
        <DashboardGrid>
          <DashboardCard
            title={t("ccxt.title")}
            actions={
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
              >
                {t("ccxt.addButton")}
              </button>
            }
            className="col-span-full"
          >
            <Modal
              isOpen={showAddForm}
              onClose={() => {
                setShowAddForm(false);
                setError(null);
              }}
              title={t("ccxt.form.title")}
            >
              <ConnectionForm
                onSubmit={handleConnectionSubmit}
                onCancel={() => {
                  setShowAddForm(false);
                  setError(null);
                }}
                exchanges={exchanges}
                error={error}
              />
            </Modal>

            <ConnectionsTable
              connections={connections}
              onDelete={handleConnectionDelete}
              onFetchAssets={fetchAssets}
              onUpdateConnection={handleUpdateConnection}
            />
          </DashboardCard>

          <DashboardCard
            title={t("bots.title")}
            actions={
              <button
                onClick={() => setShowBotForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
              >
                {t("bots.addButton")}
              </button>
            }
            className="col-span-full"
          >
            <Modal
              isOpen={showBotForm}
              onClose={() => {
                setShowBotForm(false);
                setError(null);
              }}
              title={t("bots.form.title")}
            >
              <BotForm
                onSubmit={handleBotSubmit}
                onCancel={() => {
                  setShowBotForm(false);
                  setError(null);
                }}
                connections={connections}
                error={error}
                onFetchSymbols={fetchSymbols}
                onFetchAssets={fetchAssets}
              />
            </Modal>

            <BotsTable bots={bots} onDelete={handleBotDelete} />
          </DashboardCard>
        </DashboardGrid>
      </main>
    </div>
  );
}
