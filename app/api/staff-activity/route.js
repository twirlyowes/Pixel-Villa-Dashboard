import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/firebaseAdmin";

// Admins with no userId param get the full leaderboard (today's data
// only — the bot zeroes this collection out daily, there's no history).
// Everyone else only ever gets their own single doc.
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const requestedId = searchParams.get("userId");

  if (session.user.isAdmin && !requestedId) {
    const snap = await db.collection("activetime").get();
    const staff = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    staff.sort((a, b) => (b.activeTime || 0) - (a.activeTime || 0));
    return NextResponse.json({ mode: "leaderboard", staff });
  }

  const userId = session.user.isAdmin ? requestedId : session.user.discordId;
  const doc = await db.collection("activetime").doc(userId).get();
  const stats = doc.exists
    ? doc.data()
    : { activeTime: 0, voiceTime: 0, messages: 0, commands: 0 };

  return NextResponse.json({ mode: "individual", userId, stats });
}