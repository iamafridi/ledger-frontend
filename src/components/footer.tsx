"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function Footer({ variant = "marketing" }: { variant?: "app" | "marketing" }) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", checkScroll, { passive: true });
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      style={{
        backgroundColor: "#171817",
        color: "#ACA4BD",
        padding: "3.5rem 1.5rem 2rem 1.5rem",
        borderTop: "1px solid #282A28",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        .ledger-footer-link {
          color: #D1C9BD !important;
          text-decoration: none;
          transition: color 0.15s ease, transform 0.15s ease;
          display: inline-block;
          width: fit-content;
        }
        .ledger-footer-link:hover {
          color: #FFFDF7 !important;
          transform: translateX(2px);
        }
        .ledger-footer-legal-link {
          color: #ACA4BD !important;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .ledger-footer-legal-link:hover {
          color: #FFFDF7 !important;
        }
        .ledger-footer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 2.5rem;
          margin-bottom: 2.5rem;
        }
        @media (max-width: 640px) {
          .ledger-footer-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: "1360px",
          margin: "0 auto",
        }}
      >
        <div className="ledger-footer-grid">
          {/* Brand & Mission Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.75rem",
                textDecoration: "none",
                width: "fit-content",
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  backgroundColor: "#D8543D",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(216, 84, 61, 0.35)",
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M6 4V19H18" stroke="#F6F2E9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="17.5" cy="11.5" r="2" fill="#F6F2E9" />
                </svg>
              </div>
              <span
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  color: "#FFFDF7",
                  letterSpacing: "-0.04em",
                  fontFamily: "var(--font-sans), sans-serif",
                }}
              >
                ledger
              </span>
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  background: "rgba(216, 84, 61, 0.15)",
                  color: "#D8543D",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "999px",
                  border: "1px solid rgba(216, 84, 61, 0.3)",
                }}
              >
                Precision Accounting
              </span>
            </Link>

            <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.65, color: "#ACA4BD", maxWidth: "340px" }}>
              Every taka accounted for, down to the exact paisa. High-performance double-entry accounting engine computing in exact decimal arithmetic with zero float drift.
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.6rem",
                padding: "0.75rem 0.9rem",
                background: "rgba(216, 84, 61, 0.08)",
                border: "1px solid rgba(216, 84, 61, 0.25)",
                borderRadius: "8px",
                fontSize: "0.78rem",
                color: "#E2DDD3",
                lineHeight: 1.5,
                maxWidth: "360px",
              }}
            >
              <span style={{ color: "#D8543D", fontWeight: 800, fontSize: "0.95rem", lineHeight: 1, flexShrink: 0 }}>✓</span>
              <span>Verified against statutory NBR Form 9.1 and continuous double-entry invariant rules (I1–I16).</span>
            </div>
          </div>

          {/* Navigation Column 1: Platform */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono), monospace",
                fontWeight: 700,
                color: "#D8543D",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Platform
            </span>
            <Link href="/" className="ledger-footer-link">
              Overview
            </Link>
            <Link href="/modules" className="ledger-footer-link">
              Modules Directory (19)
            </Link>
            <Link href="/about" className="ledger-footer-link">
              About &amp; Topology
            </Link>
            <Link href="/pricing" className="ledger-footer-link">
              Pricing &amp; Plans
            </Link>
            <Link href="/login" className="ledger-footer-link">
              Sign In ↗
            </Link>
            <Link href="/login?redirect=/dashboard" className="ledger-footer-link">
              Launch Live Demo
            </Link>
          </div>

          {/* Navigation Column 2: Application / Accounting Core */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono), monospace",
                fontWeight: 700,
                color: "#D8543D",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {variant === "app" ? "Application" : "Accounting Core"}
            </span>
            <Link href="/dashboard" className="ledger-footer-link">
              Executive Dashboard
            </Link>
            <Link href="/sales" className="ledger-footer-link">
              Sales &amp; Invoicing
            </Link>
            <Link href="/purchases" className="ledger-footer-link">
              Purchases &amp; Payables
            </Link>
            <Link href="/staff" className="ledger-footer-link">
              Staff &amp; Payroll
            </Link>
            <Link href="/assets" className="ledger-footer-link">
              Fixed Asset Register
            </Link>
            <Link href="/tax" className="ledger-footer-link">
              Statutory NBR VAT 9.1
            </Link>
            <Link href="/reports" className="ledger-footer-link">
              Financial Statements
            </Link>
          </div>

          {/* Mathematical Integrity Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono), monospace",
                fontWeight: 700,
                color: "#D8543D",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Mathematical Integrity
            </span>
            <span style={{ color: "#9E9A91" }}>Exact decimal arithmetic (decimal.js)</span>
            <span style={{ color: "#9E9A91" }}>Half-up paisa rounding at every step</span>
            <span style={{ color: "#9E9A91" }}>Continuous invariant checks (I1–I16)</span>
            <span style={{ color: "#9E9A91" }}>Statutory NBR Form 9.1 whole-taka</span>
            <span style={{ color: "#9E9A91" }}>Zero timezone calendar arithmetic</span>
            <span style={{ color: "#9E9A91" }}>Append-only immutable audit trail</span>
          </div>
        </div>

        {/* Bottom Copyright & Legal Row */}
        <div
          style={{
            paddingTop: "1.75rem",
            borderTop: "1px solid #242624",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            fontSize: "0.8rem",
            fontFamily: "var(--font-mono), monospace",
            color: "#827F76",
          }}
        >
          <div>© 2026 Ledger. All rights reserved.</div>
          <div style={{ color: "#D8543D" }}>Built with care in Bangladesh</div>
          <div style={{ display: "flex", gap: "0.85rem", alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/privacy" className="ledger-footer-legal-link">Privacy</Link>
            <span>·</span>
            <Link href="/terms" className="ledger-footer-legal-link">Terms</Link>
            <span>·</span>
            <Link href="/about" className="ledger-footer-legal-link">Security</Link>
            <span>·</span>
            <span style={{ color: "#827F76" }}>Amounts in BDT</span>
          </div>
        </div>

        {/* Monumental LEDGER Typographic Landmark */}
        <div
          style={{
            marginTop: "1.75rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid #1C1E1C",
            overflow: "hidden",
            textAlign: "center",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "clamp(5.5rem, 18vw, 15rem)",
              lineHeight: "0.82",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              color: "rgba(255, 253, 247, 0.08)",
              textTransform: "uppercase",
            }}
          >
            LEDGER
          </span>
        </div>
      </div>

      {/* Floating Upward Arrow (↑) Back-to-Top Button */}
      {showScrollTop ? (
        <button
          type="button"
          onClick={scrollToTop}
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            zIndex: 90,
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "#1E201E",
            color: "#FAF7F2",
            border: "1px solid rgba(216, 84, 61, 0.4)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5), 0 0 12px rgba(216, 84, 61, 0.2)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.2rem",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#D8543D";
            e.currentTarget.style.borderColor = "#D8543D";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#1E201E";
            e.currentTarget.style.borderColor = "rgba(216, 84, 61, 0.4)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
          aria-label="Back to top"
        >
          ↑
        </button>
      ) : null}
    </footer>
  );
}
