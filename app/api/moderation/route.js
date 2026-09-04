import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { timeoutMember, removeTimeout, getMemberInfo } from "@/lib/discord";

const LOG_CHANNEL_ID = process.env.DISCORD_LOG_CHANNEL_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

async function postLog(description, color) {
  if (!LOG_CHANNEL_ID) return;
  try {
    await fetch(`https://discord.com/api/v10/channels/${LOG_CHANNEL_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [{ description, color, timestamp: new Date().toISOString() }],
      }),
    });
  } catch (err) {
    console.error("Failed to post moderation log:", err);
  }
}

// Admins only. Mute/unmute here use Discord's native timeout feature —
// mod.js has no mute/unmute commands to reuse, so this is new capability,
// not ported bot logic. Nothing is written to Firestore (matching mod.js's
// own behavior); actions are logged to the Discord log channel instead,
// same as kick/ban already do.
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const { userId, action, durationMinutes, reason } = await req.json();
  if (!userId || !action) {
    return NextResponse.json({ error: "userId and action required" }, { status: 400 });
  }

  const info = await getMemberInfo(userId);
  if (!info.isMember) {
    return NextResponse.json({ error: "That user is not in the server" }, { status: 404 });
  }

  if (action === "mute") {
    const minutes = Math.min(Math.max(parseInt(durationMinutes) || 10, 1), 40320); // 1 min – 28 days
    const result = await timeoutMember(userId, minutes * 60 * 1000, reason || "No reason provided");
    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Failed to mute" }, { status: 500 });
    }
    await postLog(
      `🔇 **Member Muted (Dashboard)**\n\n**User:** ${info.username} (\`${userId}\`)\n**Duration:** ${minutes} minute(s)\n**Reason:** ${reason || "No reason provided"}\n**Moderator:** ${session.user.username}`,
      0xed4245
    );
    return NextResponse.json({ ok: true });
  }

  if (action === "unmute") {
    const result = await removeTimeout(userId, reason || "No reason provided");
    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Failed to unmute" }, { status: 500 });
    }
    await postLog(
      `🔊 **Member Unmuted (Dashboard)**\n\n**User:** ${info.username} (\`${userId}\`)\n**Moderator:** ${session.user.username}`,
      0x57f287
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}