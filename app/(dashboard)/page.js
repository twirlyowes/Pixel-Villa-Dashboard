"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

const cards = [
  {
    href: "/staff-activity",
    icon: "◉",
    title: "Staff Activity",
    description: "View active time, messages, commands and staff activity.",
  },
  {
    href: "/warnings",
    icon: "⚠",
    title: "Warnings",
    description: "Search and manage staff warnings.",
  },
  {
    href: "/afk",
    icon: "◌",
    title: "AFK Management",
    description: "View current AFK users and their reasons.",
  },
  {
    href: "/moderation",
    icon: "◆",
    title: "Moderation",
    description: "Access moderation tools and member actions.",
    admin: true,
  },
  {
    href: "/hqc",
    icon: "✦",
    title: "High Quality Commands",
    description: "Reference and manage high quality staff commands.",
    admin: true,
  },
  {
    href: "/security",
    icon: "◇",
    title: "Verification & Automod",
    description: "View verification and automod systems.",
  },
  {
    href: "/bot-health",
    icon: "●",
    title: "Bot Health",
    description: "Check the current status of Pixel Villa Support.",
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();

  const isAdmin = session?.user?.isAdmin === true;
  const username =
    session?.user?.username ||
    session?.user?.name ||
    "Staff";

  const visibleCards = cards.filter(
    (card) => !card.admin || isAdmin
  );

  return (
    <div className="page-container">
      <section className="hero-card">
        <div className="hero-glow" />

        <div className="hero-content">
          <div className="status-pill">
            <span className="status-dot" />
            Pixel Villa Support
          </div>

          <h1 className="page-title">
            Welcome back,{" "}
            <span className="gradient-text">{username}</span>
          </h1>

          <p className="page-subtitle">
            Manage Pixel Villa staff systems, moderation tools and
            server statistics from one place.
          </p>

          <div className="hero-actions">
            <Link href="/staff-activity" className="glass-button primary">
              View Staff Activity
            </Link>

            <Link href="/bot-health" className="glass-button">
              Bot Health
            </Link>
          </div>
        </div>
      </section>

      <section className="section-header">
        <div>
          <h2 className="section-title">Dashboard</h2>
          <p className="section-description">
            Quick access to your available staff systems.
          </p>
        </div>
      </section>

      <section className="dashboard-grid">
        {visibleCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="dashboard-card"
          >
            <div className="dashboard-card-icon">
              {card.icon}
            </div>

            <div className="dashboard-card-content">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>

            <div className="dashboard-card-arrow">
              →
            </div>
          </Link>
        ))}
      </section>

      <section className="info-grid">
        <div className="glass-panel">
          <div className="panel-label">ACCOUNT</div>

          <div className="account-row">
            <div className="account-avatar">
              {username.charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="account-name">{username}</div>
              <div className="account-role">
                {isAdmin ? "Administrator" : "Staff Member"}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <div className="panel-label">ACCESS LEVEL</div>

          <div className="access-value">
            <span className="access-dot" />
            {isAdmin ? "Full Administrative Access" : "Staff Access"}
          </div>

          <p className="panel-description">
            Your dashboard features are automatically restricted
            according to your access level.
          </p>
        </div>
      </section>
    </div>
  );
}