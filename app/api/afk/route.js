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

    const snapshot = await db.collection("afk").get();

    const users = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        userId: doc.id,
        username:
          data.username ||
          data.name ||
          data.tag ||
          doc.id,
        reason: data.reason || "No reason provided",
        time:
          data.time?.toDate?.()?.toISOString?.() ||
          data.time ||
          null,
      };
    });

    users.sort((a, b) => {
      const aTime = new Date(a.time || 0).getTime();
      const bTime = new Date(b.time || 0).getTime();

      return bTime - aTime;
    });

    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error) {
    console.error("AFK API ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load AFK users.",
      },
      { status: 500 }
    );
  }
}