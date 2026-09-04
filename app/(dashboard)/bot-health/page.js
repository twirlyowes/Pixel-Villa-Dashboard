"use client";

import { useEffect, useState } from "react";

function formatUptime(seconds) {
  const total = Number(seconds) || 0;

  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  const parts = [];

  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes || parts.length === 0) parts.push(`${minutes}m`);

  return parts.join(" ");
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

export default function BotHealthPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadHealth() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/bot-health", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Failed to load bot health."
        );
      }

      setHealth(result);
    } catch (err) {
      setError(
        err.message || "Failed to load bot health."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHealth();

    const interval = setInterval(loadHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const bot =
    health?.bot ||
    health?.data ||
    health ||
    {};

  const online =
    bot.online ??
    bot.connected ??
    bot.status === "online" ??
    false;

  const guilds =
    bot.guilds ??
    bot.servers ??
    bot.serverCount ??
    0;

  const users =
    bot.users ??
    bot.userCount ??
    bot.members ??
    0;

  const latency =
    bot.latency ??
    bot.ping ??
    0;

  const uptime =
    bot.uptime ??
    bot.uptimeSeconds ??
    0;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="status-pill">
            <span
              className="status-dot"
              style={{
                background: online
                  ? "#22c55e"
                  : "#ef4444",
              }}
            />
            {online ? "System Online" : "System Offline"}
          </div>

          <h1 className="page-title">
            Bot <span className="gradient-text">Health</span>
          </h1>

          <p className="page-subtitle">
            Monitor the current status of Pixel Villa
            Support.
          </p>
        </div>

        <button
          type="button"
          className="glass-button"
          onClick={loadHealth}
          disabled={loading}
        >
          {loading ? "Checking..." : "↻ Refresh"}
        </button>
      </div>

      {error && (
        <div
          className="glass-panel"
          style={{ marginBottom: 20 }}
        >
          <div
            style={{
              color: "#fca5a5",
              fontWeight: 600,
            }}
          >
            Unable to check bot health
          </div>

          <p className="panel-description">
            {error}
          </p>

          <button
            type="button"
            className="glass-button"
            onClick={loadHealth}
          >
            Try Again
          </button>
        </div>
      )}

      <section className="glass-panel" style={{ marginBottom: 24 }}>
        <div className="panel-label">
          CONNECTION STATUS
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginTop: 16,
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              display: "grid",
              placeItems: "center",
              background: online
                ? "rgba(34, 197, 94, 0.12)"
                : "rgba(239, 68, 68, 0.12)",
              border: online
                ? "1px solid rgba(34, 197, 94, 0.25)"
                : "1px solid rgba(239, 68, 68, 0.25)",
              boxShadow: online
                ? "0 0 30px rgba(34, 197, 94, 0.12)"
                : "0 0 30px rgba(239, 68, 68, 0.12)",
              fontSize: 24,
            }}
          >
            {online ? "●" : "×"}
          </div>

          <div>
            <h2 className="section-title">
              {loading
                ? "Checking..."
                : online
                ? "Pixel Villa Support is online"
                : "Pixel Villa Support is offline"}
            </h2>

            <p className="panel-description">
              {online
                ? "The dashboard can currently reach the bot health endpoint."
                : "The bot health endpoint is not reporting an online connection."}
            </p>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">
            STATUS
          </div>

          <div className="stat-card-value">
            {loading
              ? "—"
              : online
              ? "ONLINE"
              : "OFFLINE"}
          </div>

          <div className="stat-card-subtitle">
            Current bot connection
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            LATENCY
          </div>

          <div className="stat-card-value">
            {loading ? "—" : `${formatNumber(latency)}ms`}
          </div>

          <div className="stat-card-subtitle">
            Current response latency
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            SERVERS
          </div>

          <div className="stat-card-value">
            {loading ? "—" : formatNumber(guilds)}
          </div>

          <div className="stat-card-subtitle">
            Discord servers
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            USERS
          </div>

          <div className="stat-card-value">
            {loading ? "—" : formatNumber(users)}
          </div>

          <div className="stat-card-subtitle">
            Users currently visible to the bot
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="glass-panel">
          <div className="panel-label">
            PERFORMANCE
          </div>

          <h2 className="section-title">
            Runtime
          </h2>

          <div className="detail-grid">
            <div className="detail-card">
              <span>Uptime</span>
              <strong>
                {loading
                  ? "—"
                  : formatUptime(uptime)}
              </strong>
            </div>

            <div className="detail-card">
              <span>Latency</span>
              <strong>
                {loading
                  ? "—"
                  : `${formatNumber(latency)}ms`}
              </strong>
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <div className="panel-label">
            MONITORING
          </div>

          <h2 className="section-title">
            Automatic Checks
          </h2>

          <p className="panel-description">
            The dashboard checks the bot health endpoint
            automatically every 30 seconds while this page
            is open.
          </p>

          <div
            className="status-pill"
            style={{ marginTop: 14 }}
          >
            <span className="status-dot" />
            30 second refresh
          </div>
        </div>
      </section>
    </div>
  );
}