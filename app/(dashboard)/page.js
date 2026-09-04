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
// Never allow Firestore .doc() to receive an empty value
if (!userId || typeof userId !== "string" || userId.trim() === "") {
return {
warnings: 0,
isAfk: false,
activeTime: 0,
};
}

const safeUserId = userId.trim();

const [warnDoc, afkDoc, activeDoc] = await Promise.all([
db.collection("warnings").doc(safeUserId).get(),
db.collection("afk").doc(safeUserId).get(),
db.collection("activetime").doc(safeUserId).get(),
]);

return {
warnings: warnDoc.exists
? (warnDoc.data()?.warnings || []).length
: 0,

isAfk: afkDoc.exists,

activeTime: activeDoc.exists
  ? activeDoc.data()?.activeTime || 0
  : 0,

};
}

function formatDuration(ms = 0) {
const totalMinutes = Math.floor(ms / 60000);
const h = Math.floor(totalMinutes / 60);
const m = totalMinutes % 60;

return "${h}h ${m}m";
}

export default async function OverviewPage() {
const session = await getServerSession(authOptions);

// No session
if (!session?.user) {
return (
<div>
<h1 className="text-xl font-medium">Unauthorized</h1>
<p className="text-gray-400 mt-2">
Please sign in to access the dashboard.
</p>
</div>
);
}

const isAdmin = session.user.isAdmin === true;

// ADMIN DASHBOARD
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
        <div
          key={c.label}
          className="bg-panel border border-border rounded-xl p-5"
        >
          <div className="text-sm text-gray-400 mb-1">
            {c.label}
          </div>

          <div className="text-2xl font-medium">
            {c.value}
          </div>
        </div>
      ))}
    </div>
  </div>
);

}

// NORMAL STAFF USER
const discordId = session.user.discordId;

// Do NOT query Firestore without a Discord ID
if (
!discordId ||
typeof discordId !== "string" ||
discordId.trim() === ""
) {
return (
<div>
<h1 className="text-xl font-medium mb-6">
Welcome, {session.user.username || "Staff Member"}
</h1>

    <div className="bg-panel border border-border rounded-xl p-5">
      <p className="text-gray-400">
        Your Discord ID could not be found in your current session.
        Please sign out and sign in again.
      </p>
    </div>
  </div>
);

}

const own = await getOwnStats(discordId);

const cards = [
{ label: "Your warnings", value: own.warnings },
{ label: "AFK status", value: own.isAfk ? "AFK" : "Active" },
{
label: "Your active time today",
value: formatDuration(own.activeTime),
},
];

return (
<div>
<h1 className="text-xl font-medium mb-6">
Welcome, {session.user.username || "Staff Member"}
</h1>

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {cards.map((c) => (
      <div
        key={c.label}
        className="bg-panel border border-border rounded-xl p-5"
      >
        <div className="text-sm text-gray-400 mb-1">
          {c.label}
        </div>

        <div className="text-2xl font-medium">
          {c.value}
        </div>
      </div>
    ))}
  </div>
</div>

);
}