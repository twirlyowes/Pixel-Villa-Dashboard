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

    const botUrl = process.env.BOT_HEALTH_URL;

    if (!botUrl) {
      return NextResponse.json({
        success: true,
        online: false,
        status: "unconfigured",
        message:
          "BOT_HEALTH_URL is not configured.",
      });
    }

    const startedAt = Date.now();

    const response = await fetch(botUrl, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    const latency = Date.now() - startedAt;

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        online: false,
        status: "offline",
        latency,
        ...data,
      });
    }

    return NextResponse.json({
      success: true,
      online: true,
      status: "online",
      latency,
      ...data,
    });
  } catch (error) {
    console.error("BOT HEALTH API ERROR:", error);

    return NextResponse.json({
      success: true,
      online: false,
      status: "offline",
      message: "Bot health endpoint could not be reached.",
    });
  }
}