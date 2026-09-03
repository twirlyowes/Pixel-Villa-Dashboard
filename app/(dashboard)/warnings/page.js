"use client";

import { useEffect, useState } from "react";

export default function WarningsPage() {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/warnings");
    const data = await res.json();
    setWarnings(data.warnings || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    if (!confirm("Delete this warning? This can't be undone.")) return;
    await fetch("/api/warnings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-medium mb-6">Warnings</h1>
      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : warnings.length === 0 ? (
        <p className="text-gray-400 text-sm">No warnings found.</p>
      ) : (
        <div className="bg-panel border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-gray-400 text-left">
              <tr>
                <th className="p-3">Member</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Moderator</th>
                <th className="p-3">Date</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {warnings.map((w) => (
                <tr key={w.id} className="border-t border-border">
                  <td className="p-3">{w.userTag || w.userId}</td>
                  <td className="p-3">{w.reason}</td>
                  <td className="p-3">{w.moderatorTag || w.moderatorId}</td>
                  <td className="p-3">
                    {w.timestamp
                      ? new Date(
                          w.timestamp._seconds
                            ? w.timestamp._seconds * 1000
                            : w.timestamp
                        ).toLocaleString()
                      : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(w.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
