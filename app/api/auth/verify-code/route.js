import { NextResponse } from "next/server";
import crypto from "crypto";

import { db } from "@/lib/firebaseAdmin";

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || "")
.split(",")
.map((id) => id.trim())
.filter(Boolean);

export async function POST(req) {
try {
const body = await req.json().catch(() => null);

const userId = body?.userId?.trim();
const code = body?.code?.trim();

if (!userId || !code) {
  return NextResponse.json(
    { error: "Discord User ID and access code are required." },
    { status: 400 }
  );
}

if (!/^\d{15,25}$/.test(userId)) {
  return NextResponse.json(
    { error: "Invalid Discord User ID." },
    { status: 400 }
  );
}

if (!/^\d{6}$/.test(code)) {
  return NextResponse.json(
    { error: "The access code must be 6 digits." },
    { status: 400 }
  );
}

// Never allow a non-admin to use the admin verification endpoint.
if (!ADMIN_USER_IDS.includes(userId)) {
  return NextResponse.json(
    { error: "This Discord account is not authorized." },
    { status: 403 }
  );
}

const ref = db.collection("dashboardLoginCodes").doc(userId);
const snapshot = await ref.get();

if (!snapshot.exists) {
  return NextResponse.json(
    { error: "No active login code was found. Request a new one." },
    { status: 401 }
  );
}

const challenge = snapshot.data();

if (challenge.used) {
  return NextResponse.json(
    { error: "This access code has already been used." },
    { status: 401 }
  );
}

if (!challenge.expiresAt || Date.now() > challenge.expiresAt) {
  await ref.delete().catch(() => {});

  return NextResponse.json(
    { error: "This access code has expired. Request a new one." },
    { status: 401 }
  );
}

const codeHash = crypto
  .createHash("sha256")
  .update(code)
  .digest("hex");

const valid = crypto.timingSafeEqual(
  Buffer.from(codeHash, "hex"),
  Buffer.from(challenge.codeHash, "hex")
);

if (!valid) {
  return NextResponse.json(
    { error: "Invalid access code." },
    { status: 401 }
  );
}

// Consume the code before returning success.
await ref.update({
  used: true,
  verifiedAt: Date.now(),
});

return NextResponse.json({
  success: true,
  userId,
  role: "admin",
  message: "Access code verified.",
});

} catch (error) {
console.error("verify-code error:", error);

return NextResponse.json(
  { error: "Unable to verify the access code." },
  { status: 500 }
);

}
}