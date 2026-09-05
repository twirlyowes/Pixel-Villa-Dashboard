"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

const staffItems = [
  {
    href: "/warnings",
    icon: "⚠️",
    title: "Warnings",
    description: "Issue and manage member warnings.",
  },
  {
    href: "/moderation",
    icon: "🛡️",
    title: "Moderation",
    description: "Mute, unmute and manage members.",
  },
  {
    href: "/afk",
    icon: "💤",
    title: "My AFK",
    description: "View your current AFK status.",
  },
  {
    href: "/staff-activity",
    icon: "📊",
    title: "My Activity",
    description: "View your staff activity and actions.",
  },
  {
    href: "/bot-health",
    icon: "🤖",
    title: "Bot Health",
    description: "Check Pixel Villa Support status.",
  },
];

const adminItems = [
  {
    href: "/hqc",
    icon: "✦",
    title: "High Quality Commands",
    description: "Access administrator-only commands.",
  },
  {
    href: "/afk",
    icon: "💤",
    title: "All AFK Users",
    description: "View everyone currently marked AFK.",
  },
  {
    href: "/staff-activity",
    icon: "📈",
    title: "Staff Activity",
    description: "View activity from the entire staff team.",
  },
];

function StatCard({ icon, label, value, description }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-sky-300/10 bg-[#0b1b29]/80 p-5 backdrop-blur-xl transition hover:border-sky-300/25">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-sky-400/10 blur-3xl transition group-hover:bg-sky-400/20" />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-2xl">{icon}</span>

          <span className="rounded-lg border border-sky-300/10 bg-sky-300/5 px-2 py-1 text-[10px] uppercase tracking-wider text-sky-200/40">
            Live
          </span>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-sky-200/45">
          {label}
        </p>

        <p className="mt-1 text-3xl font-bold text-white">
          {value}
        </p>

        <p className="mt-2 text-xs text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function DashboardCard({ item }) {
  return (
    <Link
      href={item.href}
      className="group relative flex min-h-[150px] flex-col overflow-hidden rounded-2xl border border-sky-300/10 bg-[#0b1b29]/75 p-5 backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-sky-300/25 hover:bg-[#0d2232]"
    >
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-sky-400/5 blur-3xl transition group-hover:bg-sky-400/15" />

      <div className="relative flex h-full flex-col">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-300/10 bg-sky-300/5 text-xl">
            {item.icon}
          </div>

          <span className="text-lg text-sky-300/30 transition group-hover:translate-x-1 group-hover:text-sky-300">
            →
          </span>
        </div>

        <h3 className="text-base font-bold text-white">
          {item.title}
        </h3>

        <p className="mt-1 text-sm leading-5 text-slate-400">
          {item.description}
        </p>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#06131f] text-sky-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-sky-300/20 border-t-sky-300" />
          <p className="text-sm text-sky-200/50">
            Loading dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#06131f] px-5 text-white">
        <div className="text-center">
          <p className="mb-4 text-slate-400">
            Your session has expired.
          </p>

          <Link
            href="/login"
            className="rounded-xl bg-sky-400 px-5 py-3 font-bold text-[#03111b]"
          >
            Return to Login
          </Link>
        </div>
      </main>
    );
  }

  const isAdmin = session.user?.isAdmin === true;

  const username =
    session.user?.username ||
    session.user?.name ||
    "Staff";

  const discordId =
    session.user?.discordId ||
    session.user?.id ||
    "";

  return (
    <main className="min-h-screen bg-[#06131f] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[20%] top-[-250px] h-[500px] w-[500px] rounded-full bg-sky-400/10 blur-[140px]" />
        <div className="absolute bottom-[-300px] right-[-150px] h-[550px] w-[550px] rounded-full bg-sky-500/5 blur-[140px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-sky-300/10 bg-[#06131f]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-300/15 bg-sky-400/10">
              🩵
            </div>

            <div>
              <p className="text-sm font-bold text-white">
                Pixel Villa
              </p>

              <p className="text-[10px] uppercase tracking-widest text-sky-300/40">
                Support Dashboard
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-white">
                {username}
              </p>

              <p className="text-[11px] text-sky-300/40">
                {isAdmin ? "Administrator" : "Staff Member"}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-300/15 bg-sky-300/10 font-bold text-sky-200">
              {username.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-xl border border-red-300/10 bg-red-400/5 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/10"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">

        {/* Hero */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-sky-300/10 bg-[#0b1b29]/80 p-6 backdrop-blur-2xl sm:p-8">
          <div className="absolute right-[-100px] top-[-150px] h-[350px] w-[350px] rounded-full bg-sky-400/10 blur-[100px]" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-300/10 bg-sky-300/5 px-3 py-1.5 text-xs font-medium text-sky-200/70">
              <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.6)]" />
              Pixel Villa Support Online
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-sky-300 to-cyan-200 bg-clip-text text-transparent">
                {username}
              </span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Manage Pixel Villa moderation, staff systems and
              server operations from one secure dashboard.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/moderation"
                className="rounded-xl bg-sky-400 px-5 py-3 text-sm font-bold text-[#03111b] transition hover:bg-sky-300"
              >
                Open Moderation
              </Link>

              <Link
                href="/warnings"
                className="rounded-xl border border-sky-300/10 bg-sky-300/5 px-5 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-300/10"
              >
                View Warnings
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-lg font-bold">
              Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Server information and dashboard statistics.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon="👥"
              label="Members"
              value="—"
              description="Server member count"
            />

            {isAdmin && (
              <StatCard
                icon="💤"
                label="AFK Users"
                value="—"
                description="Currently AFK"
              />
            )}

            <StatCard
              icon="⚠️"
              label="Warnings"
              value="—"
              description="Total warnings issued"
            />

            <StatCard
              icon="🤖"
              label="Bot"
              value="Online"
              description="Pixel Villa Support"
            />
          </div>
        </section>

        {/* Staff systems */}
        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-lg font-bold">
              Staff Systems
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Tools available to Pixel Villa staff.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {staffItems.map((item) => (
              <DashboardCard
                key={item.href}
                item={item}
              />
            ))}
          </div>
        </section>

        {/* Admin systems */}
        {isAdmin && (
          <section className="mb-10">
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold">
                  Administration
                </h2>

                <span className="rounded-full border border-amber-300/15 bg-amber-300/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Admin Only
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Restricted systems available only to administrators.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {adminItems.map((item) => (
                <DashboardCard
                  key={item.href}
                  item={item}
                />
              ))}
            </div>
          </section>
        )}

        {/* Account */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-sky-300/10 bg-[#0b1b29]/75 p-5 backdrop-blur-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-300/40">
              ACCOUNT
            </p>

            <div className="mt-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-300/15 bg-sky-300/10 text-xl font-bold text-sky-200">
                {username.charAt(0).toUpperCase()}
              </div>

              <div>
                <p className="font-bold text-white">
                  {username}
                </p>

                <p className="text-xs text-slate-500">
                  Discord ID: {discordId || "Unavailable"}
                </p>

                <p className="mt-1 text-xs font-semibold text-sky-300">
                  {isAdmin
                    ? "Administrator"
                    : "Staff Member"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-300/10 bg-[#0b1b29]/75 p-5 backdrop-blur-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-300/40">
              ACCESS LEVEL
            </p>

            <div className="mt-5 flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.6)]" />

              <p className="font-bold text-white">
                {isAdmin
                  ? "Full Administrative Access"
                  : "Staff Access"}
              </p>
            </div>

            <p className="mt-3 text-sm leading-5 text-slate-500">
              Dashboard permissions are automatically enforced
              according to your account access level.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 border-t border-sky-300/10 pt-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-sky-300/25">
            Pixel Villa • Support Dashboard
          </p>
        </footer>
      </div>
    </main>
  );
}