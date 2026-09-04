"use client";

import { useEffect, useState } from "react";

export default function BotHealthPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadHealth() {
    try {
      setLoading(true);

      const response = await fetch("/api/bot-health", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load bot health.");
      }

      setHealth(data);
    } catch (error) {
      console.error(error);

      setHealth({
        success: false,
        configured: false,
        online: null,
        status: "error",
        message: "Unable to load bot health information.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Bot Health</h1>

        <p className="page-description">
          Monitor the status of Pixel Villa Support.
        </p>
      </div>

      {loading ? (
        <div className="glass-card p-6">
          <p className="text-gray-400">Checking bot health...</p>
        </div>
      ) : (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Bot Status
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                {health?.message || "No status available."}
              </p>
            </div>

            <div
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                health?.status === "not_configured"
                  ? "bg-yellow-500/10 text-yellow-400"
                  : health?.online === true
                    ? "bg-green-500/10 text-green-400"
                    : health?.status === "error"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-gray-500/10 text-gray-400"
              }`}
            >
              {health?.status === "not_configured"
                ? "Not Configured"
                : health?.online === true
                  ? "Online"
                  : health?.status === "error"
                    ? "Error"
                    : "Unavailable"}
            </div>
          </div>
        </div>
      )}

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white">
          Health Monitoring
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-400">
          Automatic bot health monitoring is currently not configured.
          The dashboard will not incorrectly report the bot as offline.
        </p>

        <button
          onClick={loadHealth}
          disabled={loading}
          className="mt-4 rounded-lg bg-[#5865F2] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#6975F5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Checking..." : "Refresh"}
        </button>
      </div>
    </div>
  );
}