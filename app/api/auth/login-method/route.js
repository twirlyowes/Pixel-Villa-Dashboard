import { NextResponse } from "next/server";

const STAFF_USER_IDS = (process.env.STAFF_USER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

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

    // Admins use Discord DM verification.
    if (ADMIN_USER_IDS.includes(userId)) {
      return NextResponse.json({
        authorized: true,
        method: "admin",
        role: "admin",
      });
    }

    // Normal staff use the shared dashboard access code.
    if (STAFF_USER_IDS.includes(userId)) {
      return NextResponse.json({
        authorized: true,
        method: "staff",
        role: "staff",
      });
    }

    return NextResponse.json(
      {
        authorized: false,
        error: "This Discord account is not authorized to access the dashboard.",
      },
      { status: 403 }
    );
  } catch (error) {
    console.error("login-method error:", error);

    return NextResponse.json(
      { error: "Unable to determine login method." },
      { status: 500 }
    );
  }
}