const GUILD_ID = process.env.DISCORD_GUILD_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

const STAFF_ROLE_IDS = (process.env.STAFF_ROLE_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

// Legacy support for older deployments.
const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || "")
  .split(",")
  .map((name) => name.trim().toLowerCase())
  .filter(Boolean);

async function discordFetch(path, options = {}) {
  if (!BOT_TOKEN) {
    throw new Error("DISCORD_BOT_TOKEN is not configured.");
  }

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
    if (!userId || !GUILD_ID) {
      return { isMember: false };
    }

    const res = await discordFetch(
      `/guilds/${GUILD_ID}/members/${userId}`
    );

    if (!res.ok) {
      return { isMember: false };
    }

    const member = await res.json();

    const roles = member.roles || [];
    const username = member.user?.username || null;
    const actualUserId = member.user?.id || userId;

    const isStaff = roles.some((roleId) =>
      STAFF_ROLE_IDS.includes(roleId)
    );

    const isAdminById = ADMIN_USER_IDS.includes(
      actualUserId
    );

    const isAdminByUsername = username
      ? ADMIN_USERNAMES.includes(
          username.toLowerCase()
        )
      : false;

    return {
      isMember: true,
      userId: actualUserId,
      username,
      roles,
      isStaff,
      isAdmin: isAdminById || isAdminByUsername,
    };
  } catch (error) {
    console.error("getMemberInfo error:", error);

    return {
      isMember: false,
    };
  }
}

// Find a Pixel Villa guild member by Discord username.
export async function getMemberInfoByUsername(username) {
  try {
    if (!GUILD_ID) {
      return {
        isMember: false,
      };
    }

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

    const isAdminById = ADMIN_USER_IDS.includes(
      userId
    );

    const isAdminByUsername =
      ADMIN_USERNAMES.includes(
        actualUsername.toLowerCase()
      );

    return {
      isMember: true,
      userId,
      username: actualUsername,
      roles,
      isStaff,
      isAdmin:
        isAdminById || isAdminByUsername,
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
    if (!userId || !GUILD_ID) {
      return {
        ok: false,
        error: "Missing Discord guild or user ID.",
      };
    }

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
    console.error(
      "timeoutMember error:",
      error
    );

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
    if (!userId || !GUILD_ID) {
      return {
        ok: false,
        error: "Missing Discord guild or user ID.",
      };
    }

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
    console.error(
      "removeTimeout error:",
      error
    );

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
        error: "Missing Discord channel ID.",
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

/**
 * Create a DM channel with a Discord user.
 *
 * This uses the bot account to open a DM channel.
 */
export async function createDMChannel(userId) {
  try {
    if (!userId) {
      return {
        ok: false,
        error: "Missing Discord user ID.",
      };
    }

    const res = await discordFetch(
      "/users/@me/channels",
      {
        method: "POST",
        body: JSON.stringify({
          recipient_id: userId,
        }),
      }
    );

    if (!res.ok) {
      const errorText =
        await res.text().catch(() => "");

      console.error(
        "Discord create DM failed:",
        res.status,
        errorText
      );

      let errorMessage = errorText;

      try {
        const parsed = JSON.parse(errorText);
        errorMessage =
          parsed.message || errorText;
      } catch {
        // Keep raw response text.
      }

      return {
        ok: false,
        error:
          errorMessage ||
          `Discord API error (${res.status})`,
      };
    }

    const channel = await res.json();

    if (!channel.id) {
      return {
        ok: false,
        error:
          "Discord returned a DM channel without an ID.",
      };
    }

    return {
      ok: true,
      channelId: channel.id,
    };
  } catch (error) {
    console.error(
      "createDMChannel error:",
      error
    );

    return {
      ok: false,
      error:
        error.message ||
        "Failed to create Discord DM channel.",
    };
  }
}

/**
 * Send a direct message to a Discord user.
 */
export async function sendDM(userId, content) {
  try {
    if (!userId) {
      return {
        ok: false,
        error: "Missing Discord user ID.",
      };
    }

    if (!content) {
      return {
        ok: false,
        error: "Missing DM content.",
      };
    }

    const dm = await createDMChannel(userId);

    if (!dm.ok) {
      return dm;
    }

    const res = await discordFetch(
      `/channels/${dm.channelId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          content,
        }),
      }
    );

    if (!res.ok) {
      const errorText =
        await res.text().catch(() => "");

      console.error(
        "Discord send DM failed:",
        res.status,
        errorText
      );

      let errorMessage = errorText;

      try {
        const parsed = JSON.parse(errorText);
        errorMessage =
          parsed.message || errorText;
      } catch {
        // Keep raw response text.
      }

      return {
        ok: false,
        error:
          errorMessage ||
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
      "sendDM error:",
      error
    );

    return {
      ok: false,
      error:
        error.message ||
        "Failed to send Discord DM.",
    };
  }
}