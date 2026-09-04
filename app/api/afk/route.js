import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/firebaseAdmin";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  let userId = searchParams.get("userId");

  if (!session.user.isAdmin) {
    userId = session.user.discordId;
  }

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const doc = await db.collection("afk").doc(userId).get();
  if (!doc.exists) {
    return NextResponse.json({ userId, isAfk: false });
  }

  const data = doc.data();
  return NextResponse.json({
    userId,
    isAfk: true,
    reason: data.reason,
    since: data.time,
  });
}