"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function Footer({ variant = "app" }: { variant?: "app" | "marketing" }) {
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
      className="site-footer"
      style={{
        background: "linear-gradient(180deg, #0d1116 0%, #07090c 100%)",
        borderTop: "1px solid var(--line)",
        paddingTop: "var(--s-7)",
        paddingBottom: "var(--s-5)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div className="wrap stack-lg">
        <div className="footer-grid">
          <div className="footer-brand stack" style={{ gap: "var(--s-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
              <span
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontWeight: 900,
                  fontSize: "1.65rem",
                  letterSpacing: "-0.04em",
                  color: "var(--ink)",
                }}
              >
                LEDGER
              </span>
              <span className="chip chip--brand" style={{ fontSize: "0.625rem" }}>
                Precision Accounting
              </span>
            </div>
            <p className="note footer-tagline" style={{ margin: 0, lineHeight: 1.6, color: "var(--ink-muted)" }}>
              Every taka accounted for, down to the exact paisa. A high-performance double-entry accounting engine computing in exact decimal arithmetic with zero float drift.
            </p>
            <p className="footer-verified" style={{ margin: 0, color: "var(--lime)", fontWeight: 600 }}>
              <span className="footer-tick" aria-hidden="true" style={{ marginRight: "var(--s-1)" }}>
                ✓
              </span>
              Verified against all 25 published cases and 14 autonomous double-entry invariant rules.
            </p>
          </div>

          {variant === "app" ? (
            <nav className="footer-col stack" style={{ gap: "var(--s-2)" }} aria-label="Application">
              <p className="label" style={{ color: "var(--lime)" }}>Application</p>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/sales">Sales & Invoicing</Link>
              <Link href="/purchases">Purchases & Payables</Link>
              <Link href="/staff">Staff & Payroll</Link>
              <Link href="/assets">Fixed Asset Register</Link>
              <Link href="/tax">Statutory VAT</Link>
              <Link href="/reports">Financial Reports</Link>
            </nav>
          ) : (
            <nav className="footer-col stack" style={{ gap: "var(--s-2)" }} aria-label="Product">
              <p className="label" style={{ color: "var(--lime)" }}>Navigation</p>
              <Link href="/modules">Modules Directory</Link>
              <Link href="/about">About & Ecosystem</Link>
              <Link href="/pricing">Pricing & Plans</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/login">Launch Demo Account</Link>
            </nav>
          )}

          <div className="footer-col stack" style={{ gap: "var(--s-2)" }}>
            <p className="label" style={{ color: "var(--lime)" }}>Mathematical Integrity</p>
            <span className="muted">Exact decimal arithmetic (decimal.js)</span>
            <span className="muted">Half-up paisa rounding at every step</span>
            <span className="muted">Continuous invariant checks (I1–I6)</span>
            <span className="muted">Statutory NBR Form 9.1 whole-taka rules</span>
            <span className="muted">Zero timezone calendar arithmetic</span>
          </div>
        </div>

        <div
          className="footer-base row-between"
          style={{
            borderTop: "1px solid var(--line)",
            paddingTop: "var(--s-4)",
            fontSize: "var(--t-xs)",
          }}
        >
          <p className="label" style={{ margin: 0, textTransform: "none", color: "var(--ink-muted)" }}>
            Ledger — Precision-engineered double-entry accounting software.
          </p>
          <div>
            <span className="label footer-muted" style={{ margin: 0 }}>Amounts in Bangladeshi Taka (BDT)</span>
          </div>
        </div>

        {/* Luminous Typographical Watermark at the Bottom */}
        <div
          style={{
            userSelect: "none",
            pointerEvents: "none",
            textAlign: "center",
            marginTop: "var(--s-6)",
            marginBottom: "calc(-1 * var(--s-4))",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(7rem, 26vw, 22rem)",
              fontWeight: 900,
              letterSpacing: "-0.055em",
              lineHeight: 0.75,
              display: "block",
              textTransform: "uppercase",
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(184, 255, 46, 0.12) 40%, rgba(56, 189, 248, 0.04) 80%, transparent 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextStroke: "1px rgba(184, 255, 46, 0.1)",
              filter: "drop-shadow(0 0 40px rgba(184, 255, 46, 0.08))",
            }}
          >
            LEDGER
          </span>
        </div>
      </div>

      {/* Single Floating Upward Arrow (↑) Back-to-Top Button */}
      {showScrollTop ? (
        <button
          type="button"
          onClick={scrollToTop}
          style={{
            position: "fixed",
            bottom: "var(--s-5)",
            right: "var(--s-5)",
            zIndex: 60,
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "rgba(13, 17, 22, 0.9)",
            color: "var(--lime)",
            border: "1px solid rgba(184, 255, 46, 0.4)",
            boxShadow: "0 0 20px rgba(184, 255, 46, 0.25), 0 10px 25px rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.25rem",
            cursor: "pointer",
            transition: "all var(--fast) var(--ease)",
          }}
          aria-label="Back to top"
        >
          ↑
        </button>
      ) : null}
    </footer>
  );
}
