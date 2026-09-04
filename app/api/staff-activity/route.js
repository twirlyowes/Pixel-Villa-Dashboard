import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const snapshot = await db
      .collection("activetime")
      .get();

    const staff = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        userId: doc.id,
        username:
          data.username ||
          data.name ||
          data.tag ||
          doc.id,

        activeTime: Number(data.activeTime) || 0,
        messages: Number(data.messages) || 0,
        commands: Number(data.commands) || 0,

        updatedAt:
          data.updatedAt?.toDate?.()?.toISOString?.() ||
          data.updatedAt ||
          null,
      };
    });

    staff.sort(
      (a, b) =>
        Number(b.activeTime) -
        Number(a.activeTime)
    );

    return NextResponse.json({
      success: true,
      staff,
      count: staff.length,
    });
  } catch (error) {
    console.error(
      "STAFF ACTIVITY API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load staff activity.",
      },
      { status: 500 }
    );
  }
}