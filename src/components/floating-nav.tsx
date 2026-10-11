"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function FloatingNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className="floating-nav-wrap"
      style={{
        position: "sticky",
        top: "var(--s-3)",
        zIndex: 50,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        paddingInline: "var(--s-3)",
        pointerEvents: "none",
      }}
    >
      <div
        className="floating-nav"
        style={{
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--s-4)",
          width: "100%",
          maxWidth: "80rem", /* max-w-7xl */
          padding: "var(--s-2) var(--s-5)",
          background: scrolled
            ? "rgba(20, 21, 20, 0.96)"
            : "rgba(20, 21, 20, 0.90)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(216, 84, 61, 0.25)",
          borderRadius: "var(--radius-pill)",
          boxShadow: scrolled
            ? "0 16px 36px -6px rgba(0, 0, 0, 0.4), 0 0 20px rgba(216, 84, 61, 0.08)"
            : "0 6px 20px -2px rgba(0, 0, 0, 0.3)",
          transition: "all var(--fast) var(--ease)",
        }}
      >
        {/* Brand Logo & Wordmark */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--s-2)",
            textDecoration: "none",
            color: "#FAF7F2",
            flexShrink: 0,
          }}
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ borderRadius: "8px" }}
          >
            <rect width="32" height="32" rx="8" fill="#141514" stroke="#262725" />
            <rect x="7" y="8" width="7" height="16" rx="2" fill="#FAF7F2" />
            <rect x="18" y="12" width="7" height="12" rx="2" fill="#D8543D" />
            <circle cx="21.5" cy="8.5" r="2.5" fill="#FAF7F2" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontWeight: 900,
                fontSize: "1.15rem",
                letterSpacing: "-0.035em",
                color: "#FAF7F2",
              }}
            >
              LEDGER
            </span>
          </div>
        </Link>

        {/* Minimal Navigation: Modules, Pricing, About, Sign in, Launch App */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
          <Link
            href="/modules"
            style={{
              padding: "var(--s-1) var(--s-3)",
              color: pathname === "/modules" ? "#D8543D" : "#FAF7F2",
              textDecoration: "none",
              fontSize: "var(--t-sm)",
              fontWeight: pathname === "/modules" ? 700 : 500,
              transition: "color var(--fast) var(--ease)",
            }}
          >
            Modules
          </Link>

          <Link
            href="/pricing"
            style={{
              padding: "var(--s-1) var(--s-3)",
              color: pathname === "/pricing" ? "#D8543D" : "#FAF7F2",
              textDecoration: "none",
              fontSize: "var(--t-sm)",
              fontWeight: pathname === "/pricing" ? 700 : 500,
              transition: "color var(--fast) var(--ease)",
            }}
          >
            Pricing
          </Link>

          <Link
            href="/about"
            style={{
              padding: "var(--s-1) var(--s-3)",
              color: pathname === "/about" ? "#D8543D" : "#FAF7F2",
              textDecoration: "none",
              fontSize: "var(--t-sm)",
              fontWeight: pathname === "/about" ? 700 : 500,
              transition: "color var(--fast) var(--ease)",
            }}
          >
            About
          </Link>

          <Link
            href="/login"
            className="btn btn--sm btn--quiet"
            style={{
              fontSize: "var(--t-xs)",
              fontWeight: 600,
              padding: "0 var(--s-3)",
              color: "#FAF7F2",
              borderColor: "#262725",
            }}
          >
            Sign in
          </Link>

          <Link
            href="/login"
            className="btn btn--sm btn--primary"
            style={{
              fontSize: "var(--t-xs)",
              fontWeight: 700,
              padding: "0 var(--s-4)",
              background: "#D8543D",
              color: "#FAF7F2",
            }}
          >
            Launch App →
          </Link>
        </div>
      </div>
    </nav>
  );
}
