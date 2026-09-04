"use client";

import { useMemo, useState } from "react";

const commands = [
  {
    command: ".dm",
    category: "Messaging",
    description: "Send a direct message to a Discord user.",
    permission: "Administrator",
  },
  {
    command: ".ui",
    category: "Information",
    description: "Display information about a user.",
    permission: "Staff",
  },
  {
    command: ".si",
    category: "Information",
    description: "Display server information.",
    permission: "Staff",
  },
  {
    command: ".sticky",
    category: "Utility",
    description: "Manage a sticky message in a channel.",
    permission: "Staff",
  },
  {
    command: ".botinfo",
    category: "Information",
    description: "Display information about the bot.",
    permission: "Staff",
  },
  {
    command: ".hide",
    category: "Channels",
    description: "Hide a channel from members.",
    permission: "Staff",
  },
  {
    command: ".unhide",
    category: "Channels",
    description: "Make a hidden channel visible again.",
    permission: "Staff",
  },
  {
    command: ".say",
    category: "Messaging",
    description: "Send a message through the bot.",
    permission: "Staff",
  },
  {
    command: ".wiki",
    category: "Information",
    description: "Search for information using the bot.",
    permission: "Staff",
  },
  {
    command: ".setupverify",
    category: "Verification",
    description: "Configure the server verification system.",
    permission: "Staff",
  },
  {
    command: ".setup verify role",
    category: "Verification",
    description: "Configure the verified role.",
    permission: "Manage Roles",
  },
  {
    command: ".setup unverify role",
    category: "Verification",
    description: "Configure the unverified role.",
    permission: "Manage Roles",
  },
  {
    command: ".role",
    category: "Roles",
    description: "Manage verification-related roles.",
    permission: "Manage Roles",
  },
  {
    command: ".snipe",
    category: "Moderation",
    description: "View the most recently deleted message.",
    permission: "Manage Messages",
  },
  {
    command: ".atlogs",
    category: "Staff Activity",
    description: "View staff active-time logs.",
    permission: "Administrator / AT Logs",
  },
  {
    command: ".resetactivetime",
    category: "Staff Activity",
    description: "Reset staff active-time data.",
    permission: "Administrator / AT Logs",
  },
  {
    command: ".removeuser",
    category: "Staff Activity",
    description: "Remove a user from active-time tracking.",
    permission: "Administrator / AT Logs",
  },
  {
    command: ".activetime",
    category: "Staff Activity",
    description: "View your staff activity statistics.",
    permission: "Staff",
  },
  {
    command: ".wremove",
    category: "Warnings",
    description: "Remove a warning using its warning ID.",
    permission: "Staff",
  },
  {
    command: ".wreset",
    category: "Warnings",
    description: "Reset a user's warnings.",
    permission: "Staff",
  },
];

const categories = [
  "All",
  "Messaging",
  "Information",
  "Utility",
  "Channels",
  "Verification",
  "Roles",
  "Moderation",
  "Staff Activity",
  "Warnings",
];

export default function HQCPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedCommand, setSelectedCommand] = useState(null);

  const filteredCommands = useMemo(() => {
    const query = search.trim().toLowerCase();

    return commands.filter((item) => {
      const matchesCategory =
        category === "All" ||
        item.category === category;

      const matchesSearch =
        !query ||
        item.command.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="status-pill">
            <span className="status-dot" />
            Administrator Only
          </div>

          <h1 className="page-title">
            High Quality{" "}
            <span className="gradient-text">
              Commands
            </span>
          </h1>

          <p className="page-subtitle">
            A premium command reference for Pixel Villa
            staff systems.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: 24 }}>
        <div className="panel-label">
          COMMAND DIRECTORY
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 14,
          }}
        >
          <input
            className="glass-input"
            type="search"
            placeholder="Search commands..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            style={{
              flex: "1 1 280px",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 14,
          }}
        >
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={`glass-button ${
                category === item ? "primary" : ""
              }`}
              onClick={() => setCategory(item)}
              style={{
                padding: "8px 14px",
                fontSize: 12,
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">
            COMMANDS
          </div>

          <div className="stat-card-value">
            {filteredCommands.length}
          </div>

          <div className="stat-card-subtitle">
            Commands matching your filters
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            CATEGORIES
          </div>

          <div className="stat-card-value">
            {categories.length - 1}
          </div>

          <div className="stat-card-subtitle">
            Available command groups
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            ACCESS
          </div>

          <div className="stat-card-value">
            ADMIN
          </div>

          <div className="stat-card-subtitle">
            Restricted dashboard section
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        {filteredCommands.map((item) => (
          <button
            type="button"
            key={item.command}
            className="dashboard-card"
            onClick={() =>
              setSelectedCommand(item)
            }
            style={{
              textAlign: "left",
              width: "100%",
            }}
          >
            <div className="dashboard-card-icon">
              ✦
            </div>

            <div className="dashboard-card-content">
              <h3
                style={{
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                }}
              >
                {item.command}
              </h3>

              <p>{item.description}</p>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 10,
                }}
              >
                <span className="status-pill">
                  {item.category}
                </span>

                <span className="status-pill">
                  {item.permission}
                </span>
              </div>
            </div>

            <div className="dashboard-card-arrow">
              →
            </div>
          </button>
        ))}
      </section>

      {filteredCommands.length === 0 && (
        <div className="glass-panel">
          <div className="empty-state">
            No commands match your search.
          </div>
        </div>
      )}

      {selectedCommand && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setSelectedCommand(null)
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
                  COMMAND DETAILS
                </div>

                <h2 className="section-title">
                  {selectedCommand.command}
                </h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setSelectedCommand(null)
                }
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="detail-grid">
              <div className="detail-card">
                <span>Category</span>
                <strong>
                  {selectedCommand.category}
                </strong>
              </div>

              <div className="detail-card">
                <span>Permission</span>
                <strong>
                  {selectedCommand.permission}
                </strong>
              </div>
            </div>

            <div
              className="glass-panel"
              style={{
                marginTop: 18,
              }}
            >
              <div className="panel-label">
                DESCRIPTION
              </div>

              <p
                className="panel-description"
                style={{
                  marginTop: 8,
                }}
              >
                {selectedCommand.description}
              </p>
            </div>

            <div
              style={{
                marginTop: 20,
                padding: 14,
                borderRadius: 14,
                border:
                  "1px solid rgba(96, 165, 250, 0.16)",
                background:
                  "rgba(30, 64, 175, 0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#93c5fd",
                  marginBottom: 5,
                }}
              >
                COMMAND EXECUTION
              </div>

              <div
                style={{
                  fontSize: 13,
                  color:
                    "rgba(203, 213, 225, 0.65)",
                  lineHeight: 1.6,
                }}
              >
                This dashboard is currently a command
                reference. Commands are executed through
                the Pixel Villa Support Discord bot.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}