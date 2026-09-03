"use client";

import { useEffect, useState } from "react";

const statusColors = {
  open: "text-green-400",
  closed: "text-gray-500",
};

export default function ModMailPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/modmail");
    const data = await res.json();
    setTickets(data.tickets || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleStatus(ticket) {
    const nextStatus = ticket.status === "open" ? "closed" : "open";
    await fetch("/api/modmail", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ticket.id, status: nextStatus }),
    });
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-medium mb-6">ModMail tickets</h1>
      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : tickets.length === 0 ? (
        <p className="text-gray-400 text-sm">No tickets found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="bg-panel border border-border rounded-xl p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium">
                    {t.userTag || t.userId}{" "}
                    <span className="text-gray-500 text-xs">
                      · {t.category || "Others"}
                    </span>
                  </div>
                  <div
                    className={`text-xs ${
                      statusColors[t.status] || "text-gray-400"
                    }`}
                  >
                    {t.status}
                  </div>
                </div>
                <button
                  onClick={() => toggleStatus(t)}
                  className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg"
                >
                  Mark {t.status === "open" ? "closed" : "open"}
                </button>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">
                {t.lastMessage || t.initialMessage}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
