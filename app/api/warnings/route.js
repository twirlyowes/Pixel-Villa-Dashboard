import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/firebaseAdmin";

function validDiscordId(id) {
  return /^\d{15,25}$/.test(String(id || ""));
}

function serializeWarnings(warnings) {
  if (!Array.isArray(warnings)) return [];

  return warnings.map((warning) => ({
    id: String(warning?.id ?? ""),
    moderator: String(warning?.moderator ?? "Unknown"),
    reason: String(warning?.reason ?? "No reason provided"),
    timestamp: warning?.timestamp ?? null,
  }));
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.discordId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const loggedInUserId = String(session.user.discordId);
    const isAdmin = session.user.isAdmin === true;

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId")?.trim();

    // Admins can search any user.
    // Staff can only view their own warnings.
    const userId = isAdmin
      ? requestedUserId || loggedInUserId
      : loggedInUserId;

    if (!validDiscordId(userId)) {
      return NextResponse.json(
        { error: "Invalid Discord User ID" },
        { status: 400 }
      );
    }

    const warningRef = db.collection("warnings").doc(userId);
    const snapshot = await warningRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({
        success: true,
        userId,
        warnings: [],
        count: 0,
      });
    }

    const data = snapshot.data();
    const warnings = serializeWarnings(data?.warnings);

    return NextResponse.json({
      success: true,
      userId,
      warnings,
      count: warnings.length,
    });
  } catch (error) {
    console.error("Warnings GET error:", error);

    return NextResponse.json(
      { error: "Failed to fetch warnings" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.discordId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.isAdmin !== true) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const userId = String(body?.userId || "").trim();
    const reason = String(body?.reason || "").trim();

    if (!validDiscordId(userId)) {
      return NextResponse.json(
        { error: "Invalid Discord User ID" },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: "Warning reason is required" },
        { status: 400 }
      );
    }

    const warningRef = db.collection("warnings").doc(userId);
    const snapshot = await warningRef.get();

    const existingWarnings = snapshot.exists
      ? snapshot.data()?.warnings
      : [];

    const warnings = Array.isArray(existingWarnings)
      ? existingWarnings
      : [];

    const newWarning = {
      id: `${Date.now()}`,
      moderator:
        session.user.discordId ||
        session.user.username ||
        "Unknown",
      reason,
      timestamp: new Date().toISOString(),
    };

    warnings.push(newWarning);

    await warningRef.set({
      warnings,
    });

    return NextResponse.json({
      success: true,
      warning: newWarning,
      warnings: serializeWarnings(warnings),
      count: warnings.length,
    });
  } catch (error) {
    console.error("Warnings POST error:", error);

    return NextResponse.json(
      { error: "Failed to add warning" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.discordId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.isAdmin !== true) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const userId = String(body?.userId || "").trim();
    const warningId = String(body?.warningId || "").trim();

    if (!validDiscordId(userId)) {
      return NextResponse.json(
        { error: "Invalid Discord User ID" },
        { status: 400 }
      );
    }

    if (!warningId) {
      return NextResponse.json(
        { error: "Warning ID is required" },
        { status: 400 }
      );
    }

    const warningRef = db.collection("warnings").doc(userId);
    const snapshot = await warningRef.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { error: "No warnings found" },
        { status: 404 }
      );
    }

    const data = snapshot.data();

    const warnings = Array.isArray(data?.warnings)
      ? data.warnings
      : [];

    const index = warnings.findIndex(
      (warning) => String(warning?.id) === warningId
    );

    if (index === -1) {
      return NextResponse.json(
        { error: "Warning not found" },
        { status: 404 }
      );
    }

    const removedWarning = warnings[index];

    warnings.splice(index, 1);

    if (warnings.length === 0) {
      await warningRef.delete();
    } else {
      await warningRef.set({
        warnings,
      });
    }

    return NextResponse.json({
      success: true,
      removedWarning,
      warnings: serializeWarnings(warnings),
      count: warnings.length,
    });
  } catch (error) {
    console.error("Warnings DELETE error:", error);

    return NextResponse.json(
      { error: "Failed to remove warning" },
      { status: 500 }
    );
  }
}