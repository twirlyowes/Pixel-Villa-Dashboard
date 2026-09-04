import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

const STAFF_USER_IDS = (process.env.STAFF_USER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

function serializeDate(value) {
  if (!value) return null;

  if (typeof value?.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const sessionUserId = session.user?.discordId;
    const isAdmin = session.user?.isAdmin === true;

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId")?.trim();

    /*
     * Normal staff:
     * Can ONLY view their own AFK status.
     */
    const userId = isAdmin
      ? requestedUserId || sessionUserId
      : sessionUserId;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    /*
     * Admins can check any user.
     * Normal staff can only check themselves.
     */
    if (!isAdmin && userId !== sessionUserId) {
      return NextResponse.json(
        { error: "Forbidden." },
        { status: 403 }
      );
    }

    /*
     * If STAFF_USER_IDS exists, make sure normal staff
     * are actually part of the configured staff list.
     */
    if (
      !isAdmin &&
      STAFF_USER_IDS.length > 0 &&
      !STAFF_USER_IDS.includes(userId)
    ) {
      return NextResponse.json(
        { error: "You are not registered as staff." },
        { status: 403 }
      );
    }

    const doc = await db.collection("afk").doc(userId).get();

    if (!doc.exists) {
      return NextResponse.json({
        success: true,
        isAfk: false,
        userId,
        reason: null,
        since: null,
      });
    }

    const data = doc.data();

    return NextResponse.json({
      success: true,
      isAfk: true,
      userId,
      reason: data.reason || "No reason provided.",
      since: serializeDate(data.time),
    });
  } catch (error) {
    console.error("AFK API ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load AFK status.",
      },
      { status: 500 }
    );
  }
}