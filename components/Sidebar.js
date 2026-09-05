"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
{
title: "GENERAL",
items: [
{ name: "Overview", href: "/dashboard", icon: "⌂" },
],
},
{
title: "MODERATION",
items: [
{ name: "Moderation", href: "/moderation", icon: "🛡" },
{ name: "Warnings", href: "/warnings", icon: "⚠" },
{ name: "Members", href: "/members", icon: "♙" },
],
},
{
title: "STAFF",
items: [
{ name: "Active Time", href: "/active-time", icon: "◉" },
{ name: "AFK", href: "/afk", icon: "💤" },
{ name: "Leaderboard", href: "/leaderboard", icon: "🏆" },
],
},
{
title: "COMMUNITY",
items: [
{ name: "ModMail", href: "/modmail", icon: "✉" },
{ name: "Announcements", href: "/announcements", icon: "📢" },
],
},
{
title: "BOT",
items: [
{ name: "Bot Status", href: "/bot", icon: "🤖" },
{ name: "Analytics", href: "/analytics", icon: "📊" },
{ name: "Logs", href: "/logs", icon: "▤" },
],
},
{
title: "ADMIN",
items: [
{ name: "Administration", href: "/admin", icon: "♛" },
{ name: "Settings", href: "/settings", icon: "⚙" },
],
},
];

export default function Sidebar() {
const pathname = usePathname();

return (
<aside className="sticky top-0 z-40 hidden h-screen w-[260px] shrink-0 border-r border-sky-300/10 bg-[#071521]/90 backdrop-blur-2xl lg:block">
<div className="flex h-full flex-col">
{/* Brand */}
<div className="border-b border-sky-300/10 px-6 py-6">
<Link href="/dashboard" className="group flex items-center gap-3">
<div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-300/20 bg-sky-400/10 text-xl shadow-[0_0_25px_rgba(56,189,248,0.08)] transition group-hover:bg-sky-400/15">
🩵
</div>

        <div>
          <div className="text-sm font-bold tracking-wide text-white">
            PIXEL VILLA
          </div>
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-sky-300/60">
            Control Panel
          </div>
        </div>
      </Link>
    </div>

    {/* Navigation */}
    <nav className="flex-1 overflow-y-auto px-3 py-5">
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.18em] text-sky-300/40">
              {section.title}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      active
                        ? "border border-sky-300/15 bg-sky-400/10 text-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.06)]"
                        : "border border-transparent text-slate-400 hover:bg-sky-400/5 hover:text-sky-200"
                    }`}
                  >
                    <span
                      className={`flex w-6 justify-center text-base transition ${
                        active
                          ? "scale-105 text-sky-300"
                          : "opacity-70 group-hover:opacity-100"
                      }`}
                    >
                      {item.icon}
                    </span>

                    <span>{item.name}</span>

                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(125,211,252,0.8)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>

    {/* Footer */}
    <div className="border-t border-sky-300/10 p-4">
      <div className="rounded-xl border border-sky-300/10 bg-sky-400/5 px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-300 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
          </span>

          <span className="text-xs font-medium text-sky-200">
            Pixel Villa Online
          </span>
        </div>

        <p className="mt-1 pl-4 text-[10px] text-slate-500">
          Control Panel
        </p>
      </div>
    </div>
  </div>
</aside>

);
}