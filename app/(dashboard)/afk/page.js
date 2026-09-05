"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

function formatDate(date) {
  if (!date) return "Unknown";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleString();
}

function formatDuration(date) {
  if (!date) return "Unknown";

  const start = new Date(date).getTime();

  if (Number.isNaN(start)) {
    return "Unknown";
  }

  const diff = Math.max(0, Date.now() - start);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "Less than a minute";
  }

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return `${hours}h ${remainingMinutes}m`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return `${days}d ${remainingHours}h`;
}

export default function AfkPage() {
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [myStatus, setMyStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const isAdmin = session?.user?.isAdmin === true;

  const loadAfk = useCallback(async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/afk", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "Failed to load AFK status."
        );
      }

      if (data.isAdmin === true) {
        setUsers(
          Array.isArray(data.users)
            ? data.users
            : []
        );

        setMyStatus(null);
      } else {
        setMyStatus(
          data.isAfk
            ? {
                userId: data.userId,
                reason: data.reason,
                since: data.since,
              }
            : null
        );

        setUsers([]);
      }

      setLastUpdated(new Date());
    } catch (error) {
      setUsers([]);
      setMyStatus(null);
      setMessage(
        error.message ||
          "Failed to load AFK status."
      );
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    loadAfk();

    const interval = setInterval(() => {
      loadAfk();
    }, 30000);

    return () => clearInterval(interval);
  }, [status, loadAfk]);

  useEffect(() => {
    if (!myStatus?.since) return;

    const interval = setInterval(() => {
      setMyStatus((current) =>
        current ? { ...current } : current
      );
    }, 60000);

    return () => clearInterval(interval);
  }, [myStatus?.since]);

  if (status === "loading" || loading) {
    return (
      <div className="glass-page">
        <div className="glass-card">
          <p className="text-white/60">
            Loading AFK status...
          </p>
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="glass-page">
        <div className="glass-card text-center">
          <h2 className="text-lg font-semibold text-white">
            Unauthorized
          </h2>

          <p className="mt-2 text-sm text-white/50">
            Please log in to view AFK status.
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
            STAFF STATUS
          </p>

          <h1 className="page-title">
            AFK
          </h1>

          <p className="page-description">
            {isAdmin
              ? "View staff members who are currently AFK."
              : "View your current AFK status."}
          </p>

          {lastUpdated && (
            <p className="mt-2 text-xs text-white/30">
              Last updated{" "}
              {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="stat-card">
              <span className="stat-label">
                CURRENTLY AFK
              </span>

              <span className="stat-value">
                {users.length}
              </span>
            </div>
          )}

          <button
            onClick={loadAfk}
            disabled={loading}
            className="glass-button"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {message && (
        <div className="glass-card mb-6">
          <p className="text-sm text-white/70">
            {message}
          </p>
        </div>
      )}

      {isAdmin ? (
        users.length === 0 ? (
          <div className="glass-card text-center">
            <div className="mb-3 text-4xl">
              ✓
            </div>

            <h2 className="text-lg font-semibold text-white">
              No Staff AFK
            </h2>

            <p className="mt-1 text-sm text-white/50">
              Nobody is currently marked as AFK.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.userId}
                className="glass-card"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1 text-xs font-medium text-yellow-300">
                        AFK
                      </span>

                      <span className="text-xs text-white/40 break-all">
                        {user.userId}
                      </span>
                    </div>

                    <h2 className="text-lg font-semibold text-white">
                      {user.username || "Staff Member"}
                    </h2>

                    <p className="mt-2 text-sm text-white/60 break-words">
                      {user.reason ||
                        "No reason provided."}
                    </p>
                  </div>

                  <div className="shrink-0 text-left md:text-right">
                    <p className="text-xs uppercase tracking-wider text-white/30">
                      Since
                    </p>

                    <p className="mt-1 text-sm text-white/70">
                      {formatDate(user.since)}
                    </p>

                    <p className="mt-1 text-xs text-white/40">
                      {formatDuration(user.since)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="glass-card">
          {myStatus ? (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1 text-xs font-medium text-yellow-300">
                  AFK
                </span>

                <span className="text-xs text-white/40 break-all">
                  {myStatus.userId}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-white">
                You are currently AFK
              </h2>

              <p className="mt-2 text-sm text-white/60">
                {myStatus.reason ||
                  "No reason provided."}
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/30">
                    Since
                  </p>

                  <p className="mt-1 text-sm text-white/70">
                    {formatDate(myStatus.since)}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-white/30">
                    Duration
                  </p>

                  <p className="mt-1 text-sm text-white/70">
                    {formatDuration(
                      myStatus.since
                    )}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="mb-3 text-4xl">
                ✓
              </div>

              <h2 className="text-lg font-semibold text-white">
                You are not AFK
              </h2>

              <p className="mt-1 text-sm text-white/50">
                You currently have no AFK status.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}