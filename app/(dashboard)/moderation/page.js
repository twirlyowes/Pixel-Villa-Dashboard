"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function ModerationPage() {
  const { data: session, status } = useSession();

  const [action, setAction] = useState("warn");
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("10m");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isAdmin = session?.user?.isAdmin === true;

  async function performAction() {
    setMessage("");
    setError("");

    if (!userId.trim()) {
      setError("Enter a Discord User ID.");
      return;
    }

    if (!/^\d{15,25}$/.test(userId.trim())) {
      setError("Enter a valid Discord User ID.");
      return;
    }

    if (
      (action === "warn" || action === "mute") &&
      !reason.trim()
    ) {
      setError("Please enter a reason.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/moderation/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          userId: userId.trim(),
          reason: reason.trim(),
          duration:
            action === "mute"
              ? duration
              : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to perform moderation action."
        );
      }

      setMessage(
        result.message ||
          `${action} action completed successfully.`
      );

      setUserId("");
      setReason("");
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="glass-card">
        Loading moderation...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="glass-card">
        <div className="empty-state">
          <div className="empty-state-icon">
            🔒
          </div>

          <h2>Authentication required</h2>

          <p>
            Please sign in to use dashboard
            moderation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-kicker">
            Moderation
          </div>

          <h1 className="page-title">
            Moderation Center
          </h1>

          <p className="page-description">
            Perform Pixel Villa moderation actions
            directly from the dashboard.
          </p>
        </div>

        <div className="glass-badge">
          {isAdmin ? "ADMIN" : "STAFF"}
        </div>
      </div>

      {/* Access information */}
      <div
        className="glass-card"
        style={{ marginBottom: 20 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "rgba(56, 189, 248, 0.08)",
              border:
                "1px solid rgba(56, 189, 248, 0.12)",
              fontSize: 20,
            }}
          >
            🛡️
          </div>

          <div>
            <h3 style={{ margin: 0 }}>
              {isAdmin
                ? "Administrator Moderation"
                : "Staff Moderation"}
            </h3>

            <p
              style={{
                margin: "4px 0 0",
                color:
                  "rgba(148, 163, 184, 0.75)",
                fontSize: 13,
              }}
            >
              {isAdmin
                ? "You have full moderation access."
                : "You can warn, mute and unmute members."}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div
          className="glass-card"
          style={{
            marginBottom: 20,
            border:
              "1px solid rgba(248, 113, 113, 0.2)",
            color: "#fca5a5",
          }}
        >
          ❌ {error}
        </div>
      )}

      {message && (
        <div
          className="glass-card"
          style={{
            marginBottom: 20,
            border:
              "1px solid rgba(74, 222, 128, 0.2)",
            color: "#86efac",
          }}
        >
          ✅ {message}
        </div>
      )}

      {/* Action selector */}
      <div className="section-heading">
        <div>
          <h2>Moderation Action</h2>

          <p>
            Choose an action and provide the
            required information.
          </p>
        </div>
      </div>

      <div
        className="glass-card"
        style={{ marginBottom: 20 }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <button
            type="button"
            onClick={() => setAction("warn")}
            className="glass-button"
            style={{
              border:
                action === "warn"
                  ? "1px solid rgba(250, 204, 21, 0.35)"
                  : undefined,
              background:
                action === "warn"
                  ? "rgba(250, 204, 21, 0.08)"
                  : undefined,
            }}
          >
            ⚠️ Warn
          </button>

          <button
            type="button"
            onClick={() => setAction("mute")}
            className="glass-button"
            style={{
              border:
                action === "mute"
                  ? "1px solid rgba(56, 189, 248, 0.35)"
                  : undefined,
              background:
                action === "mute"
                  ? "rgba(56, 189, 248, 0.08)"
                  : undefined,
            }}
          >
            🔇 Mute
          </button>

          <button
            type="button"
            onClick={() => setAction("unmute")}
            className="glass-button"
            style={{
              border:
                action === "unmute"
                  ? "1px solid rgba(74, 222, 128, 0.35)"
                  : undefined,
              background:
                action === "unmute"
                  ? "rgba(74, 222, 128, 0.08)"
                  : undefined,
            }}
          >
            🔊 Unmute
          </button>
        </div>

        {/* User */}
        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Discord User ID
          </label>

          <input
            type="text"
            inputMode="numeric"
            value={userId}
            onChange={(e) =>
              setUserId(
                e.target.value.replace(/\D/g, "")
              )
            }
            placeholder="Enter Discord User ID"
            className="dashboard-input"
          />
        </div>

        {/* Duration */}
        {action === "mute" && (
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Duration
            </label>

            <select
              value={duration}
              onChange={(e) =>
                setDuration(e.target.value)
              }
              className="dashboard-input"
            >
              <option value="1m">1 minute</option>
              <option value="5m">5 minutes</option>
              <option value="10m">10 minutes</option>
              <option value="30m">30 minutes</option>
              <option value="1h">1 hour</option>
              <option value="6h">6 hours</option>
              <option value="12h">12 hours</option>
              <option value="1d">1 day</option>
              <option value="7d">7 days</option>
            </select>
          </div>
        )}

        {/* Reason */}
        {action !== "unmute" && (
          <div style={{ marginBottom: 22 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Reason
            </label>

            <textarea
              value={reason}
              onChange={(e) =>
                setReason(e.target.value)
              }
              placeholder="Enter moderation reason..."
              rows={4}
              className="dashboard-input"
              style={{
                resize: "vertical",
                minHeight: 100,
              }}
            />
          </div>
        )}

        {/* Execute */}
        <button
          type="button"
          onClick={performAction}
          disabled={loading}
          className="glass-button primary"
          style={{
            width: "100%",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading
            ? "Processing..."
            : action === "warn"
              ? "⚠️ Issue Warning"
              : action === "mute"
                ? "🔇 Mute Member"
                : "🔊 Unmute Member"}
        </button>
      </div>

      {/* Permission note */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 8 }}>
          🔐 Permission & Audit
        </h3>

        <p
          style={{
            margin: 0,
            color:
              "rgba(148, 163, 184, 0.8)",
            lineHeight: 1.6,
            fontSize: 14,
          }}
        >
          Every dashboard moderation action will
          be verified against your dashboard
          permissions and recorded in the Pixel
          Villa audit log.
        </p>
      </div>
    </div>
  );
}