import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/firebaseAdmin";

// GET — search one user's warnings. Non-admins are forced to their own
// ID no matter what they pass in, so nobody can view someone else's
// warnings just by editing the query string.
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

  const doc = await db.collection("warnings").doc(userId).get();
  const warnings = doc.exists ? doc.data().warnings || [] : [];

  return NextResponse.json({ userId, warnings });
}

// POST — add a warning. Admins only. Mirrors warn.js exactly: 6-digit
// random ID, moderator stored as a tag string, ISO timestamp.
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const { userId, reason } = await req.json();
  if (!userId || !reason) {
    return NextResponse.json({ error: "userId and reason required" }, { status: 400 });
  }

  const ref = db.collection("warnings").doc(userId);
  const doc = await ref.get();
  const warnings = doc.exists ? doc.data().warnings || [] : [];

  const newWarning = {
    id: Math.floor(100000 + Math.random() * 900000).toString(),
    moderator: session.user.username,
    reason,
    timestamp: new Date().toISOString(),
  };

  warnings.push(newWarning);
  await ref.set({ warnings });

  return NextResponse.json({ ok: true, warning: newWarning });
}

// DELETE — remove one warning by ID. Admins only. Matches wremove.js:
// deletes the whole doc if that was their last warning, otherwise just
// updates the array.
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const { userId, warningId } = await req.json();
  if (!userId || !warningId) {
    return NextResponse.json({ error: "userId and warningId required" }, { status: 400 });
  }

  const ref = db.collection("warnings").doc(userId);
  const doc = await ref.get();
  if (!doc.exists) {
    return NextResponse.json({ error: "No warnings found for this user" }, { status: 404 });
  }

  const warnings = doc.data().warnings || [];
  const idx = warnings.findIndex((w) => w.id === warningId);
  if (idx === -1) {
    return NextResponse.json({ error: "Warning ID not found" }, { status: 404 });
  }

  warnings.splice(idx, 1);

  if (warnings.length === 0) {
    await ref.delete();
  } else {
    await ref.set({ warnings });
  }

  return NextResponse.json({ ok: true });
}