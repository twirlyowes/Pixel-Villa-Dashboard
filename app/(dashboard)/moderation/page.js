"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function ModerationPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin;

  const [userId, setUserId] = useState("");
  const [duration, setDuration] = useState("10");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function runAction(action) {
    if (!userId.trim()) {
      setStatus("Enter a Discord User ID first.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim(),
          action,
          durationMinutes: Number(duration),
          reason: reason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setStatus(action === "mute" ? "User muted." : "User unmuted.");
    } catch (err) {
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) {
    return (
      <div>
        <h1 className="text-xl font-medium mb-4">Moderation</h1>
        <p className="text-gray-400 text-sm">Admins only.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-medium mb-6">Moderation</h1>

      <div className="bg-panel border border-border rounded-xl p-5 max-w-md flex flex-col gap-4">
        <div>
          <label className="mb-2 block text-sm text-gray-300">Discord User ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="e.g. 123456789012345678"
            className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-gray-300">Mute duration (minutes)</label>
          <input
            type="number"
            min="1"
            max="40320"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-gray-300">Reason</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason"
            className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => runAction("mute")}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm py-2 rounded-lg disabled:opacity-50"
          >
            Mute
          </button>
          <button
            onClick={() => runAction("unmute")}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm py-2 rounded-lg disabled:opacity-50"
          >
            Unmute
          </button>
        </div>

        {status && <p className="text-sm text-gray-300">{status}</p>}
      </div>
    </div>
  );
}