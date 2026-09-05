"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function WarningsPage() {
  const { data: session, status } = useSession();

  const [userId, setUserId] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isAdmin = session?.user?.isAdmin === true;

  async function loadWarnings(targetUserId = "") {
    setLoading(true);
    setMessage("");

    try {
      const query = targetUserId
        ? `?userId=${encodeURIComponent(targetUserId)}`
        : "";

      const res = await fetch(`/api/warnings${query}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "Failed to load warnings"
        );
      }

      setWarnings(
        Array.isArray(data.warnings)
          ? data.warnings
          : []
      );

      setMessage(
        data.count === 0
          ? "No warnings found."
          : `${data.count} warning${
              data.count === 1 ? "" : "s"
            } found.`
      );
    } catch (error) {
      setWarnings([]);
      setMessage(
        error.message || "Failed to load warnings."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status !== "authenticated") return;

    const ownUserId =
      session?.user?.discordId || "";

    if (!isAdmin && ownUserId) {
      setUserId(ownUserId);
      loadWarnings(ownUserId);
      return;
    }

    loadWarnings();
  }, [status, isAdmin, session]);

  async function addWarning() {
    const targetUserId = userId.trim();

    if (!targetUserId) {
      setMessage("Enter a Discord User ID first.");
      return;
    }

    const reason = window.prompt(
      "Enter the warning reason:"
    );

    if (!reason?.trim()) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/warnings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: targetUserId,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "Failed to add warning"
        );
      }

      setWarnings(
        Array.isArray(data.warnings)
          ? data.warnings
          : []
      );

      if (data.loggedToDiscord === false) {
        setMessage(
          "Warning added, but the Discord log could not be sent."
        );
      } else {
        setMessage(
          "Warning added successfully and logged to Discord."
        );
      }
    } catch (error) {
      setMessage(
        error.message || "Failed to add warning."
      );
    } finally {
      setLoading(false);
    }
  }

  async function removeWarning(warningId) {
    const targetUserId = userId.trim();

    if (!targetUserId) {
      setMessage("Enter a Discord User ID first.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove this warning?"
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/warnings", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: targetUserId,
          warningId: String(warningId),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "Failed to remove warning"
        );
      }

      setWarnings(
        Array.isArray(data.warnings)
          ? data.warnings
          : []
      );

      setMessage(
        "Warning removed successfully."
      );
    } catch (error) {
      setMessage(
        error.message ||
          "Failed to remove warning."
      );
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="glass-page">
        <div className="glass-card">
          <p className="text-white/60">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="glass-page">
        <div className="glass-card">
          <h1 className="text-lg font-semibold text-white">
            Unauthorized
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Please log in to access warnings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">
            MODERATION
          </p>

          <h1 className="page-title">
            Warnings
          </h1>

          <p className="page-description">
            View and manage recorded warnings.
          </p>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            TOTAL
          </span>

          <span className="stat-value">
            {warnings.length}
          </span>
        </div>
      </div>

      <div className="glass-card mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="glass-label">
              Discord User ID
            </label>

            <input
              value={userId}
              onChange={(e) =>
                setUserId(e.target.value)
              }
              placeholder={
                isAdmin
                  ? "Enter a Discord User ID"
                  : "Your Discord User ID"
              }
              disabled={!isAdmin}
              className="glass-input"
            />
          </div>

          <button
            onClick={() =>
              loadWarnings(userId.trim())
            }
            disabled={
              loading || !userId.trim()
            }
            className="glass-button"
          >
            {loading
              ? "Loading..."
              : "Search"}
          </button>

          <button
            onClick={addWarning}
            disabled={
              loading || !userId.trim()
            }
            className="glass-button glass-button-primary"
          >
            + Add Warning
          </button>
        </div>

        {message && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            {message}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {warnings.length === 0 ? (
          <div className="glass-card text-center">
            <div className="mb-3 text-4xl">
              ✓
            </div>

            <h2 className="text-lg font-semibold text-white">
              No warnings
            </h2>

            <p className="mt-1 text-sm text-white/50">
              This user currently has no recorded
              warnings.
            </p>
          </div>
        ) : (
          warnings.map((warning, index) => (
            <div
              key={warning.id || index}
              className="glass-card warning-card"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="warning-number">
                      #{index + 1}
                    </span>

                    <span className="warning-id">
                      ID: {warning.id}
                    </span>
                  </div>

                  <h2 className="text-base font-semibold text-white break-words">
                    {warning.reason ||
                      "No reason provided"}
                  </h2>

                  <div className="mt-3 grid gap-2 text-sm text-white/50 sm:grid-cols-2">
                    <div>
                      <span className="text-white/30">
                        Moderator
                      </span>

                      <br />

                      <span className="text-white/70">
                        {warning.moderatorUsername ||
                          warning.moderator ||
                          "Unknown"}
                      </span>
                    </div>

                    <div>
                      <span className="text-white/30">
                        Date
                      </span>

                      <br />

                      <span className="text-white/70">
                        {warning.timestamp
                          ? new Date(
                              warning.timestamp
                            ).toLocaleString()
                          : "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() =>
                      removeWarning(
                        warning.id
                      )
                    }
                    disabled={loading}
                    className="glass-button glass-button-danger"
                  >
                    {loading
                      ? "Removing..."
                      : "Remove"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}