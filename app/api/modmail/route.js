import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function GET() {
  const snap = await db
    .collection("modmailTickets")
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();

  const tickets = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ tickets });
}

export async function PATCH(req) {
  const { id, status } = await req.json();
  if (!id || !status) {
    return NextResponse.json(
      { error: "id and status required" },
      { status: 400 }
    );
  }
  await db.collection("modmailTickets").doc(id).update({ status });
  return NextResponse.json({ ok: true });
}
