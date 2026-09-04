"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin;

  const links = [
    { href: "/", label: "Overview" },
    { href: "/warnings", label: "Warnings" },
    { href: "/staff-activity", label: "Staff activity" },
    { href: "/afk", label: "AFK" },
    ...(isAdmin ? [{ href: "/moderation", label: "Moderation" }] : []),
    { href: "/bot-health", label: "Bot health" },
  ];

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-panel p-4 flex flex-col">
      <div className="font-medium text-lg mb-1">Pixel Villa</div>
      {session?.user?.username && (
        <div className="text-xs text-gray-500 mb-5">
          {session.user.username} {isAdmin && "· Admin"}
        </div>
      )}
      <nav className="flex flex-col gap-1 flex-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-2 rounded-lg text-sm ${
              pathname === link.href
                ? "bg-accent text-white"
                : "text-gray-300 hover:bg-white/5"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-sm text-gray-400 hover:text-gray-200 text-left px-3 py-2"
      >
        Sign out
      </button>
    </aside>
  );
}