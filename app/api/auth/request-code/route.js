import { NextResponse } from "next/server";

import { db } from "@/lib/firebaseAdmin";

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    const userId = body?.userId?.trim();

    if (!userId || !/^\d{15,25}$/.test(userId)) {
      return NextResponse.json(
        { error: "Enter a valid Discord User ID." },
        { status: 400 }
      );
    }

    // Only configured administrators can request an admin login code.
    if (!ADMIN_USER_IDS.includes(userId)) {
      return NextResponse.json(
        { error: "This Discord account is not authorized." },
        { status: 403 }
      );
    }

    // Create a request for the Pixel Villa Support bot.
    // The bot will generate the code and DM it through Discord.js.
    const requestRef = await db.collection("dashboardAuthRequests").add({
      userId,
      status: "pending",
      createdAt: Date.now(),
    });

    console.log(
      `[Dashboard Auth] Created request ${requestRef.id} for ${userId}`
    );

    return NextResponse.json({
      success: true,
      message: "Login code requested. Check your Discord DMs shortly.",
      requestId: requestRef.id,
      expiresIn: 300,
    });
  } catch (error) {
    console.error("request-code error:", error);

    return NextResponse.json(
      { error: "Unable to request a login code." },
      { status: 500 }
    );
  }
}