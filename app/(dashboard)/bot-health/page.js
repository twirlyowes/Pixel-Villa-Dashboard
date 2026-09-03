"use client";

import { useEffect, useState } from "react";

export default function BotHealthPage() {
  const [status, setStatus] = useState(null);

  async function check() {
    const res = await fetch("/api/bot-health");
    const data = await res.json();
    setStatus(data);
  }

  useEffect(() => {
    check();
    const interval = setInterval(check, 30000); // re-check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1 className="text-xl font-medium mb-6">Bot health</h1>
      {!status ? (
        <p className="text-gray-400 text-sm">Checking…</p>
      ) : (
        <div className="bg-panel border border-border rounded-xl p-5 max-w-sm">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status.online ? "bg-green-400" : "bg-red-400"
              }`}
            />
            <span className="font-medium">
              {status.online ? "Online" : "Offline"}
            </span>
          </div>
          {status.latencyMs != null && (
            <div className="text-sm text-gray-400">
              Response time: {status.latencyMs}ms
            </div>
          )}
          {status.note && (
            <div className="text-sm text-amber-400 mt-2">{status.note}</div>
          )}
          {status.checkedAt && (
            <div className="text-xs text-gray-500 mt-3">
              Last checked: {new Date(status.checkedAt).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
