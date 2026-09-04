import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/firebaseAdmin";

async function getAdminStats() {
  const [warningsSnap, afkSnap, activeSnap] = await Promise.all([
    db.collection("warnings").get(),
    db.collection("afk").get(),
    db.collection("activetime").get(),
  ]);

  const activeToday = activeSnap.docs.filter(
    (d) => (d.data().activeTime || 0) > 0
  ).length;

  return {
    usersWithWarnings: warningsSnap.size,
    currentlyAfk: afkSnap.size,
    activeToday,
  };
}

async function getOwnStats(userId) {
  const [warnDoc, afkDoc, activeDoc] = await Promise.all([
    db.collection("warnings").doc(userId).get(),
    db.collection("afk").doc(userId).get(),
    db.collection("activetime").doc(userId).get(),
  ]);

  return {
    warnings: warnDoc.exists ? (warnDoc.data().warnings || []).length : 0,
    isAfk: afkDoc.exists,
    activeTime: activeDoc.exists ? activeDoc.data().activeTime || 0 : 0,
  };
}

function formatDuration(ms = 0) {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

export default async function OverviewPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.isAdmin;

  if (isAdmin) {
    const stats = await getAdminStats();
    const cards = [
      { label: "Users with warnings", value: stats.usersWithWarnings },
      { label: "Currently AFK", value: stats.currentlyAfk },
      { label: "Staff active today", value: stats.activeToday },
    ];

    return (
      <div>
        <h1 className="text-xl font-medium mb-6">Overview</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="bg-panel border border-border rounded-xl p-5">
              <div className="text-sm text-gray-400 mb-1">{c.label}</div>
              <div className="text-2xl font-medium">{c.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const own = await getOwnStats(session.user.discordId);
  const cards = [
    { label: "Your warnings", value: own.warnings },
    { label: "AFK status", value: own.isAfk ? "AFK" : "Active" },
    { label: "Your active time today", value: formatDuration(own.activeTime) },
  ];

  return (
    <div>
      <h1 className="text-xl font-medium mb-6">
        Welcome, {session.user.username}
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-panel border border-border rounded-xl p-5">
            <div className="text-sm text-gray-400 mb-1">{c.label}</div>
            <div className="text-2xl font-medium">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}