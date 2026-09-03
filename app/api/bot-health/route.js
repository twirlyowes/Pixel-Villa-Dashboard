import { NextResponse } from "next/server";

// Your bot already runs an express keep-alive server on Render for its
// own uptime pings. Point this at that same URL to reuse it, e.g.
// https://pixel-villa-support.onrender.com
const BOT_URL = process.env.BOT_STATUS_URL;

export async function GET() {
  if (!BOT_URL) {
    return NextResponse.json({
      online: null,
      note: "BOT_STATUS_URL not configured",
    });
  }

  try {
    const start = Date.now();
    const res = await fetch(BOT_URL, { cache: "no-store" });
    const latencyMs = Date.now() - start;

    return NextResponse.json({
      online: res.ok,
      latencyMs,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({
      online: false,
      error: err.message,
      checkedAt: new Date().toISOString(),
    });
  }
}
