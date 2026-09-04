import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/firebaseAdmin";
import {
  sendDiscordChannelMessage,
} from "@/lib/discord";

export const dynamic = "force-dynamic";

const WARNING_LOG_CHANNEL_ID =
  process.env.WARNING_LOG_CHANNEL_ID ||
  "1510632065622741029";

function validDiscordId(id) {
  return /^\d{15,25}$/.test(id);
}

function serializeWarnings(warnings) {
  return (warnings || []).map((warning) => ({
    ...warning,
    timestamp:
      warning.timestamp?.toDate?.()?.toISOString?.() ||
      warning.timestamp ||
      null,
  }));
}

export async function GET(request) {
  try {
    const session =
      await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const requestedUserId =
      searchParams.get("userId")?.trim();

    const sessionUserId =
      session.user?.discordId;

    const isAdmin =
      session.user?.isAdmin === true;

    const userId =
      requestedUserId || sessionUserId;

    if (!userId || !validDiscordId(userId)) {
      return NextResponse.json(
        {
          error:
            "A valid Discord User ID is required.",
        },
        { status: 400 }
      );
    }

    if (!isAdmin && userId !== sessionUserId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const doc = await db
      .collection("warnings")
      .doc(userId)
      .get();

    if (!doc.exists) {
      return NextResponse.json({
        success: true,
        userId,
        warnings: [],
        count: 0,
      });
    }

    const data = doc.data();

    const warnings =
      serializeWarnings(data?.warnings);

    return NextResponse.json({
      success: true,
      userId,
      warnings,
      count: warnings.length,
    });
  } catch (error) {
    console.error(
      "WARNINGS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load warnings.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session =
      await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user?.isAdmin !== true) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const userId =
      body?.userId?.trim();

    const reason =
      body?.reason?.trim();

    if (!validDiscordId(userId)) {
      return NextResponse.json(
        {
          error:
            "A valid Discord User ID is required.",
        },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        {
          error:
            "Warning reason is required.",
        },
        { status: 400 }
      );
    }

    if (reason.length > 1000) {
      return NextResponse.json(
        {
          error:
            "Warning reason is too long.",
        },
        { status: 400 }
      );
    }

    const warning = {
      id: String(Date.now()),
      moderator:
        session.user?.discordId ||
        session.user?.username ||
        "Unknown",
      reason,
      timestamp: new Date().toISOString(),
    };

    const ref = db
      .collection("warnings")
      .doc(userId);

    const existing = await ref.get();

    const currentWarnings = existing.exists
      ? existing.data()?.warnings || []
      : [];

    const updatedWarnings = [
      ...currentWarnings,
      warning,
    ];

    // Save first. Discord logging should never
    // prevent the warning from being recorded.
    await ref.set({
      warnings: updatedWarnings,
    });

    // Send Discord log.
    const logResult =
      await sendDiscordChannelMessage(
        WARNING_LOG_CHANNEL_ID,
        {
          embeds: [
            {
              title: "⚠️ Warning Issued",
              description:
                "A warning was issued from the Pixel Villa Dashboard.",
              fields: [
                {
                  name: "User ID",
                  value: `\`${userId}\``,
                  inline: true,
                },
                {
                  name: "Moderator",
                  value: `<@${session.user?.discordId}>`,
                  inline: true,
                },
                {
                  name: "Warning ID",
                  value: `\`${warning.id}\``,
                  inline: true,
                },
                {
                  name: "Reason",
                  value: reason,
                  inline: false,
                },
              ],
              timestamp:
                warning.timestamp,
            },
          ],
        }
      );

    return NextResponse.json({
      success: true,
      warning,
      warningCount:
        updatedWarnings.length,
      loggedToDiscord:
        logResult.ok,
    });
  } catch (error) {
    console.error(
      "WARNINGS POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create warning.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session =
      await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user?.isAdmin !== true) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const userId =
      searchParams.get("userId")?.trim();

    const warningId =
      searchParams.get("warningId")?.trim();

    if (
      !validDiscordId(userId) ||
      !warningId
    ) {
      return NextResponse.json(
        {
          error:
            "Valid userId and warningId are required.",
        },
        { status: 400 }
      );
    }

    const ref = db
      .collection("warnings")
      .doc(userId);

    const doc = await ref.get();

    if (!doc.exists) {
      return NextResponse.json(
        {
          error:
            "Warning record not found.",
        },
        { status: 404 }
      );
    }

    const warnings =
      doc.data()?.warnings || [];

    const updatedWarnings =
      warnings.filter(
        (warning) =>
          String(warning.id) !==
          String(warningId)
      );

    if (
      updatedWarnings.length ===
      warnings.length
    ) {
      return NextResponse.json(
        {
          error:
            "Warning not found.",
        },
        { status: 404 }
      );
    }

    if (updatedWarnings.length === 0) {
      await ref.delete();
    } else {
      await ref.set({
        warnings: updatedWarnings,
      });
    }

    return NextResponse.json({
      success: true,
      warningId,
      remainingWarnings:
        updatedWarnings.length,
    });
  } catch (error) {
    console.error(
      "WARNINGS DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to remove warning.",
      },
      { status: 500 }
    );
  }
}