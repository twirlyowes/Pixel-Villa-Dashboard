"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function ModerationPage() {
  const { data: session, status } = useSession();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = session?.user?.isAdmin === true;

  useEffect(() => {
    if (status !== "authenticated") return;

    if (!isAdmin) {
      setLoading(false);
      return;
    }

    async function loadModeration() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/moderation",
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Failed to load moderation data."
          );
        }

        setData(result);
      } catch (err) {
        console.error(err);
        setError(
          err.message ||
            "Failed to load moderation data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadModeration();
  }, [status, isAdmin]);

  if (status === "loading" || loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <div className="page-kicker">
              Administration
            </div>
            <h1 className="page-title">
              Moderation
            </h1>
            <p className="page-description">
              Loading moderation systems...
            </p>
          </div>
        </div>

        <div className="glass-card">
          Loading...
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="glass-card">
        You must be signed in.
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div>
        <div className="page-header">
          <div>
            <div className="page-kicker">
              Administration
            </div>

            <h1 className="page-title">
              Moderation
            </h1>

            <p className="page-description">
              Administrative moderation controls.
            </p>
          </div>
        </div>

        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              🔒
            </div>

            <h2>
              Administrator access required
            </h2>

            <p>
              You do not have permission to
              access moderation controls.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const actions = Array.isArray(data?.actions)
    ? data.actions
    : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-kicker">
            Administration
          </div>

          <h1 className="page-title">
            Moderation
          </h1>

          <p className="page-description">
            Pixel Villa moderation systems and
            available actions.
          </p>
        </div>

        <div className="glass-badge">
          ADMIN
        </div>
      </div>

      {error && (
        <div className="glass-card">
          <div className="error-state">
            {error}
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-label">
            Available Actions
          </div>

          <div className="stat-value">
            {actions.length}
          </div>

          <div className="stat-subtitle">
            Moderation systems
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-label">
            Access
          </div>

          <div className="stat-value">
            Admin
          </div>

          <div className="stat-subtitle">
            Restricted dashboard area
          </div>
        </div>
      </div>

      <div className="section-heading">
        <div>
          <h2>Moderation Actions</h2>
          <p>
            Actions available through the
            Pixel Villa Support bot.
          </p>
        </div>
      </div>

      {actions.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              ◆
            </div>

            <h2>
              No moderation actions found
            </h2>

            <p>
              The moderation API did not return
              any configured actions.
            </p>
          </div>
        </div>
      ) : (
        <div className="card-grid">
          {actions.map((action) => (
            <div
              key={action.id}
              className="glass-card"
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <h3>
                  {action.name ||
                    action.id}
                </h3>

                <span className="glass-badge">
                  MOD
                </span>
              </div>

              <p
                style={{
                  color:
                    "rgba(148, 163, 184, 0.85)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {action.description ||
                  "Moderation action provided by the bot."}
              </p>
            </div>
          ))}
        </div>
      )}

      <div
        className="glass-card"
        style={{ marginTop: 20 }}
      >
        <h3 style={{ marginBottom: 8 }}>
          Discord-side moderation
        </h3>

        <p
          style={{
            color:
              "rgba(148, 163, 184, 0.85)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Moderation actions are currently
          handled by the Pixel Villa Support
          bot. This dashboard page is an
          administrator reference and does not
          execute Discord moderation actions.
        </p>
      </div>
    </div>
  );
}