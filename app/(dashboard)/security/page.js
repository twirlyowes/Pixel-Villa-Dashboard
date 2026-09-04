"use client";

import { useEffect, useState } from "react";

function StatCard({ label, value, description }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>

      <div className="stat-card-value">
        {value}
      </div>

      <div className="stat-card-subtitle">
        {description}
      </div>
    </div>
  );
}

function SystemCard({
  icon,
  title,
  status,
  description,
  details,
}) {
  const online =
    status === "Active" ||
    status === "Enabled" ||
    status === "Configured";

  return (
    <div className="dashboard-card">
      <div className="dashboard-card-icon">
        {icon}
      </div>

      <div className="dashboard-card-content">
        <h3>{title}</h3>

        <p>{description}</p>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 12,
          }}
        >
          <span className="status-pill">
            <span
              className="status-dot"
              style={{
                background: online
                  ? "#22c55e"
                  : "#94a3b8",
              }}
            />

            {status}
          </span>

          {details && (
            <span className="status-pill">
              {details}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SecurityPage() {
  const [verification, setVerification] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSecurity() {
    try {
      setLoading(true);
      setError("");

      /*
       * Verification and automod currently do not store
       * historical statistics in Firestore.
       *
       * This endpoint is therefore optional. If it does
       * not exist yet, the page still displays the systems
       * using the configuration available from the bot.
       */

      const response = await fetch(
        "/api/security",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Security statistics are not available yet."
        );
      }

      const result = await response.json();

      setVerification(result);
    } catch (err) {
      setVerification(null);
      setError(
        err.message ||
          "Security statistics are not available yet."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSecurity();
  }, []);

  const verified =
    verification?.verified ??
    verification?.verification?.verified ??
    0;

  const failed =
    verification?.failed ??
    verification?.verification?.failed ??
    0;

  const automodActions =
    verification?.automodActions ??
    verification?.automod?.actions ??
    0;

  const blockedMessages =
    verification?.blockedMessages ??
    verification?.automod?.blockedMessages ??
    0;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="status-pill">
            <span className="status-dot" />
            Security Systems
          </div>

          <h1 className="page-title">
            Verification{" "}
            <span className="gradient-text">
              & Automod
            </span>
          </h1>

          <p className="page-subtitle">
            Monitor Pixel Villa's verification and
            automated moderation systems.
          </p>
        </div>

        <button
          type="button"
          className="glass-button"
          onClick={loadSecurity}
          disabled={loading}
        >
          {loading
            ? "Checking..."
            : "↻ Refresh"}
        </button>
      </div>

      {error && (
        <div
          className="glass-panel"
          style={{
            marginBottom: 20,
          }}
        >
          <div
            style={{
              color: "#93c5fd",
              fontWeight: 700,
            }}
          >
            Statistics unavailable
          </div>

          <p className="panel-description">
            {error}
          </p>

          <p
            className="panel-description"
            style={{
              marginTop: 8,
            }}
          >
            The bot currently keeps verification and
            bad-word/automod activity primarily in
            memory or Discord logs rather than storing
            historical dashboard statistics in Firestore.
          </p>
        </div>
      )}

      <section className="stats-grid">
        <StatCard
          label="VERIFICATIONS"
          value={
            loading
              ? "—"
              : verification
              ? verified
              : "N/A"
          }
          description="Successful verification records"
        />

        <StatCard
          label="FAILED"
          value={
            loading
              ? "—"
              : verification
              ? failed
              : "N/A"
          }
          description="Failed verification records"
        />

        <StatCard
          label="AUTOMOD ACTIONS"
          value={
            loading
              ? "—"
              : verification
              ? automodActions
              : "N/A"
          }
          description="Automated moderation actions"
        />

        <StatCard
          label="BLOCKED MESSAGES"
          value={
            loading
              ? "—"
              : verification
              ? blockedMessages
              : "N/A"
          }
          description="Messages blocked by automod"
        />
      </section>

      <section className="dashboard-grid">
        <SystemCard
          icon="◇"
          title="Verification System"
          status="Configured"
          description="Discord verification system using CAPTCHA sessions and verification roles."
          details="CAPTCHA"
        />

        <SystemCard
          icon="◆"
          title="Bad Word Protection"
          status="Active"
          description="Messages containing configured blocked words can be detected and removed."
          details="Word Filter"
        />

        <SystemCard
          icon="●"
          title="Verification Logging"
          status="Active"
          description="Verification events are logged to the configured Discord log channel."
          details="Discord Logs"
        />

        <SystemCard
          icon="⚠"
          title="Automod Protection"
          status="Active"
          description="Automated protection systems can detect configured message violations."
          details="Protection"
        />
      </section>

      <section className="content-grid">
        <div className="glass-panel">
          <div className="panel-label">
            VERIFICATION
          </div>

          <h2 className="section-title">
            Verification Configuration
          </h2>

          <div className="detail-grid">
            <div className="detail-card">
              <span>Verification</span>
              <strong>Enabled</strong>
            </div>

            <div className="detail-card">
              <span>CAPTCHA</span>
              <strong>Enabled</strong>
            </div>

            <div className="detail-card">
              <span>Success Logging</span>
              <strong>Enabled</strong>
            </div>

            <div className="detail-card">
              <span>Role Assignment</span>
              <strong>Enabled</strong>
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <div className="panel-label">
            AUTOMOD
          </div>

          <h2 className="section-title">
            Protection Status
          </h2>

          <p className="panel-description">
            The Pixel Villa Support bot contains
            automated moderation and bad-word protection.
            Historical action statistics are not currently
            persisted to Firestore, so this dashboard will
            not invent or display fake historical numbers.
          </p>

          <div
            className="status-pill"
            style={{
              marginTop: 16,
            }}
          >
            <span className="status-dot" />
            Protection Active
          </div>
        </div>
      </section>
    </div>
  );
}