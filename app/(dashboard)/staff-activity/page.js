"use client";

import { useEffect, useState } from "react";

function formatDuration(seconds = 0) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function StaffActivityPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/staff-activity")
      .then((r) => r.json())
      .then((data) => {
        setStaff(data.staff || []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-xl font-medium mb-6">Staff activity</h1>
      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <div className="bg-panel border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-gray-400 text-left">
              <tr>
                <th className="p-3">Staff member</th>
                <th className="p-3">Active time</th>
                <th className="p-3">Voice time</th>
                <th className="p-3">Messages</th>
                <th className="p-3">Commands</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="p-3">{s.tag || s.id}</td>
                  <td className="p-3">{formatDuration(s.activeSeconds)}</td>
                  <td className="p-3">{formatDuration(s.voiceSeconds)}</td>
                  <td className="p-3">{s.messageCount ?? 0}</td>
                  <td className="p-3">{s.commandCount ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
