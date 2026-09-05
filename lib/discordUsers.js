// Resolves Discord User IDs to usernames using the bot token
// (via lib/discord.js's getMemberInfo, which hits the Discord API).
//
// Results are cached in-memory per server process for a few minutes
// so pages/lists with many IDs don't hammer the Discord API on every
// request. This only helps because the dashboard runs as a long-lived
// Node process on Render — it resets on redeploy/restart, which is fine.

import { getMemberInfo } from "@/lib/discord";

const CACHE_TTL_MS = 5 * 60 * 1000;

const cache = new Map();
// userId -> { username: string | null, expiresAt: number }

async function resolveOne(userId) {
  const cached = cache.get(userId);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.username;
  }

  let username = null;

  try {
    const info = await getMemberInfo(userId);
    username = info?.isMember ? info.username || null : null;
  } catch (error) {
    console.error("resolveUsername error:", error);
  }

  cache.set(userId, {
    username,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return username;
}

/**
 * Resolve a single Discord User ID to a username.
 * Falls back to returning the raw ID if the lookup fails
 * or the user isn't found in the guild.
 */
export async function resolveUsername(userId) {
  if (!userId) return null;

  const username = await resolveOne(userId);

  return username || userId;
}

/**
 * Resolve many Discord User IDs at once.
 * Returns a map of { [userId]: usernameOrFallbackId }.
 */
export async function resolveUsernames(userIds = []) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];

  const map = {};

  await Promise.all(
    uniqueIds.map(async (id) => {
      map[id] = await resolveUsername(id);
    })
  );

  return map;
}
