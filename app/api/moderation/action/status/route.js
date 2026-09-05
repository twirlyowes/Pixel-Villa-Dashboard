import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/firebaseAdmin";
import { resolveUsername } from "@/lib/discordUsers";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const session =
      await getServerSession(authOptions);

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

    const { searchParams } =
      new URL(request.url);

    const actionId =
      searchParams.get("actionId")?.trim();

    if (!actionId) {
      return NextResponse.json(
        {
          error:
            "Action ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const doc = await db
      .collection("dashboardActions")
      .doc(actionId)
      .get();

    if (!doc.exists) {
      return NextResponse.json(
        {
          error:
            "Moderation action not found.",
        },
        {
          status: 404,
        }
      );
    }

    const data = doc.data();

    const requestedBy =
      data?.requestedBy?.discordId;

    const sessionUserId =
      session.user?.discordId;

    const isAdmin =
      session.user?.isAdmin === true;

    if (
      !isAdmin &&
      requestedBy !== sessionUserId
    ) {
      return NextResponse.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json({
      success: true,

      actionId: doc.id,

      status:
        data?.status || "unknown",

      action:
        data?.action || null,

      targetUserId:
        data?.targetUserId || null,

      targetUsername: data?.targetUserId
        ? await resolveUsername(data.targetUserId)
        : null,

      result:
        data?.result || null,

      error:
        data?.error || null,

      createdAt:
        data?.createdAt?.toDate?.()
          ?.toISOString?.() ||
        data?.createdAt ||
        null,

      completedAt:
        data?.completedAt?.toDate?.()
          ?.toISOString?.() ||
        data?.completedAt ||
        null,

      failedAt:
        data?.failedAt?.toDate?.()
          ?.toISOString?.() ||
        data?.failedAt ||
        null,
    });
  } catch (error) {
    console.error(
      "MODERATION ACTION STATUS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to check moderation action status.",
      },
      {
        status: 500,
      }
    );
  }
}