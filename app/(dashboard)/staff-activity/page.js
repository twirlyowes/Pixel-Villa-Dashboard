"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

function formatDuration(ms = 0) {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

function StatsCard({ label, stats }) {
  return (
    <div className="bg-panel border border-border rounded-xl p-4">
      <div className="text-sm text-gray-400 mb-3">{label}</div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-500 text-xs">Active time</div>
          <div>{formatDuration(stats.activeTime)}</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs">Voice time</div>
          <div>{formatDuration(stats.voiceTime)}</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs">Messages</div>
          <div>{stats.messages ?? 0}</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs">Commands</div>
          <div>{stats.commands ?? 0}</div>
        </div>
      </div>
    </div>
  );
}

export default function StaffActivityPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin;

  const [leaderboard, setLeaderboard] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [own, setOwn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    if (isAdmin) {
      fetch("/api/staff-activity")
        .then((r) => r.json())
        .then((data) => {
          setLeaderboard(data.staff || []);
          setLoading(false);
        });
    } else {
      fetch(`/api/staff-activity?userId=${session.user.discordId}`)
        .then((r) => r.json())
        .then((data) => {
          setOwn(data.stats || {});
          setLoading(false);
        });
    }
  }, [session, isAdmin]);

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchId.trim()) return;
    const res = await fetch(`/api/staff-activity?userId=${searchId.trim()}`);
    const data = await res.json();
    setSearchResult({ userId: data.userId, stats: data.stats || {} });
  }

  return (
    <div>
      <h1 className="text-xl font-medium mb-6">Staff activity</h1>

      {!isAdmin && own && <StatsCard label="Your stats today" stats={own} />}

      {isAdmin && (
        <>
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Look up one user by Discord ID"
              className="flex-1 rounded-lg border border-border bg-panel px-3 py-2 text-sm"
            />
            <button type="submit" className="bg-accent text-white text-sm px-4 py-2 rounded-lg">
              Search
            </button>
          </form>

          {searchResult && (
            <div className="mb-6">
              <StatsCard label={`User ${searchResult.userId}`} stats={searchResult.stats} />
            </div>
          )}

          <h2 className="text-sm text-gray-400 mb-3">Today's leaderboard</h2>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : (
            <div className="bg-panel border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-gray-400 text-left">
                  <tr>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Active time</th>
                    <th className="p-3">Voice time</th>
                    <th className="p-3">Messages</th>
                    <th className="p-3">Commands</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="p-3">{s.id}</td>
                      <td className="p-3">{formatDuration(s.activeTime)}</td>
                      <td className="p-3">{formatDuration(s.voiceTime)}</td>
                      <td className="p-3">{s.messages ?? 0}</td>
                      <td className="p-3">{s.commands ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}