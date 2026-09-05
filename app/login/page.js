"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [accessCode, setAccessCode] = useState("");

  const [method, setMethod] = useState(null);
  const [step, setStep] = useState("id");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function continueWithId(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const id = userId.trim();

    if (!/^\d{15,25}$/.test(id)) {
      setError("Enter a valid Discord User ID.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login-method", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.authorized) {
        throw new Error(
          data.error ||
            "This Discord account is not authorized."
        );
      }

      setMethod(data.method);

      /*
       * ADMIN
       * Send one-time code through Discord DM.
       */
      if (data.method === "admin") {
        setLoading(true);

        const codeResponse = await fetch(
          "/api/auth/request-code",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: id,
            }),
          }
        );

        const codeData = await codeResponse.json();

        if (!codeResponse.ok) {
          throw new Error(
            codeData.error ||
              "Unable to send the Discord login code."
          );
        }

        setMessage(
          "A 6-digit login code has been sent to your Discord DMs."
        );

        setStep("admin-code");
      }

      /*
       * NORMAL STAFF
       * Ask for the shared dashboard access code.
       */
      if (data.method === "staff") {
        setMessage(
          "Enter the dashboard access code provided to staff."
        );

        setStep("staff-code");
      }
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function login(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const id = userId.trim();
    const code = accessCode.trim();

    if (!code) {
      setError(
        method === "admin"
          ? "Enter the 6-digit Discord login code."
          : "Enter the dashboard access code."
      );
      return;
    }

    if (
      method === "admin" &&
      !/^\d{6}$/.test(code)
    ) {
      setError("The admin login code must be 6 digits.");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        userId: id,
        accessCode: code,
      });

      if (!result || result.error) {
        throw new Error(
          method === "admin"
            ? "Invalid or expired login code."
            : "Invalid dashboard access code."
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

  function resetLogin() {
    setUserId("");
    setAccessCode("");
    setMethod(null);
    setStep("id");
    setError("");
    setMessage("");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06131f] px-4 py-8 text-sky-50">

      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-[-220px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-sky-400/10 blur-[120px]" />

        <div className="absolute bottom-[-250px] right-[-120px] h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[120px]" />

        <div className="absolute left-[-150px] top-1/2 h-[400px] w-[400px] rounded-full bg-sky-300/5 blur-[120px]" />
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

          {/* STEP 1 — USER ID */}
          {step === "id" && (
            <form
              onSubmit={continueWithId}
              className="space-y-5"
            >
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
                  onChange={(event) =>
                    setUserId(
                      event.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="Enter your Discord User ID"
                  className="w-full rounded-xl border border-sky-300/10 bg-[#06131f]/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/10"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Enter your Discord User ID to continue.
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
                {loading
                  ? "Checking..."
                  : "Continue"}
              </button>
            </form>
          )}

          {/* ADMIN CODE */}
          {step === "admin-code" && (
            <form
              onSubmit={login}
              className="space-y-5"
            >
              <div className="rounded-xl border border-sky-300/10 bg-sky-400/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👑</span>

                  <div>
                    <p className="text-sm font-semibold text-sky-200">
                      Administrator Login
                    </p>

                    <p className="text-xs text-slate-500">
                      Verification code sent through Discord
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-code"
                  className="mb-2 block text-sm font-medium text-sky-100"
                >
                  Discord Login Code
                </label>

                <input
                  id="admin-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={accessCode}
                  onChange={(event) =>
                    setAccessCode(
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
                {loading
                  ? "Verifying..."
                  : "Verify & Login"}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={resetLogin}
                className="w-full text-sm text-slate-500 transition hover:text-sky-300"
              >
                Use a different Discord ID
              </button>
            </form>
          )}

          {/* STAFF CODE */}
          {step === "staff-code" && (
            <form
              onSubmit={login}
              className="space-y-5"
            >
              <div className="rounded-xl border border-sky-300/10 bg-sky-400/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛡️</span>

                  <div>
                    <p className="text-sm font-semibold text-sky-200">
                      Staff Login
                    </p>

                    <p className="text-xs text-slate-500">
                      Enter the staff dashboard access code
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="staff-code"
                  className="mb-2 block text-sm font-medium text-sky-100"
                >
                  Dashboard Access Code
                </label>

                <input
                  id="staff-code"
                  type="password"
                  autoComplete="current-password"
                  value={accessCode}
                  onChange={(event) =>
                    setAccessCode(event.target.value)
                  }
                  placeholder="Enter access code"
                  className="w-full rounded-xl border border-sky-300/10 bg-[#06131f]/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/10"
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
                {loading
                  ? "Logging in..."
                  : "Login to Dashboard"}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={resetLogin}
                className="w-full text-sm text-slate-500 transition hover:text-sky-300"
              >
                Use a different Discord ID
              </button>
            </form>
          )}

          {/* Footer */}
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