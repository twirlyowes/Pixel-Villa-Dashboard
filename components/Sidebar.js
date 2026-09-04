"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const mainLinks = [
  {
    href: "/",
    label: "Overview",
    icon: "⌂",
  },
  {
    href: "/staff-activity",
    label: "Staff Activity",
    icon: "◉",
  },
  {
    href: "/warnings",
    label: "Warnings",
    icon: "⚠",
  },
  {
    href: "/afk",
    label: "AFK",
    icon: "◌",
  },
];

const adminLinks = [
  {
    href: "/moderation",
    label: "Moderation",
    icon: "◆",
  },
  {
    href: "/hqc",
    label: "High Quality Commands",
    icon: "✦",
  },
];

const systemLinks = [
  {
    href: "/bot-health",
    label: "Bot Health",
    icon: "●",
  },
  {
    href: "/security",
    label: "Verification & Automod",
    icon: "◇",
  },
];

function NavLink({ href, label, icon, pathname }) {
  const active =
    href === "/"
      ? pathname === "/"
      : pathname === href ||
        pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`sidebar-link ${active ? "active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <span
        style={{
          width: 22,
          minWidth: 22,
          textAlign: "center",
          fontSize: 14,
          opacity: active ? 1 : 0.7,
        }}
        aria-hidden="true"
      >
        {icon}
      </span>

      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </Link>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="sidebar-section">
      {children}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  const {
    data: session,
    status,
  } = useSession();

  const isAdmin =
    session?.user?.isAdmin === true;

  const isLoading =
    status === "loading";

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-title">
          Pixel Villa
        </div>

        <div className="sidebar-brand-subtitle">
          Staff Dashboard
        </div>
      </div>

      {/* Dashboard */}
      <SectionTitle>
        Dashboard
      </SectionTitle>

      {mainLinks.map((link) => (
        <NavLink
          key={link.href}
          {...link}
          pathname={pathname}
        />
      ))}

      {/* Administration */}
      {isAdmin && !isLoading && (
        <>
          <SectionTitle>
            Administration
          </SectionTitle>

          {adminLinks.map((link) => (
            <NavLink
              key={link.href}
              {...link}
              pathname={pathname}
            />
          ))}
        </>
      )}

      {/* System */}
      <SectionTitle>
        System
      </SectionTitle>

      {systemLinks.map((link) => (
        <NavLink
          key={link.href}
          {...link}
          pathname={pathname}
        />
      ))}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

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
        aria-label="Sign out"
      >
        <span
          style={{
            width: 22,
            minWidth: 22,
            textAlign: "center",
            fontSize: 14,
            opacity: 0.7,
          }}
          aria-hidden="true"
        >
          ↪
        </span>

        <span>
          Sign Out
        </span>
      </button>

      {/* Footer */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 16,
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