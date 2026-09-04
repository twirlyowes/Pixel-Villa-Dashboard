import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

const STAFF_USER_IDS = (process.env.STAFF_USER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

function isValidDiscordId(id) {
  return /^\d{15,25}$/.test(id);
}

function millisecondsToSeconds(value) {
  const ms = Number(value) || 0;

  if (ms <= 0) return 0;

  return Math.floor(ms / 1000);
}

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

export async function GET() {
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

    const snapshot = await db
      .collection("activetime")
      .get();

    let staff = snapshot.docs
      .filter((doc) => {
        const userId = doc.id;

        // Only allow IDs that are actually in STAFF_USER_IDS.
        if (STAFF_USER_IDS.length > 0) {
          return STAFF_USER_IDS.includes(userId);
        }

        // Fallback if the environment variable is missing.
        return isValidDiscordId(userId);
      })
      .map((doc) => {
        const data = doc.data();

        return {
          userId: doc.id,

          username:
            data.username ||
            data.name ||
            data.tag ||
            doc.id,

          // Bot stores milliseconds.
          // Dashboard uses seconds.
          activeTime: millisecondsToSeconds(
            data.activeTime
          ),

          messages:
            Number(data.messages) || 0,

          commands:
            Number(data.commands) || 0,

          updatedAt:
            serializeDate(data.updatedAt),
        };
      });

    /*
     * Normal staff should only see their own activity.
     * Admins can see the complete staff leaderboard.
     */
    if (!isAdmin) {
      staff = staff.filter(
        (member) =>
          member.userId === sessionUserId
      );
    }

    staff.sort(
      (a, b) =>
        b.activeTime - a.activeTime
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