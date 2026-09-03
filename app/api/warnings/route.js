import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function GET() {
  const snap = await db
    .collection("warnings")
    .orderBy("timestamp", "desc")
    .limit(200)
    .get();

  const warnings = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ warnings });
}

export async function DELETE(req) {
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  await db.collection("warnings").doc(id).delete();
  return NextResponse.json({ ok: true });
}
