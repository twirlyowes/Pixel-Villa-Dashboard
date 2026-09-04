import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

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

    const isAdmin = session.user?.isAdmin === true;

    return NextResponse.json({
      success: true,
      admin: isAdmin,
      actions: [
        {
          id: "timeout",
          name: "Timeout",
          description: "Temporarily restrict a member.",
        },
        {
          id: "remove-timeout",
          name: "Remove Timeout",
          description: "Remove an active timeout.",
        },
        {
          id: "warn",
          name: "Warning",
          description: "Issue a staff warning.",
        },
        {
          id: "kick",
          name: "Kick",
          description: "Remove a member from the server.",
        },
        {
          id: "ban",
          name: "Ban",
          description: "Ban a member from the server.",
        },
        {
          id: "unban",
          name: "Unban",
          description: "Remove a server ban.",
        },
      ],
    });
  } catch (error) {
    console.error("MODERATION API ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load moderation data.",
      },
      { status: 500 }
    );
  }
}