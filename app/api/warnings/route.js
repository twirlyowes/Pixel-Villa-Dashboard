import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/firebaseAdmin";
import { sendDiscordChannelMessage } from "@/lib/discord";

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

function getSessionUser(session) {
  return {
    userId: session?.user?.discordId,
    isAdmin: session?.user?.isAdmin === true,
    role: session?.user?.role || "staff",
  };
}

async function writeAuditLog({
  session,
  action,
  targetUserId,
  reason,
  success,
  status,
  error,
  warningId,
}) {
  try {
    await db.collection("dashboardAuditLogs").add({
      actor: session?.user?.discordId || "Unknown",
      actorUserId: session?.user?.discordId || "Unknown",
      actorUsername: session?.user?.username || "Unknown",
      action,
      targetUserId: targetUserId || null,
      warningId: warningId || null,
      reason: reason || null,
      success: success === true,
      status: status || null,
      error: error || null,
      source: "dashboard",
      createdAt: new Date(),
      timestamp: Date.now(),
    });
  } catch (auditError) {
    console.error("WARNING AUDIT LOG ERROR:", auditError);
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId: sessionUserId, isAdmin } =
      getSessionUser(session);

    const { searchParams } = new URL(request.url);

    const requestedUserId =
      searchParams.get("userId")?.trim();

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
      await writeAuditLog({
        session,
        action: "view-warnings",
        targetUserId: userId,
        success: false,
        status: "forbidden",
        error: "User attempted to view another user's warnings.",
      });

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

    const warnings = serializeWarnings(
      doc.data()?.warnings
    );

    return NextResponse.json({
      success: true,
      userId,
      warnings,
      count: warnings.length,
    });
  } catch (error) {
    console.error("WARNINGS GET ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load warnings.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { sessionUserId, isAdmin } = {
      sessionUserId: session.user?.discordId,
      isAdmin: session.user?.isAdmin === true,
    };

    if (!sessionUserId || !validDiscordId(sessionUserId)) {
      return NextResponse.json(
        { error: "Invalid authenticated user." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const userId = body?.userId?.trim();
    const reason = body?.reason?.trim();

    if (!validDiscordId(userId)) {
      await writeAuditLog({
        session,
        action: "issue-warning",
        targetUserId: userId,
        reason,
        success: false,
        status: "invalid",
        error: "Invalid Discord User ID.",
      });

      return NextResponse.json(
        {
          error:
            "A valid Discord User ID is required.",
        },
        { status: 400 }
      );
    }

    if (!reason) {
      await writeAuditLog({
        session,
        action: "issue-warning",
        targetUserId: userId,
        success: false,
        status: "invalid",
        error: "Warning reason is required.",
      });

      return NextResponse.json(
        {
          error: "Warning reason is required.",
        },
        { status: 400 }
      );
    }

    if (reason.length > 1000) {
      await writeAuditLog({
        session,
        action: "issue-warning",
        targetUserId: userId,
        reason,
        success: false,
        status: "invalid",
        error: "Warning reason is too long.",
      });

      return NextResponse.json(
        {
          error: "Warning reason is too long.",
        },
        { status: 400 }
      );
    }

    const warning = {
      id: `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      moderator: sessionUserId,
      reason,
      timestamp: new Date().toISOString(),
    };

    const ref = db
      .collection("warnings")
      .doc(userId);

    const existing = await ref.get();

    const currentWarnings = existing.exists
      ? Array.isArray(existing.data()?.warnings)
        ? existing.data().warnings
        : []
      : [];

    const updatedWarnings = [
      ...currentWarnings,
      warning,
    ];

    await ref.set({
      warnings: updatedWarnings,
      updatedAt: new Date(),
    });

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
                  value: `<@${sessionUserId}>`,
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
              timestamp: warning.timestamp,
            },
          ],
        }
      );

    await writeAuditLog({
      session,
      action: "issue-warning",
      targetUserId: userId,
      reason,
      warningId: warning.id,
      success: true,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      warning,
      warnings: serializeWarnings(updatedWarnings),
      warningCount: updatedWarnings.length,
      loggedToDiscord: logResult?.ok === true,
      actorIsAdmin: isAdmin,
    });
  } catch (error) {
    console.error("WARNINGS POST ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to create warning.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user?.isAdmin !== true) {
      await writeAuditLog({
        session,
        action: "remove-warning",
        success: false,
        status: "forbidden",
        error:
          "Non-admin attempted to remove a warning.",
      });

      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    let userId;
    let warningId;

    const { searchParams } = new URL(request.url);

    userId =
      searchParams.get("userId")?.trim() || "";

    warningId =
      searchParams.get("warningId")?.trim() || "";

    if (!userId || !warningId) {
      try {
        const body = await request.json();

        userId =
          body?.userId?.trim() || userId;

        warningId =
          body?.warningId?.trim() || warningId;
      } catch {}
    }

    if (
      !validDiscordId(userId) ||
      !warningId
    ) {
      await writeAuditLog({
        session,
        action: "remove-warning",
        targetUserId: userId,
        warningId,
        success: false,
        status: "invalid",
        error:
          "Valid userId and warningId are required.",
      });

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
      await writeAuditLog({
        session,
        action: "remove-warning",
        targetUserId: userId,
        warningId,
        success: false,
        status: "not-found",
        error: "Warning record not found.",
      });

      return NextResponse.json(
        {
          error: "Warning record not found.",
        },
        { status: 404 }
      );
    }

    const warnings = Array.isArray(
      doc.data()?.warnings
    )
      ? doc.data().warnings
      : [];

    const removedWarning = warnings.find(
      (warning) =>
        String(warning.id) === String(warningId)
    );

    if (!removedWarning) {
      await writeAuditLog({
        session,
        action: "remove-warning",
        targetUserId: userId,
        warningId,
        success: false,
        status: "not-found",
        error: "Warning not found.",
      });

      return NextResponse.json(
        {
          error: "Warning not found.",
        },
        { status: 404 }
      );
    }

    const updatedWarnings = warnings.filter(
      (warning) =>
        String(warning.id) !== String(warningId)
    );

    if (updatedWarnings.length === 0) {
      await ref.delete();
    } else {
      await ref.set({
        warnings: updatedWarnings,
        updatedAt: new Date(),
      });
    }

    await writeAuditLog({
      session,
      action: "remove-warning",
      targetUserId: userId,
      warningId,
      reason: removedWarning.reason || null,
      success: true,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      userId,
      warningId,
      warnings: serializeWarnings(updatedWarnings),
      remainingWarnings: updatedWarnings.length,
    });
  } catch (error) {
    console.error(
      "WARNINGS DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to remove warning.",
      },
      { status: 500 }
    );
  }
}