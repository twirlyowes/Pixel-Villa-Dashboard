"use client";

import { useEffect, useState } from "react";

export default function ModerationPage() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMembers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/moderation", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Failed to load moderation data."
        );
      }

      const list =
        result.members ||
        result.users ||
        result.data ||
        [];

      setMembers(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(
        err.message || "Failed to load moderation data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  const filteredMembers = members.filter((member) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    const username = String(
      member.username ||
        member.name ||
        member.tag ||
        ""
    ).toLowerCase();

    const id = String(
      member.userId ||
        member.discordId ||
        member.id ||
        ""
    ).toLowerCase();

    return (
      username.includes(query) ||
      id.includes(query)
    );
  });

  function getName(member) {
    return (
      member.username ||
      member.name ||
      member.tag ||
      member.userId ||
      member.discordId ||
      "Unknown User"
    );
  }

  function getId(member) {
    return (
      member.userId ||
      member.discordId ||
      member.id ||
      ""
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="status-pill">
            <span className="status-dot" />
            Administration
          </div>

          <h1 className="page-title">
            <span className="gradient-text">Moderation</span>
          </h1>

          <p className="page-subtitle">
            Manage moderation information and member actions.
          </p>
        </div>

        <button
          type="button"
          className="glass-button"
          onClick={loadMembers}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
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
            Unable to load moderation data
          </div>

          <p className="panel-description">
            {error}
          </p>

          <button
            type="button"
            className="glass-button"
            onClick={loadMembers}
          >
            Try Again
          </button>
        </div>
      )}

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">
            MEMBERS
          </div>

          <div className="stat-card-value">
            {loading ? "—" : members.length}
          </div>

          <div className="stat-card-subtitle">
            Members returned by moderation API
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            SEARCH RESULTS
          </div>

          <div className="stat-card-value">
            {loading ? "—" : filteredMembers.length}
          </div>

          <div className="stat-card-subtitle">
            Members matching your search
          </div>
        </div>
      </section>

      <section className="glass-panel">
        <div className="panel-header">
          <div>
            <div className="panel-label">
              MODERATION
            </div>

            <h2 className="section-title">
              Member Management
            </h2>
          </div>

          <span className="panel-count">
            {filteredMembers.length}
          </span>
        </div>

        <div style={{ marginBottom: 20 }}>
          <input
            className="glass-input"
            type="search"
            placeholder="Search username or Discord ID..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        {loading ? (
          <div className="empty-state">
            Loading members...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="empty-state">
            {search
              ? "No members match your search."
              : "No member data available."}
          </div>
        ) : (
          <div className="staff-list">
            {filteredMembers.map((member, index) => (
              <button
                type="button"
                key={`${getId(member)}-${index}`}
                className="staff-list-row"
                onClick={() =>
                  setSelectedMember(member)
                }
              >
                <div className="staff-list-avatar">
                  {getName(member)
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="staff-list-info">
                  <div className="staff-list-name">
                    {getName(member)}
                  </div>

                  <div className="staff-list-meta">
                    {getId(member) || "Unknown Discord ID"}
                  </div>
                </div>

                <span className="staff-list-arrow">
                  →
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedMember && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setSelectedMember(null)
          }
        >
          <div
            className="glass-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <div className="panel-label">
                  MEMBER
                </div>

                <h2 className="section-title">
                  {getName(selectedMember)}
                </h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setSelectedMember(null)
                }
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="detail-grid">
              <div className="detail-card">
                <span>Username</span>
                <strong>
                  {getName(selectedMember)}
                </strong>
              </div>

              <div className="detail-card">
                <span>Discord ID</span>
                <strong>
                  {getId(selectedMember) ||
                    "Unknown"}
                </strong>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 20,
              }}
            >
              <button
                type="button"
                className="glass-button"
                onClick={() =>
                  alert(
                    "Moderation actions are handled by the Pixel Villa bot."
                  )
                }
              >
                Moderation Actions
              </button>

              <button
                type="button"
                className="glass-button"
                onClick={() =>
                  setSelectedMember(null)
                }
              >
                Close
              </button>
            </div>

            <p className="panel-description">
              This dashboard does not directly execute
              Discord moderation commands. Actions should
              remain handled securely by the bot.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}