import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

const STAFF_ACTIONS = new Set([
  "timeout",
  "remove-timeout",
  "warn",
]);

const ADMIN_ACTIONS = new Set([
  "kick",
  "ban",
  "unban",
]);

const ALL_ACTIONS = new Set([
  ...STAFF_ACTIONS,
  ...ADMIN_ACTIONS,
]);

const DISCORD_ID_REGEX = /^\d{15,25}$/;

function validDiscordId(id) {
  return (
    typeof id === "string" &&
    DISCORD_ID_REGEX.test(id)
  );
}

function cleanText(value, maxLength = 1000) {
  if (typeof value !== "string") return "";

  return value
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function getDurationMs(duration) {
  const durations = {
    "1m": 60 * 1000,
    "5m": 5 * 60 * 1000,
    "10m": 10 * 60 * 1000,
    "30m": 30 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "2h": 2 * 60 * 60 * 1000,
    "6h": 6 * 60 * 60 * 1000,
    "12h": 12 * 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000,
    "3d": 3 * 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
  };

  return durations[duration] || null;
}

async function writeAuditLog({
  session,
  action,
  targetUserId,
  reason,
  success,
  status,
  error = null,
  actionId = null,
}) {
  try {
    await db.collection("dashboardAuditLogs").add({
      actor: {
        discordId:
          session?.user?.discordId ||
          null,

        username:
          session?.user?.username ||
          session?.user?.name ||
          null,

        isAdmin:
          session?.user?.isAdmin === true,

        role:
          session?.user?.role ||
          "staff",
      },

      action,
      targetUserId: targetUserId || null,
      reason: reason || null,

      success: success === true,
      status,

      error: error || null,
      actionId: actionId || null,

      source: "dashboard",
      createdAt: new Date(),
      timestamp: Date.now(),
    });
  } catch (auditError) {
    console.error(
      "DASHBOARD AUDIT LOG ERROR:",
      auditError
    );
  }
}

export async function POST(request) {
  let session = null;
  let action = null;
  let targetUserId = null;
  let reason = null;

  try {
    session =
      await getServerSession(authOptions);

    /*
     * --------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------
     */

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * --------------------------------------------------
     * REQUEST BODY
     * --------------------------------------------------
     */

    const body = await request.json();

    action =
      typeof body?.action === "string"
        ? body.action.trim().toLowerCase()
        : "";

    targetUserId =
      typeof body?.userId === "string"
        ? body.userId.trim()
        : "";

    reason = cleanText(
      body?.reason,
      1000
    );

    const duration =
      typeof body?.duration === "string"
        ? body.duration.trim()
        : "";

    /*
     * --------------------------------------------------
     * ACTION VALIDATION
     * --------------------------------------------------
     */

    if (!ALL_ACTIONS.has(action)) {
      await writeAuditLog({
        session,
        action: action || "unknown",
        targetUserId,
        reason,
        success: false,
        status: "invalid_action",
        error: "Invalid moderation action.",
      });

      return NextResponse.json(
        {
          error:
            "Invalid moderation action.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * TARGET VALIDATION
     * --------------------------------------------------
     */

    if (!validDiscordId(targetUserId)) {
      await writeAuditLog({
        session,
        action,
        targetUserId,
        reason,
        success: false,
        status: "invalid_target",
        error:
          "A valid Discord User ID is required.",
      });

      return NextResponse.json(
        {
          error:
            "A valid Discord User ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * PERMISSION CHECK
     * --------------------------------------------------
     */

    const isAdmin =
      session.user?.isAdmin === true;

    const isStaff =
      session.user?.role === "staff" ||
      isAdmin;

    if (!isStaff) {
      await writeAuditLog({
        session,
        action,
        targetUserId,
        reason,
        success: false,
        status: "forbidden",
        error:
          "You do not have staff permissions.",
      });

      return NextResponse.json(
        {
          error:
            "You do not have permission to use moderation actions.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      ADMIN_ACTIONS.has(action) &&
      !isAdmin
    ) {
      await writeAuditLog({
        session,
        action,
        targetUserId,
        reason,
        success: false,
        status: "admin_required",
        error:
          "Administrator access is required for this action.",
      });

      return NextResponse.json(
        {
          error:
            "Administrator access is required for this action.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * --------------------------------------------------
     * REASON VALIDATION
     * --------------------------------------------------
     */

    if (!reason) {
      await writeAuditLog({
        session,
        action,
        targetUserId,
        reason,
        success: false,
        status: "missing_reason",
        error:
          "A reason is required.",
      });

      return NextResponse.json(
        {
          error:
            "A reason is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * TIMEOUT VALIDATION
     * --------------------------------------------------
     */

    let durationMs = null;

    if (action === "timeout") {
      durationMs =
        getDurationMs(duration);

      if (!durationMs) {
        await writeAuditLog({
          session,
          action,
          targetUserId,
          reason,
          success: false,
          status: "invalid_duration",
          error:
            "A valid timeout duration is required.",
        });

        return NextResponse.json(
          {
            error:
              "A valid timeout duration is required.",
            allowedDurations: [
              "1m",
              "5m",
              "10m",
              "30m",
              "1h",
              "2h",
              "6h",
              "12h",
              "1d",
              "3d",
              "7d",
            ],
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * --------------------------------------------------
     * CREATE ACTION REQUEST
     * --------------------------------------------------
     *
     * The dashboard does NOT contact Discord directly.
     *
     * The bot will pick this request up from Firestore,
     * execute the Discord action, then write the result.
     */

    const actionRef =
      db.collection("dashboardActions").doc();

    const actionData = {
      actionId: actionRef.id,

      action,

      targetUserId,

      reason,

      duration:
        action === "timeout"
          ? duration
          : null,

      durationMs,

      requestedBy: {
        discordId:
          session.user?.discordId ||
          null,

        username:
          session.user?.username ||
          session.user?.name ||
          null,

        role:
          session.user?.role ||
          "staff",

        isAdmin:
          session.user?.isAdmin === true,
      },

      source: "dashboard",

      status: "pending",

      result: null,

      error: null,

      createdAt: new Date(),
      updatedAt: new Date(),

      timestamp: Date.now(),
    };

    await actionRef.set(actionData);

    /*
     * --------------------------------------------------
     * AUDIT LOG
     * --------------------------------------------------
     */

    await writeAuditLog({
      session,
      action,
      targetUserId,
      reason,
      success: true,
      status: "queued",
      actionId: actionRef.id,
    });

    /*
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        message:
          "Moderation action queued successfully.",

        actionId: actionRef.id,

        action,

        targetUserId,

        status: "pending",
      },
      {
        status: 202,
      }
    );
  } catch (error) {
    console.error(
      "MODERATION ACTION API ERROR:",
      error
    );

    if (session) {
      await writeAuditLog({
        session,
        action:
          action || "unknown",
        targetUserId:
          targetUserId || null,
        reason:
          reason || null,
        success: false,
        status: "server_error",
        error:
          error?.message ||
          "Internal server error.",
      });
    }

    return NextResponse.json(
      {
        error:
          "Failed to process moderation action.",
      },
      {
        status: 500,
      }
    );
  }
}