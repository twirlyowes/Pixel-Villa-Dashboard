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

    /*
     * The dashboard does not use BOT_HEALTH_URL.
     * Bot online status cannot be reliably determined
     * from the dashboard without a health endpoint.
     */

    return NextResponse.json({
      success: true,
      configured: false,
      online: null,
      status: "not_configured",
      message: "Bot health monitoring is not configured.",
    });
  } catch (error) {
    console.error("BOT HEALTH API ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load bot health.",
      },
      { status: 500 }
    );
  }
}