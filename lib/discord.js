// Checks whether a logged-in Discord user is staff on Pixel Villa,
// using the bot's own token to look up their guild member roles.
// This is what actually gates dashboard access — OAuth login alone
// only proves "this is a real Discord account", not "this person is staff".

const GUILD_ID = process.env.DISCORD_GUILD_ID;
const STAFF_ROLE_IDS = (process.env.STAFF_ROLE_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export async function getStaffRoles(discordUserId) {
  const res = await fetch(
    `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordUserId}`,
    {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
      // Avoid Next.js caching a stale membership/role list
      cache: "no-store",
    }
  );

  if (!res.ok) {
    // Not in the server (404) or another API error — treat as not staff
    return [];
  }

  const member = await res.json();
  const roles = member.roles || [];
  return roles.filter((r) => STAFF_ROLE_IDS.includes(r));
}

export async function isStaff(discordUserId) {
  const staffRoles = await getStaffRoles(discordUserId);
  return staffRoles.length > 0;
}
