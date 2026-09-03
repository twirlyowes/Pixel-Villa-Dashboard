"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="bg-panel border border-border rounded-xl p-8 w-80 text-center">
        <h1 className="text-lg font-medium mb-2">Pixel Villa Dashboard</h1>
        <p className="text-sm text-gray-400 mb-6">
          Staff sign-in only. You need an active staff role in the Discord
          server to get in.
        </p>
        <button
          onClick={() => signIn("discord", { callbackUrl: "/" })}
          className="w-full bg-accent text-white rounded-lg py-2 text-sm font-medium"
        >
          Sign in with Discord
        </button>
      </div>
    </div>
  );
}
