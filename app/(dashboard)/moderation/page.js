"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

const ACTIONS = {
warn: {
label: "Warn",
icon: "⚠️",
description: "Issue a warning to a member.",
color: "yellow",
},
mute: {
label: "Mute",
icon: "🔇",
description: "Temporarily timeout a member.",
color: "sky",
},
unmute: {
label: "Unmute",
icon: "🔊",
description: "Remove a member's timeout.",
color: "green",
},
kick: {
label: "Kick",
icon: "👢",
description: "Remove a member from the server.",
color: "orange",
adminOnly: true,
},
ban: {
label: "Ban",
icon: "🔨",
description: "Ban a member from the server.",
color: "red",
adminOnly: true,
},
unban: {
label: "Unban",
icon: "♻️",
description: "Remove a member's server ban.",
color: "green",
adminOnly: true,
},
};

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

async function waitForAction(actionId) {
const maxAttempts = 40;

for (let attempt = 0; attempt < maxAttempts; attempt++) {
  await new Promise((resolve) =>
    setTimeout(resolve, 1500)
  );

  const response = await fetch(
    `/api/moderation/action/status?actionId=${encodeURIComponent(
      actionId
    )}`,
    {
      cache: "no-store",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error ||
        "Failed to check action status."
    );
  }

  if (result.status === "completed") {
    return result;
  }

  if (result.status === "failed") {
    throw new Error(
      result.error ||
        "The moderation action failed."
    );
  }
}

throw new Error(
  "The bot did not finish the action within the expected time. Check the dashboard audit logs."
);

}

function selectAction(nextAction) {
if (
ACTIONS[nextAction]?.adminOnly &&
!isAdmin
) {
return;
}

setAction(nextAction);
setError("");
setMessage("");

}

async function performAction() {
setMessage("");
setError("");

const selectedAction = ACTIONS[action];

if (!selectedAction) {
  setError("Invalid moderation action.");
  return;
}

if (
  selectedAction.adminOnly &&
  !isAdmin
) {
  setError(
    "Administrator access is required for this action."
  );
  return;
}

const trimmedUserId = userId.trim();
const trimmedReason = reason.trim();

if (!trimmedUserId) {
  setError("Enter a Discord User ID.");
  return;
}

if (!/^\d{15,25}$/.test(trimmedUserId)) {
  setError("Enter a valid Discord User ID.");
  return;
}

if (!trimmedReason) {
  setError("Please enter a reason.");
  return;
}

setLoading(true);

try {
  const dashboardAction =
    action === "mute"
      ? "timeout"
      : action === "unmute"
        ? "remove-timeout"
        : action;

  const response = await fetch(
    "/api/moderation",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: dashboardAction,
        userId: trimmedUserId,
        reason: trimmedReason,
        duration:
          action === "mute"
            ? duration
            : undefined,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error ||
        "Failed to submit moderation action."
    );
  }

  if (!result.actionId) {
    throw new Error(
      "The moderation request was created without an action ID."
    );
  }

  setMessage(
    `${selectedAction.label} submitted. Waiting for the bot...`
  );

  const completed = await waitForAction(
    result.actionId
  );

  setMessage(
    completed.result ||
      `${selectedAction.label} completed for ${
        completed.targetUsername || trimmedUserId
      }.`
  );

  setUserId("");
  setReason("");
} catch (err) {
  setMessage("");
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

const selectedAction = ACTIONS[action];

return (
<div>
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
      {loading ? "⏳ " : "✅ "}
      {message}
    </div>
  )}

  <div className="section-heading">
    <div>
      <h2>Staff Actions</h2>

      <p>
        Actions available to staff members.
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
      }}
    >
      {["warn", "mute", "unmute"].map(
        (actionName) => {
          const item = ACTIONS[actionName];
          const selected =
            action === actionName;

          return (
            <button
              key={actionName}
              type="button"
              onClick={() =>
                selectAction(actionName)
              }
              disabled={loading}
              className="glass-button"
              style={{
                border: selected
                  ? "1px solid rgba(56, 189, 248, 0.35)"
                  : undefined,
                background: selected
                  ? "rgba(56, 189, 248, 0.08)"
                  : undefined,
              }}
            >
              {item.icon} {item.label}
            </button>
          );
        }
      )}
    </div>
  </div>

  {isAdmin && (
    <>
      <div className="section-heading">
        <div>
          <h2>Administrator Actions</h2>

          <p>
            These actions are restricted to
            administrators.
          </p>
        </div>

        <div className="glass-badge">
          ADMIN ONLY
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
          }}
        >
          {["kick", "ban", "unban"].map(
            (actionName) => {
              const item =
                ACTIONS[actionName];

              const selected =
                action === actionName;

              return (
                <button
                  key={actionName}
                  type="button"
                  onClick={() =>
                    selectAction(actionName)
                  }
                  disabled={loading}
                  className="glass-button"
                  style={{
                    border: selected
                      ? "1px solid rgba(248, 113, 113, 0.4)"
                      : undefined,
                    background: selected
                      ? "rgba(248, 113, 113, 0.08)"
                      : undefined,
                  }}
                >
                  {item.icon} {item.label}
                </button>
              );
            }
          )}
        </div>
      </div>
    </>
  )}

  <div className="section-heading">
    <div>
      <h2>Moderation Action</h2>

      <p>
        {selectedAction.description}
      </p>
    </div>
  </div>

  <div
    className="glass-card"
    style={{ marginBottom: 20 }}
  >
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
        disabled={loading}
      />

      <p
        style={{
          margin: "7px 0 0",
          color:
            "rgba(148, 163, 184, 0.55)",
          fontSize: 12,
        }}
      >
        Enter the Discord ID of the member
        you want to moderate.
      </p>
    </div>

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
          disabled={loading}
        >
          <option value="1m">
            1 minute
          </option>

          <option value="5m">
            5 minutes
          </option>

          <option value="10m">
            10 minutes
          </option>

          <option value="30m">
            30 minutes
          </option>

          <option value="1h">
            1 hour
          </option>

          <option value="2h">
            2 hours
          </option>

          <option value="6h">
            6 hours
          </option>

          <option value="12h">
            12 hours
          </option>

          <option value="1d">
            1 day
          </option>

          <option value="3d">
            3 days
          </option>

          <option value="7d">
            7 days
          </option>
        </select>
      </div>
    )}

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
        disabled={loading}
      />
    </div>

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
        ? "⏳ Waiting for bot..."
        : `${selectedAction.icon} ${selectedAction.label} Member`}
    </button>
  </div>

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
      Every dashboard moderation action is
      verified against your dashboard
      permissions and recorded in the Pixel
      Villa audit log.
    </p>
  </div>
</div>

);
}