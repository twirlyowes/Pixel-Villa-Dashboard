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

// Get a member using their Discord User ID.
export async function getMemberInfo(userId) {
  try {
    const res = await discordFetch(
      `/guilds/${GUILD_ID}/members/${userId}`
    );

    if (!res.ok) {
      return { isMember: false };
    }

    const member = await res.json();

    const roles = member.roles || [];
    const username = member.user?.username || null;

    const isStaff = roles.some((roleId) =>
      STAFF_ROLE_IDS.includes(roleId)
    );

    const isAdmin = username
      ? ADMIN_USERNAMES.includes(
          username.toLowerCase()
        )
      : false;

    return {
      isMember: true,
      userId: member.user?.id || userId,
      username,
      roles,
      isStaff,
      isAdmin,
    };
  } catch (error) {
    console.error(
      "getMemberInfo error:",
      error
    );

    return {
      isMember: false,
    };
  }
}

// Find a Pixel Villa guild member by Discord username.
export async function getMemberInfoByUsername(
  username
) {
  try {
    const cleanUsername = username
      .trim()
      .replace(/^@/, "");

    if (!cleanUsername) {
      return {
        isMember: false,
      };
    }

    const res = await discordFetch(
      `/guilds/${GUILD_ID}/members?query=${encodeURIComponent(
        cleanUsername
      )}&limit=100`
    );

    if (!res.ok) {
      const errorText =
        await res.text().catch(() => "");

      console.error(
        "Discord username lookup failed:",
        res.status,
        errorText
      );

      return {
        isMember: false,
      };
    }

    const members = await res.json();

    const member = members.find(
      (m) =>
        m.user?.username?.toLowerCase() ===
        cleanUsername.toLowerCase()
    );

    if (!member) {
      return {
        isMember: false,
      };
    }

    const userId = member.user.id;
    const roles = member.roles || [];
    const actualUsername =
      member.user.username;

    const isStaff = roles.some((roleId) =>
      STAFF_ROLE_IDS.includes(roleId)
    );

    const isAdmin = ADMIN_USERNAMES.includes(
      actualUsername.toLowerCase()
    );

    return {
      isMember: true,
      userId,
      username: actualUsername,
      roles,
      isStaff,
      isAdmin,
    };
  } catch (error) {
    console.error(
      "getMemberInfoByUsername error:",
      error
    );

    return {
      isMember: false,
    };
  }
}

// Applies a Discord timeout.
export async function timeoutMember(
  userId,
  durationMs,
  reason
) {
  try {
    const until = new Date(
      Date.now() + durationMs
    ).toISOString();

    const res = await discordFetch(
      `/guilds/${GUILD_ID}/members/${userId}`,
      {
        method: "PATCH",
        headers: {
          "X-Audit-Log-Reason":
            reason || "No reason provided",
        },
        body: JSON.stringify({
          communication_disabled_until:
            until,
        }),
      }
    );

    if (!res.ok) {
      const err =
        await res.json().catch(() => ({}));

      return {
        ok: false,
        error:
          err.message ||
          `Discord API error (${res.status})`,
      };
    }

    return {
      ok: true,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

// Remove a Discord timeout.
export async function removeTimeout(
  userId,
  reason
) {
  try {
    const res = await discordFetch(
      `/guilds/${GUILD_ID}/members/${userId}`,
      {
        method: "PATCH",
        headers: {
          "X-Audit-Log-Reason":
            reason || "No reason provided",
        },
        body: JSON.stringify({
          communication_disabled_until:
            null,
        }),
      }
    );

    if (!res.ok) {
      const err =
        await res.json().catch(() => ({}));

      return {
        ok: false,
        error:
          err.message ||
          `Discord API error (${res.status})`,
      };
    }

    return {
      ok: true,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

// Send a message to a Discord channel.
export async function sendDiscordChannelMessage(
  channelId,
  payload
) {
  try {
    if (!channelId) {
      return {
        ok: false,
        error:
          "Missing Discord channel ID.",
      };
    }

    const res = await discordFetch(
      `/channels/${channelId}/messages`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const errorText =
        await res.text().catch(() => "");

      console.error(
        "Discord channel message failed:",
        res.status,
        errorText
      );

      return {
        ok: false,
        error:
          errorText ||
          `Discord API error (${res.status})`,
      };
    }

    const message = await res.json();

    return {
      ok: true,
      message,
    };
  } catch (error) {
    console.error(
      "sendDiscordChannelMessage error:",
      error
    );

    return {
      ok: false,
      error: error.message,
    };
  }
}