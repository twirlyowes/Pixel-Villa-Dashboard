"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [adminCode, setAdminCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [requestingCode, setRequestingCode] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function requestAdminCode() {
    const id = userId.trim();

    if (!/^\d{15,25}$/.test(id)) {
      setError("Enter a valid Discord User ID first.");
      return;
    }

    setRequestingCode(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to send administrator login code."
        );
      }

      setMessage(
        "Administrator code requested. Check your Discord DMs."
      );
    } catch (err) {
      setError(
        err.message || "Unable to request administrator code."
      );
    } finally {
      setRequestingCode(false);
    }
  }

  async function login(event) {
    event.preventDefault();

    const id = userId.trim();

    if (!/^\d{15,25}$/.test(id)) {
      setError("Enter a valid Discord User ID.");
      return;
    }

    if (!accessCode && !adminCode) {
      setError(
        "Enter either your staff access code or administrator DM code."
      );
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        userId: id,

        // Staff code
        accessCode: accessCode.trim(),

        // Admin one-time code
        adminCode: adminCode.trim(),
      });

      if (!result || result.error) {
        throw new Error(
          "Invalid Discord ID or login code."
        );
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setError(
        err.message || "Unable to log in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06131f] px-4 py-8 text-sky-50">

      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-220px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-sky-400/10 blur-[120px]" />
        <div className="absolute bottom-[-250px] right-[-120px] h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[120px]" />
      </div>

      <section className="relative w-full max-w-md">
        <div className="rounded-3xl border border-sky-300/15 bg-[#0b1f2d]/80 p-6 shadow-2xl shadow-sky-950/30 backdrop-blur-2xl sm:p-8">

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-3xl">
              🩵
            </div>

            <h1 className="text-2xl font-bold text-white">
              Pixel Villa
            </h1>

            <p className="mt-1 text-sm text-sky-200/60">
              Dashboard Control Panel
            </p>
          </div>

          <form onSubmit={login} className="space-y-5">

            {/* Discord ID */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Discord User ID
              </label>

              <input
                type="text"
                inputMode="numeric"
                value={userId}
                onChange={(e) =>
                  setUserId(e.target.value.replace(/\D/g, ""))
                }
                placeholder="Enter your Discord User ID"
                className="w-full rounded-xl border border-sky-300/10 bg-[#06131f]/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-sky-400/50"
              />
            </div>

            {/* STAFF ACCESS CODE — ALWAYS VISIBLE */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                🛡️ Staff Access Code
              </label>

              <input
                type="password"
                value={accessCode}
                onChange={(e) =>
                  setAccessCode(e.target.value)
                }
                placeholder="Enter dashboard access code"
                className="w-full rounded-xl border border-sky-300/10 bg-[#06131f]/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-sky-400/50"
              />

              <p className="mt-2 text-xs text-slate-500">
                For authorized Pixel Villa staff.
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-sky-300/10" />
              <span className="text-xs text-slate-500">
                OR ADMIN LOGIN
              </span>
              <div className="h-px flex-1 bg-sky-300/10" />
            </div>

            {/* ADMIN CODE */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium">
                  👑 Administrator DM Code
                </label>

                <button
                  type="button"
                  onClick={requestAdminCode}
                  disabled={requestingCode}
                  className="text-xs font-semibold text-sky-300 hover:text-sky-200 disabled:opacity-50"
                >
                  {requestingCode
                    ? "Sending..."
                    : "Send Code"}
                </button>
              </div>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={adminCode}
                onChange={(e) =>
                  setAdminCode(
                    e.target.value.replace(/\D/g, "")
                  )
                }
                placeholder="000000"
                className="w-full rounded-xl border border-sky-300/10 bg-[#06131f]/80 px-4 py-3 text-center text-lg font-bold tracking-[0.35em] text-white outline-none placeholder:text-slate-600 focus:border-sky-400/50"
              />

              <p className="mt-2 text-xs text-slate-500">
                Administrators can request a one-time login code.
              </p>
            </div>

            {/* Messages */}
            {message && (
              <div className="rounded-xl border border-sky-300/15 bg-sky-400/5 p-3 text-sm text-sky-200">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-sky-400 px-4 py-3 font-bold text-[#03111b] transition hover:bg-sky-300 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login to Dashboard"}
            </button>

          </form>

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