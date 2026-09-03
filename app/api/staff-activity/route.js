import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function GET() {
  const snap = await db.collection("activetime").get();

  const staff = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  // Highest active time first
  staff.sort((a, b) => (b.activeSeconds || 0) - (a.activeSeconds || 0));

  return NextResponse.json({ staff });
}
