"use client";

import { useEffect, useMemo, useState } from "react";

function formatDate(value) {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function getUsername(user) {
  return (
    user.username ||
    user.name ||
    user.tag ||
    user.userId ||
    user.discordId ||
    "Unknown User"
  );
}

function getUserId(user) {
  return user.userId || user.discordId || user.id || "";
}

export default function AFKPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAFK() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/afk", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to load AFK users.");
      }

      const list =
        result.users ||
        result.afk ||
        result.data ||
        [];

      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Failed to load AFK users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAFK();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) => {
      const username = getUsername(user).toLowerCase();
      const userId = getUserId(user).toLowerCase();
      const reason = String(user.reason || "").toLowerCase();

      return (
        username.includes(query) ||
        userId.includes(query) ||
        reason.includes(query)
      );
    });
  }, [users, search]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="status-pill">
            <span className="status-dot" />
            AFK Management
          </div>

          <h1 className="page-title">
            AFK <span className="gradient-text">Users</span>
          </h1>

          <p className="page-subtitle">
            View members who are currently marked as AFK.
          </p>
        </div>

        <button
          type="button"
          className="glass-button"
          onClick={loadAFK}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {error && (
        <div className="glass-panel" style={{ marginBottom: 20 }}>
          <div style={{ color: "#fca5a5", fontWeight: 600 }}>
            Unable to load AFK users
          </div>

          <p className="panel-description">
            {error}
          </p>

          <button
            type="button"
            className="glass-button"
            onClick={loadAFK}
          >
            Try Again
          </button>
        </div>
      )}

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">CURRENTLY AFK</div>

          <div className="stat-card-value">
            {loading ? "—" : users.length}
          </div>

          <div className="stat-card-subtitle">
            Members currently marked AFK
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">VISIBLE RESULTS</div>

          <div className="stat-card-value">
            {loading ? "—" : filteredUsers.length}
          </div>

          <div className="stat-card-subtitle">
            Matching your search
          </div>
        </div>
      </section>

      <section className="glass-panel">
        <div className="panel-header">
          <div>
            <div className="panel-label">AFK DIRECTORY</div>

            <h2 className="section-title">
              Current AFK Members
            </h2>
          </div>

          <span className="panel-count">
            {filteredUsers.length}
          </span>
        </div>

        <div style={{ marginBottom: 20 }}>
          <input
            className="glass-input"
            type="search"
            placeholder="Search username, Discord ID or reason..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <div className="empty-state">
            Loading AFK users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            {search
              ? "No AFK users match your search."
              : "No users are currently AFK."}
          </div>
        ) : (
          <div className="staff-list">
            {filteredUsers.map((user, index) => (
              <div
                key={`${getUserId(user)}-${index}`}
                className="staff-list-row"
              >
                <div className="staff-list-avatar">
                  {getUsername(user)
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="staff-list-info">
                  <div className="staff-list-name">
                    {getUsername(user)}
                  </div>

                  <div className="staff-list-meta">
                    {getUserId(user) || "Unknown Discord ID"}
                  </div>

                  <div
                    className="panel-description"
                    style={{
                      marginTop: 5,
                      marginBottom: 0,
                    }}
                  >
                    <strong>Reason:</strong>{" "}
                    {user.reason || "No reason provided"}
                  </div>

                  {user.time && (
                    <div className="staff-list-meta">
                      AFK since: {formatDate(user.time)}
                    </div>
                  )}
                </div>

                <div className="staff-list-arrow">
                  ●
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}