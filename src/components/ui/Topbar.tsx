"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

interface TopbarProps {
  profile: Profile | null;
}

export default function Topbar({ profile }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navLinks = [
    { href: "/typing", label: "TYPE" },
    { href: "/leaderboard", label: "LEADERBOARD" },
    { href: "/profile", label: "PROFILE" },
  ];

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/" &&
      pathname.startsWith(href.split("/").slice(0, 2).join("/")));

  return (
    <>
      <header className="topbar">
        <Link href="/?home=true" className="logo topbar-logo">
          TYPEADS
        </Link>

        {/* Desktop nav */}
        <nav className="topbar-nav">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? "active" : ""}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="topbar-actions">
          <div className="topbar-points">
            <span style={{ color: "var(--ink-faint)" }}>BALANCE</span>
            <span>{profile?.points_balance?.toLocaleString() ?? "0"} PTS</span>
          </div>

          {profile ? (
            <>
              {profile.is_admin && (
                <Link
                  href="/admin"
                  className="btn btn-sm btn-inverted"
                  style={{
                    border: "none",
                    borderLeft: "1px solid var(--paper-darker)",
                    height: "100%",
                    padding: "0 24px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  ADMIN
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="btn btn-sm"
                style={{
                  border: "none",
                  borderLeft: "1px solid var(--paper-darker)",
                  height: "100%",
                  padding: "0 24px",
                }}
              >
                LOGOUT
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="btn btn-sm btn-inverted"
                style={{
                  border: "none",
                  borderLeft: "1px solid var(--paper-darker)",
                  height: "100%",
                  padding: "0 24px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                LOGIN
              </Link>
              <Link
                href="/signup"
                className="btn btn-sm"
                style={{
                  border: "none",
                  borderLeft: "1px solid var(--paper-darker)",
                  height: "100%",
                  padding: "0 24px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                SIGN UP
              </Link>
            </>
          )}
        </div>

        {/* Hamburger button — mobile only */}
        <button
          className={`mobile-menu-btn${menuOpen ? " open" : ""}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {/* Mobile slide-down menu */}
      <nav className={`mobile-menu${menuOpen ? " open" : ""}`} aria-hidden={!menuOpen}>
        {/* Points balance */}
        <div className="mobile-points">
          BALANCE: {profile?.points_balance?.toLocaleString() ?? "0"} PTS
        </div>

        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMenuOpen(false)}
            style={{
              fontWeight: isActive(link.href) ? 700 : undefined,
              borderBottom: isActive(link.href)
                ? "2px solid var(--ink)"
                : undefined,
            }}
          >
            {link.label}
          </Link>
        ))}

        {profile ? (
          <>
            {profile.is_admin && (
              <Link href="/admin" onClick={() => setMenuOpen(false)}>
                ADMIN
              </Link>
            )}
            <button onClick={handleLogout}>LOGOUT</button>
          </>
        ) : (
          <>
            <Link href="/login" onClick={() => setMenuOpen(false)}>
              LOGIN
            </Link>
            <Link href="/signup" onClick={() => setMenuOpen(false)}>
              SIGN UP
            </Link>
          </>
        )}
      </nav>
    </>
  );
}
