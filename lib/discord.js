// Talks to Discord's REST API directly using the bot token — no discord.js
// dependency needed here since this runs in Next.js API routes, not a
// persistent gateway connection.

const GUILD_ID = process.env.DISCORD_GUILD_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

const STAFF_ROLE_IDS = (process.env.STAFF_ROLE_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || "")
  .split(",")
  .map((name) => name.trim().toLowerCase())
  .filter(Boolean);

async function discordFetch(path, options = {}) {
  return fetch(`https://discord.com/api/v10${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
}

// Looks up a Discord user ID against the real Pixel Villa guild and
// returns their LIVE membership/role/admin status. This is the single
// source of truth for who's allowed in and what they can see — nothing
// here is based on what a user typed, only what Discord actually reports
// at the moment they log in.
export async function getMemberInfo(userId) {
  try {
    const res = await discordFetch(`/guilds/${GUILD_ID}/members/${userId}`);

    if (!res.ok) {
      // 404 = not a member of the guild (or a bad/fake ID)
      return { isMember: false };
    }

    const member = await res.json();
    const roles = member.roles || [];
    const username = member.user?.username || null;

    const isStaff = roles.some((r) => STAFF_ROLE_IDS.includes(r));
    const isAdmin = username
      ? ADMIN_USERNAMES.includes(username.toLowerCase())
      : false;

    return { isMember: true, username, roles, isStaff, isAdmin };
  } catch (error) {
    console.error("getMemberInfo error:", error);
    return { isMember: false };
  }
}

// Applies a Discord timeout ("mute"). durationMs should already be
// clamped by the caller to Discord's own 28-day maximum.
export async function timeoutMember(userId, durationMs, reason) {
  try {
    const until = new Date(Date.now() + durationMs).toISOString();
    const res = await discordFetch(`/guilds/${GUILD_ID}/members/${userId}`, {
      method: "PATCH",
      headers: { "X-Audit-Log-Reason": reason || "No reason provided" },
      body: JSON.stringify({ communication_disabled_until: until }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.message || `Discord API error (${res.status})` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function removeTimeout(userId, reason) {
  try {
    const res = await discordFetch(`/guilds/${GUILD_ID}/members/${userId}`, {
      method: "PATCH",
      headers: { "X-Audit-Log-Reason": reason || "No reason provided" },
      body: JSON.stringify({ communication_disabled_until: null }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.message || `Discord API error (${res.status})` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}