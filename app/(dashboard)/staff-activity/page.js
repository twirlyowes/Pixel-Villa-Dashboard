"use client";

import { useEffect, useMemo, useState } from "react";

function formatTime(seconds = 0) {
const total = Number(seconds) || 0;

const hours = Math.floor(total / 3600);
const minutes = Math.floor((total % 3600) / 60);

if (hours > 0) {
return "${hours}h ${minutes}m";
}

return "${minutes}m";
}

function formatNumber(value = 0) {
return new Intl.NumberFormat().format(
Number(value) || 0
);
}

function getName(member) {
return (
member.globalName ||
member.global_name ||
member.displayName ||
member.display_name ||
member.username ||
member.name ||
member.tag ||
"Unknown Staff"
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

export default function StaffActivityPage() {
const [data, setData] = useState(null);
const [selected, setSelected] = useState(null);
const [search, setSearch] = useState("");
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [lastUpdated, setLastUpdated] = useState(null);

async function loadActivity() {
try {
setLoading(true);
setError("");

  const response = await fetch(
    "/api/staff-activity",
    {
      cache: "no-store",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.error ||
        "Failed to load staff activity."
    );
  }

  setData(result);
  setLastUpdated(new Date());
} catch (err) {
  setError(
    err.message ||
      "Failed to load staff activity."
  );
} finally {
  setLoading(false);
}

}

useEffect(() => {
loadActivity();

const interval = setInterval(
  loadActivity,
  30000
);

return () => clearInterval(interval);

}, []);

const staff = useMemo(() => {
if (!data) return [];

const list =
  data.staff ||
  data.users ||
  data.activity ||
  data.data ||
  [];

return Array.isArray(list) ? list : [];

}, [data]);

const filteredStaff = useMemo(() => {
const query = search
.trim()
.toLowerCase();

if (!query) return staff;

return staff.filter((member) => {
  const name = getName(member)
    .toLowerCase();

  const username = String(
    member.username || ""
  ).toLowerCase();

  return (
    name.includes(query) ||
    username.includes(query)
  );
});

}, [staff, search]);

const totals = useMemo(() => {
return staff.reduce(
(acc, member) => {
acc.activeTime +=
Number(member.activeTime) || 0;

    acc.messages +=
      Number(member.messages) || 0;

    acc.commands +=
      Number(member.commands) || 0;

    return acc;
  },
  {
    activeTime: 0,
    messages: 0,
    commands: 0,
  }
);

}, [staff]);

const topStaff = useMemo(() => {
return [...staff]
.sort(
(a, b) =>
(Number(b.activeTime) || 0) -
(Number(a.activeTime) || 0)
)
.slice(0, 5);
}, [staff]);

function getRank(index) {
if (index === 0) return "🥇";
if (index === 1) return "🥈";
if (index === 2) return "🥉";

return `#${index + 1}`;

}

return (
<div className="page-container">
<div className="page-header">
<div>
<div className="status-pill">
<span className="status-dot" />
Live Activity Data
</div>

      <h1 className="page-title">
        Staff{" "}
        <span className="gradient-text">
          Activity
        </span>
      </h1>

      <p className="page-subtitle">
        Monitor staff activity, active time,
        messages and commands.
      </p>

      {lastUpdated && (
        <p
          style={{
            marginTop: 8,
            color:
              "rgba(148, 163, 184, 0.5)",
            fontSize: 12,
          }}
        >
          Last updated{" "}
          {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>

    <button
      type="button"
      className="glass-button"
      onClick={loadActivity}
      disabled={loading}
    >
      {loading
        ? "Refreshing..."
        : "↻ Refresh"}
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
        Unable to load activity
      </div>

      <p className="panel-description">
        {error}
      </p>

      <button
        type="button"
        className="glass-button"
        onClick={loadActivity}
      >
        Try Again
      </button>
    </div>
  )}

  <section className="stats-grid">
    <div className="stat-card">
      <div className="stat-card-label">
        STAFF MEMBERS
      </div>

      <div className="stat-card-value">
        {loading
          ? "—"
          : formatNumber(staff.length)}
      </div>

      <div className="stat-card-subtitle">
        Tracked staff accounts
      </div>
    </div>

    <div className="stat-card">
      <div className="stat-card-label">
        TOTAL ACTIVE TIME
      </div>

      <div className="stat-card-value">
        {loading
          ? "—"
          : formatTime(
              totals.activeTime
            )}
      </div>

      <div className="stat-card-subtitle">
        Current activity period
      </div>
    </div>

    <div className="stat-card">
      <div className="stat-card-label">
        MESSAGES
      </div>

      <div className="stat-card-value">
        {loading
          ? "—"
          : formatNumber(
              totals.messages
            )}
      </div>

      <div className="stat-card-subtitle">
        Staff messages recorded
      </div>
    </div>

    <div className="stat-card">
      <div className="stat-card-label">
        COMMANDS
      </div>

      <div className="stat-card-value">
        {loading
          ? "—"
          : formatNumber(
              totals.commands
            )}
      </div>

      <div className="stat-card-subtitle">
        Commands recorded
      </div>
    </div>
  </section>

  <section className="content-grid">
    <div className="glass-panel">
      <div className="panel-header">
        <div>
          <div className="panel-label">
            LEADERBOARD
          </div>

          <h2 className="section-title">
            Top Staff
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          Loading activity...
        </div>
      ) : topStaff.length === 0 ? (
        <div className="empty-state">
          No staff activity data found.
        </div>
      ) : (
        <div className="leaderboard">
          {topStaff.map(
            (member, index) => (
              <button
                type="button"
                key={`${getId(
                  member
                )}-${index}`}
                className="leaderboard-row"
                onClick={() =>
                  setSelected(member)
                }
              >
                <div className="leaderboard-rank">
                  {getRank(index)}
                </div>

                <div className="leaderboard-user">
                  <div className="leaderboard-avatar">
                    {getName(member)
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <div className="leaderboard-name">
                      {getName(member)}
                    </div>

                    <div className="leaderboard-id">
                      {member.username
                        ? `@${member.username}`
                        : "Discord Staff"}
                    </div>
                  </div>
                </div>

                <div className="leaderboard-time">
                  {formatTime(
                    member.activeTime
                  )}
                </div>
              </button>
            )
          )}
        </div>
      )}
    </div>

    <div className="glass-panel">
      <div className="panel-header">
        <div>
          <div className="panel-label">
            STAFF DIRECTORY
          </div>

          <h2 className="section-title">
            All Staff
          </h2>
        </div>

        <span className="panel-count">
          {filteredStaff.length}
        </span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          className="glass-input"
          type="search"
          placeholder="Search staff..."
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
        />
      </div>

      {loading ? (
        <div className="empty-state">
          Loading staff...
        </div>
      ) : filteredStaff.length ===
        0 ? (
        <div className="empty-state">
          No matching staff members.
        </div>
      ) : (
        <div className="staff-list">
          {filteredStaff.map(
            (member, index) => (
              <button
                type="button"
                key={`${getId(
                  member
                )}-${index}`}
                className="staff-list-row"
                onClick={() =>
                  setSelected(member)
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
                    {formatTime(
                      member.activeTime
                    )}{" "}
                    active
                    {" • "}
                    {formatNumber(
                      member.messages
                    )}{" "}
                    messages
                  </div>
                </div>

                <span className="staff-list-arrow">
                  →
                </span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  </section>

  {selected && (
    <div
      className="modal-backdrop"
      onClick={() =>
        setSelected(null)
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
              STAFF DETAILS
            </div>

            <h2 className="section-title">
              {getName(selected)}
            </h2>

            {selected.username && (
              <p
                style={{
                  marginTop: 4,
                  color:
                    "rgba(148, 163, 184, 0.65)",
                  fontSize: 13,
                }}
              >
                @{selected.username}
              </p>
            )}
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={() =>
              setSelected(null)
            }
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="detail-grid">
          <div className="detail-card">
            <span>Active Time</span>

            <strong>
              {formatTime(
                selected.activeTime
              )}
            </strong>
          </div>

          <div className="detail-card">
            <span>Messages</span>

            <strong>
              {formatNumber(
                selected.messages
              )}
            </strong>
          </div>

          <div className="detail-card">
            <span>Commands</span>

            <strong>
              {formatNumber(
                selected.commands
              )}
            </strong>
          </div>

          <div className="detail-card">
            <span>Account</span>

            <strong>
              Discord Staff
            </strong>
          </div>
        </div>

        {selected.updatedAt && (
          <p className="panel-description">
            Last updated:{" "}
            {new Date(
              selected.updatedAt
            ).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )}
</div>

);
}