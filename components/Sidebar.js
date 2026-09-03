"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/", label: "Overview" },
  { href: "/warnings", label: "Warnings" },
  { href: "/staff-activity", label: "Staff activity" },
  { href: "/modmail", label: "ModMail tickets" },
  { href: "/bot-health", label: "Bot health" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-panel p-4 flex flex-col">
      <div className="font-medium text-lg mb-6">Pixel Villa</div>
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
