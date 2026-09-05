import { NextResponse } from "next/server";
import crypto from "crypto";

import { db } from "@/lib/firebaseAdmin";
import { sendDM } from "@/lib/discord";

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || "")
.split(",")
.map((id) => id.trim())
.filter(Boolean);

const CODE_EXPIRY_MS = 5 * 60 * 1000;

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

// Only configured administrators can request an admin code.
if (!ADMIN_USER_IDS.includes(userId)) {
  return NextResponse.json(
    { error: "This Discord account is not authorized." },
    { status: 403 }
  );
}

const code = String(
  crypto.randomInt(100000, 1000000)
);

const codeHash = crypto
  .createHash("sha256")
  .update(code)
  .digest("hex");

const expiresAt = Date.now() + CODE_EXPIRY_MS;

// One active challenge per Discord user.
await db
  .collection("dashboardLoginCodes")
  .doc(userId)
  .set({
    userId,
    codeHash,
    expiresAt,
    used: false,
    createdAt: Date.now(),
  });

const dmResult = await sendDM(
  userId,
  [
    "**🩵 Pixel Villa Dashboard**",
    "",
    "Your administrator login code is:",
    "",
    `**${code}**`,
    "",
    "This code expires in **5 minutes** and can only be used once.",
    "If you did not request this code, you can safely ignore this message.",
  ].join("\n")
);

if (!dmResult.ok) {
  await db
    .collection("dashboardLoginCodes")
    .doc(userId)
    .delete()
    .catch(() => {});

  console.error(
    "Failed to send dashboard login code:",
    dmResult.error
  );

  return NextResponse.json(
    {
      error:
        "I couldn't send the Discord DM. Make sure the bot can DM this account.",
    },
    { status: 502 }
  );
}

return NextResponse.json({
  success: true,
  message: "A login code has been sent to your Discord DMs.",
  expiresIn: CODE_EXPIRY_MS / 1000,
});

} catch (error) {
console.error("request-code error:", error);

return NextResponse.json(
  { error: "Unable to create a login code." },
  { status: 500 }
);

}
}