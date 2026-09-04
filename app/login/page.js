"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      userId,
      accessCode,
      redirect: false,
      callbackUrl: "/",
    });

    if (result?.error) {
      setError("Invalid User ID or access code.");
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/20 p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-white">
          Pixel Villa Dashboard
        </h1>

        <p className="mt-2 text-gray-400">
          Enter your Discord User ID and access code.
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Discord User ID
            </label>

            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. 123456789012345678"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Access Code
            </label>

            <input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter access code"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Access Dashboard"}
          </button>
        </form>
      </div>
    </main>
  );
}