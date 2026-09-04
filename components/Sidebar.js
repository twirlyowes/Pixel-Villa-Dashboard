"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const mainLinks = [
  { href: "/", label: "Overview", icon: "⌂" },
  { href: "/staff-activity", label: "Staff Activity", icon: "◉" },
  { href: "/warnings", label: "Warnings", icon: "⚠" },
  { href: "/afk", label: "AFK", icon: "◌" },
];

const adminLinks = [
  { href: "/moderation", label: "Moderation", icon: "◆" },
  { href: "/hqc", label: "High Quality Commands", icon: "✦" },
];

const systemLinks = [
  { href: "/bot-health", label: "Bot Health", icon: "●" },
  { href: "/security", label: "Verification & Automod", icon: "◇" },
];

function NavLink({ href, label, icon, pathname }) {
  const active =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`sidebar-link ${active ? "active" : ""}`}
    >
      <span
        style={{
          width: 22,
          textAlign: "center",
          fontSize: 14,
          opacity: active ? 1 : 0.7,
        }}
      >
        {icon}
      </span>

      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isAdmin = session?.user?.isAdmin === true;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-title">
          Pixel Villa
        </div>

        <div className="sidebar-brand-subtitle">
          Staff Dashboard
        </div>
      </div>

      <div className="sidebar-section">
        Dashboard
      </div>

      {mainLinks.map((link) => (
        <NavLink
          key={link.href}
          {...link}
          pathname={pathname}
        />
      ))}

      {isAdmin && (
        <>
          <div className="sidebar-section">
            Administration
          </div>

          {adminLinks.map((link) => (
            <NavLink
              key={link.href}
              {...link}
              pathname={pathname}
            />
          ))}
        </>
      )}

      <div className="sidebar-section">
        System
      </div>

      {systemLinks.map((link) => (
        <NavLink
          key={link.href}
          {...link}
          pathname={pathname}
        />
      ))}

      {/* Sign Out */}
      <button
        type="button"
        onClick={() =>
          signOut({
            callbackUrl: "/login",
          })
        }
        className="sidebar-link"
        style={{
          width: "100%",
          border: "none",
          cursor: "pointer",
          background: "transparent",
          marginTop: 8,
          textAlign: "left",
        }}
      >
        <span
          style={{
            width: 22,
            textAlign: "center",
            fontSize: 14,
            opacity: 0.7,
          }}
        >
          ↪
        </span>

        <span>Sign Out</span>
      </button>

      <div
        style={{
          marginTop: "auto",
          paddingTop: 24,
          fontSize: 10,
          color: "rgba(148, 163, 184, 0.35)",
          textAlign: "center",
        }}
      >
        Pixel Villa Support
      </div>
    </aside>
  );
}