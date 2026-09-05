"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
const [userId, setUserId] = useState("");
const [code, setCode] = useState("");
const [step, setStep] = useState("id");
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [message, setMessage] = useState("");

async function requestCode(event) {
event.preventDefault();

setError("");
setMessage("");

if (!/^\d{15,25}$/.test(userId.trim())) {
  setError("Enter a valid Discord User ID.");
  return;
}

setLoading(true);

try {
  const response = await fetch("/api/auth/request-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: userId.trim(),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to send login code.");
  }

  setMessage("A login code has been sent to your Discord DMs.");
  setStep("code");
} catch (err) {
  setError(err.message || "Something went wrong.");
} finally {
  setLoading(false);
}

}

async function verifyCode(event) {
event.preventDefault();

setError("");
setMessage("");

if (!/^\d{6}$/.test(code.trim())) {
  setError("Enter the 6-digit code from your Discord DM.");
  return;
}

setLoading(true);

try {
  const verifyResponse = await fetch("/api/auth/verify-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: userId.trim(),
      code: code.trim(),
    }),
  });

  const verifyData = await verifyResponse.json();

  if (!verifyResponse.ok) {
    throw new Error(
      verifyData.error || "Invalid access code."
    );
  }

  /*
   * The current NextAuth configuration still needs to be
   * updated to accept the verified Discord ID/code flow.
   *
   * We intentionally don't fake a session here.
   */
  const result = await signIn("credentials", {
    redirect: false,
    userId: userId.trim(),
    accessCode: code.trim(),
  });

  if (result?.error) {
    throw new Error(
      "Code verified, but the dashboard session could not be created."
    );
  }

  window.location.href = "/dashboard";
} catch (err) {
  setError(err.message || "Unable to complete login.");
} finally {
  setLoading(false);
}

}

return (
<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06131f] px-4 py-8 text-sky-50">
{/* Background glow */}
<div
className="pointer-events-none absolute inset-0"
aria-hidden="true"
>
<div className="absolute left-1/2 top-[-220px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-sky-400/10 blur-[120px]" />
<div className="absolute bottom-[-250px] right-[-100px] h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[120px]" />
</div>

  <section className="relative w-full max-w-md">
    <div className="rounded-3xl border border-sky-300/15 bg-[#0b1f2d]/80 p-6 shadow-2xl shadow-sky-950/30 backdrop-blur-2xl sm:p-8">
      {/* Brand */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-3xl shadow-[0_0_35px_rgba(56,189,248,0.12)]">
          🩵
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white">
          Pixel Villa
        </h1>

        <p className="mt-1 text-sm text-sky-200/60">
          Dashboard Control Panel
        </p>
      </div>

      {step === "id" ? (
        <form onSubmit={requestCode} className="space-y-5">
          <div>
            <label
              htmlFor="discord-id"
              className="mb-2 block text-sm font-medium text-sky-100"
            >
              Discord User ID
            </label>

            <input
              id="discord-id"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Enter your Discord User ID"
              className="w-full rounded-xl border border-sky-300/10 bg-[#06131f]/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/10"
            />

            <p className="mt-2 text-xs text-slate-500">
              An access code will be sent to your Discord DMs.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-sky-400 px-4 py-3 text-sm font-bold text-[#03111b] transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending Code..." : "Send Login Code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-5">
          <div>
            <label
              htmlFor="access-code"
              className="mb-2 block text-sm font-medium text-sky-100"
            >
              Verification Code
            </label>

            <input
              id="access-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) =>
                setCode(
                  event.target.value.replace(/\D/g, "")
                )
              }
              placeholder="000000"
              className="w-full rounded-xl border border-sky-300/10 bg-[#06131f]/80 px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-white outline-none transition placeholder:text-slate-700 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/10"
            />
          </div>

          {message && (
            <div className="rounded-xl border border-sky-300/15 bg-sky-400/5 px-4 py-3 text-sm text-sky-200">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-sky-400 px-4 py-3 text-sm font-bold text-[#03111b] transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify & Login"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("id");
              setCode("");
              setError("");
              setMessage("");
            }}
            className="w-full text-sm text-slate-500 transition hover:text-sky-300"
          >
            Use a different Discord ID
          </button>
        </form>
      )}

      <div className="mt-8 border-t border-sky-300/10 pt-5 text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-sky-300/30">
          Pixel Villa • Secure Dashboard
        </p>
      </div>
    </div>
  </section>
</main>

);
}