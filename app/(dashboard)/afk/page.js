"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function AfkPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin;

  const [searchId, setSearchId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load(id) {
    setLoading(true);
    const res = await fetch(`/api/afk?userId=${id}`);
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  useEffect(() => {
    if (!session) return;
    if (!isAdmin) load(session.user.discordId);
  }, [session, isAdmin]);

  function handleSearch(e) {
    e.preventDefault();
    if (searchId.trim()) load(searchId.trim());
  }

  return (
    <div>
      <h1 className="text-xl font-medium mb-6">AFK status</h1>

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

      {loading && <p className="text-gray-400 text-sm">Loading…</p>}

      {!loading && result && (
        <div className="bg-panel border border-border rounded-xl p-5 max-w-sm">
          {result.isAfk ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="font-medium">Currently AFK</span>
              </div>
              <div className="text-sm text-gray-300 mb-1">Reason: {result.reason}</div>
              <div className="text-xs text-gray-500">
                Since {new Date(result.since).toLocaleString()}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="font-medium">Not AFK</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}