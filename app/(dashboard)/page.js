import { db } from "@/lib/firebaseAdmin";

async function getOverviewStats() {
  // Adjust these collection names to match what your bot actually writes.
  const [warningsSnap, ticketsSnap, activetimeSnap] = await Promise.all([
    db.collection("warnings").get(),
    db.collection("modmailTickets").where("status", "==", "open").get(),
    db.collection("activetime").get(),
  ]);

  return {
    totalWarnings: warningsSnap.size,
    openTickets: ticketsSnap.size,
    trackedStaff: activetimeSnap.size,
  };
}

export default async function OverviewPage() {
  const stats = await getOverviewStats();

  const cards = [
    { label: "Total warnings", value: stats.totalWarnings },
    { label: "Open ModMail tickets", value: stats.openTickets },
    { label: "Staff tracked", value: stats.trackedStaff },
  ];

  return (
    <div>
      <h1 className="text-xl font-medium mb-6">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-panel border border-border rounded-xl p-5"
          >
            <div className="text-sm text-gray-400 mb-1">{c.label}</div>
            <div className="text-2xl font-medium">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
