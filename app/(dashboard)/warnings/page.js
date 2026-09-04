"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function WarningsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin;

  const [searchId, setSearchId] = useState("");
  const [userId, setUserId] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  async function loadWarnings(id) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/warnings?userId=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setUserId(data.userId);
      setWarnings(data.warnings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    if (!isAdmin) loadWarnings(session.user.discordId);
  }, [session, isAdmin]);

  function handleSearch(e) {
    e.preventDefault();
    if (searchId.trim()) loadWarnings(searchId.trim());
  }

  async function handleAddWarning(e) {
    e.preventDefault();
    if (!userId || !reason.trim()) return;
    await fetch("/api/warnings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, reason: reason.trim() }),
    });
    setReason("");
    loadWarnings(userId);
  }

  async function handleRemove(warningId) {
    if (!confirm("Remove this warning?")) return;
    await fetch("/api/warnings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, warningId }),
    });
    loadWarnings(userId);
  }

  return (
    <div>
      <h1 className="text-xl font-medium mb-6">Warnings</h1>

      {isAdmin && (
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Discord User ID"
            className="flex-1 rounded-lg border border-border bg-panel px-3 py-2 text-sm"
          />
          <button type="submit" className="bg-accent text-white text-sm px-4 py-2 rounded-lg">
            Search
          </button>
        </form>
      )}

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {loading && <p className="text-gray-400 text-sm">Loading…</p>}

      {!loading && userId && (
        <>
          {isAdmin && (
            <form onSubmit={handleAddWarning} className="bg-panel border border-border rounded-xl p-4 mb-4 flex gap-2">
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for warning"
                className="flex-1 rounded-lg border border-border bg-white/5 px-3 py-2 text-sm"
              />
              <button type="submit" className="bg-accent text-white text-sm px-4 py-2 rounded-lg">
                Add warning
              </button>
            </form>
          )}

          {warnings.length === 0 ? (
            <p className="text-gray-400 text-sm">No warnings on record for this user.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {warnings.slice().reverse().map((w) => (
                <div key={w.id} className="bg-panel border border-border rounded-xl p-4">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-gray-500">ID: {w.id}</span>
                    {isAdmin && (
                      <button
                        onClick={() => handleRemove(w.id)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-sm mb-1">{w.reason}</p>
                  <p className="text-xs text-gray-500">
                    By {w.moderator} · {new Date(w.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}