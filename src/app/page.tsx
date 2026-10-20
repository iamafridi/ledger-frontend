"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Layers,
  TrendingUp,
  ShieldCheck,
  Building2,
  Receipt,
  ScanLine,
  Landmark,
  Calculator,
  PieChart,
} from "lucide-react";
import StaggeredMenu from "@/components/StaggeredMenu";
import { PUBLIC_NAV_ITEMS, PUBLIC_SOCIAL_ITEMS } from "@/lib/nav";

const ledgerMenuItems = PUBLIC_NAV_ITEMS;
const ledgerSocialItems = PUBLIC_SOCIAL_ITEMS;

import { CoreWorkflowBento } from "@/components/landing/CoreWorkflowBento";
import { BusinessRoiCalculator } from "@/components/landing/BusinessRoiCalculator";
import { PricingSection } from "@/components/landing/PricingSection";
import { SocialProofTestimonials } from "@/components/landing/SocialProofTestimonials";
import { LandingFaqSection } from "@/components/landing/LandingFaqSection";
import { FinancialClarityVisualizer } from "@/components/landing/FinancialClarityVisualizer";
import { InteractiveHeroDashboard } from "@/components/landing/InteractiveHeroDashboard";
import { CountUpNumber } from "@/components/landing/CountUpNumber";
import { FinancialTelemetryTicker } from "@/components/landing/financial-telemetry-ticker";
import { JournalVoucherStack } from "@/components/landing/JournalVoucherStack";
import { InteractiveReceiptScanner } from "@/components/landing/InteractiveReceiptScanner";
import { StackScrollSection } from "@/components/landing/stack-scroll-section";

export default function LandingPage() {
  // Form submission state
  const [formEmail, setFormEmail] = useState("");
  const [formPurpose, setFormPurpose] = useState("Both");
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim()) return;
    setFormSubmitted(true);
  };

  return (
    <div
      style={{
        backgroundColor: "#FAF7F2",
        color: "#141514",
        minHeight: "100vh",
        fontFamily: "var(--font-sans), sans-serif",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* ────────────────────────────────────────────────────────────────────────
          1. STAGGERED FULL-SCREEN NAVIGATION & EDITORIAL HEADER
      ──────────────────────────────────────────────────────────────────────── */}
      <StaggeredMenu
        position="right"
        items={ledgerMenuItems}
        socialItems={ledgerSocialItems}
        displaySocials={true}
        displayItemNumbering={true}
        menuButtonColor="#141514"
        openMenuButtonColor="#FFFDF7"
        accentColor="#D8543D"
        colors={["#D8543D", "#141514", "#141514"]}
        isFixed={true}
        closeOnClickAway={true}
      />

      {/* Subtle top spacer for fixed header bar */}
      <div style={{ height: "clamp(1.25rem, 2vw, 1.75rem)" }} />

      {/* ────────────────────────────────────────────────────────────────────────
          2. HERO SECTION
      ──────────────────────────────────────────────────────────────────────── */}
      <section
        id="product"
        style={{
          padding: "clamp(1.5rem, 3vw, 2.25rem) 2rem",
          maxWidth: "1440px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 500px), 1fr))",
            gap: "2.25rem",
            alignItems: "center",
          }}
        >
          {/* Left Hero Column */}
          <div style={{ maxWidth: "580px" }}>
            {/* Eyebrow */}
            <div
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "0.76rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#54524c",
                marginBottom: "0.85rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.55rem",
                backgroundColor: "#F3EFE6",
                padding: "0.35rem 0.75rem",
                borderRadius: "20px",
                border: "1px solid #E2DDD3",
              }}
            >
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#D8543D" }} />
              BANGLADESH &amp; GLOBAL · DOUBLE-ENTRY SYSTEM
            </div>

            {/* Headline */}
            <h1
              style={{
                fontFamily: "var(--font-serif), serif",
                fontSize: "clamp(3.85rem, 8vw, 6.25rem)",
                lineHeight: "1.02",
                fontWeight: 700,
                letterSpacing: "-0.035em",
                color: "#141514",
                marginBottom: "1rem",
              }}
            >
              Every taka. <br />
              <em style={{ fontStyle: "italic", fontWeight: 400, color: "#D8543D" }}>Accounted for.</em>
            </h1>

            {/* Supporting Copy */}
            <p
              style={{
                fontSize: "1.08rem",
                lineHeight: "1.65",
                color: "#54524c",
                marginBottom: "1.25rem",
              }}
            >
              Ledger brings personal money and business accounting into one calm, rigorous system — so you can see what
              matters, make the next decision, and move with confidence.
            </p>

            {/* Invariant Trust Badges */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                marginBottom: "1.25rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.78rem",
                  fontFamily: "var(--font-mono), monospace",
                  color: "#54524c",
                  backgroundColor: "#F3EFE6",
                  border: "1px solid #E2DDD3",
                  padding: "0.32rem 0.75rem",
                  borderRadius: "6px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                }}
              >
                <span style={{ color: "#D8543D", fontWeight: 700 }}>✓</span> Zero IEEE-754 Floats
              </span>
              <span
                style={{
                  fontSize: "0.78rem",
                  fontFamily: "var(--font-mono), monospace",
                  color: "#54524c",
                  backgroundColor: "#F3EFE6",
                  border: "1px solid #E2DDD3",
                  padding: "0.32rem 0.75rem",
                  borderRadius: "6px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                }}
              >
                <span style={{ color: "#D8543D", fontWeight: 700 }}>✓</span> NBR Mushak 6.3 Ready
              </span>
              <span
                style={{
                  fontSize: "0.78rem",
                  fontFamily: "var(--font-mono), monospace",
                  color: "#54524c",
                  backgroundColor: "#F3EFE6",
                  border: "1px solid #E2DDD3",
                  padding: "0.32rem 0.75rem",
                  borderRadius: "6px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                }}
              >
                <span style={{ color: "#D8543D", fontWeight: 700 }}>✓</span> Append-Only Audit Trail
              </span>
            </div>

            {/* CTAs */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.25rem",
                flexWrap: "wrap",
                marginBottom: "1.5rem",
              }}
            >
              <Link
                href="/login?redirect=/dashboard"
                className="hero-primary-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  backgroundColor: "#141514",
                  color: "#FFFDF7",
                  padding: "0.85rem 1.6rem",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  boxShadow: "0 4px 12px rgba(20, 21, 20, 0.15)",
                }}
              >
                Open Live Dashboard ↗
              </Link>
              <a
                href="#workflows"
                className="hero-secondary-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  color: "#141514",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  padding: "0.5rem 0",
                  borderBottom: "1.5px solid #141514",
                }}
              >
                Explore the product ↓
              </a>
            </div>

            {/* Small supporting statement */}
            <div
              style={{
                borderLeft: "2px solid #D9D2C5",
                paddingLeft: "1rem",
                fontSize: "0.84rem",
                lineHeight: "1.5",
                color: "#827F76",
                fontFamily: "var(--font-mono), monospace",
              }}
            >
              For people building a life. <br />
              For businesses building something real.
            </div>
          </div>

          {/* Right Hero Column: Premium Floating Financial Instrument Preview */}
          <div style={{ position: "relative", width: "100%", maxWidth: "780px", justifySelf: "center" }}>
            {/* Ambient Terracotta Tint Backdrop */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "120%",
                height: "120%",
                background: "radial-gradient(circle at 50% 50%, rgba(216, 84, 61, 0.08) 0%, rgba(20, 21, 20, 0.03) 50%, transparent 75%)",
                filter: "blur(50px)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />

            {/* Subtle Concentric Rings */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "120%",
                height: "120%",
                pointerEvents: "none",
                zIndex: 0,
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 600 600" fill="none">
                <circle cx="300" cy="300" r="260" stroke="#E5E0D5" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
                <circle cx="300" cy="300" r="190" stroke="#D8543D" strokeWidth="1" opacity="0.2" />
              </svg>
            </div>

            {/* Interactive Hero Dashboard (Subtly Tilted with Gentle Floating Animation) */}
            <div className="hero-dashboard-tilted">
              <InteractiveHeroDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────
          3. LIVE FINANCIAL TELEMETRY TICKER (Marquee with Dhaka Time & Macro Rates)
      ──────────────────────────────────────────────────────────────────────── */}
      <FinancialTelemetryTicker />

      {/* ────────────────────────────────────────────────────────────────────────
          4. INTRODUCTORY STATEMENT
      ──────────────────────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "clamp(1.75rem, 3vw, 2.5rem) 2rem",
          maxWidth: "1360px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 480px), 1fr))",
            gap: "2.25rem",
            alignItems: "center",
          }}
        >
          <div>
            <span
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "0.8rem",
                letterSpacing: "0.08em",
                color: "#827F76",
                display: "block",
                marginBottom: "0.75rem",
              }}
            >
              01 / The point of it all
            </span>
            <h2
              style={{
                fontFamily: "var(--font-serif), serif",
                fontSize: "clamp(2.4rem, 4.5vw, 3.5rem)",
                lineHeight: "1.12",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#171817",
                marginBottom: "1rem",
              }}
            >
              Financial clarity <br />
              <em style={{ fontStyle: "italic", fontWeight: 400, color: "#D8543D" }}>without the noise.</em>
            </h2>

            <p style={{ fontSize: "1.12rem", lineHeight: "1.65", color: "#363532", marginBottom: "1rem" }}>
              Money gets complicated fast. Ledger gives it somewhere exact to go — from the receipt in your pocket to the
              balance sheet your business depends on.
            </p>
            <p style={{ fontSize: "1.02rem", lineHeight: "1.65", color: "#827F76", marginBottom: "1.25rem" }}>
              One thoughtful system. Two editions. A clear line from today’s transaction to tomorrow’s decision.
            </p>
            <a
              href="#editions"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                color: "#D8543D",
                fontWeight: 600,
                fontSize: "0.95rem",
                textDecoration: "none",
                borderBottom: "1px solid #D8543D",
                paddingBottom: "2px",
              }}
            >
              Explore the engine ↘
            </a>
          </div>

          {/* Right side div: High-contrast Financial Visualization */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <FinancialClarityVisualizer />
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────
          5. CORE ENTERPRISE WORKFLOWS BENTO GRID
      ──────────────────────────────────────────────────────────────────────── */}
      <span id="editions" style={{ display: "none" }} />
      <CoreWorkflowBento />

      {/* ────────────────────────────────────────────────────────────────────────
          06. BUSINESS BANNER / CTA
      ──────────────────────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: "#0d0f0d",
          padding: "clamp(2rem, 3.5vw, 2.75rem) 2rem",
          borderTop: "1px solid #232623",
          borderBottom: "1px solid #232623",
        }}
      >
        <div
          style={{
            maxWidth: "1360px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "2rem",
            alignItems: "center",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-serif), serif",
                fontSize: "clamp(2.4rem, 4.5vw, 3.4rem)",
                lineHeight: "1.12",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#FFFDF7",
                marginBottom: "1rem",
              }}
            >
              Your business deserves a <br />
              <em style={{ fontStyle: "italic", fontWeight: 400, color: "#D8543D" }}>real</em> financial system.
            </h2>
            <p style={{ fontSize: "1.08rem", lineHeight: "1.65", color: "#ACA4BD", marginBottom: "1.25rem" }}>
              Ledger is the accounting backbone for Bangladesh SMEs — rigorous enough for the books, calm enough for the
              people running the business.
            </p>

            {/* Feature Chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", marginBottom: "1.5rem" }}>
              {[
                "VAT & withholding",
                "Inventory & costing",
                "AR / AP",
                "Payroll & loans",
                "Bank reconciliation",
                "Fixed assets",
              ].map((chip) => (
                <span
                  key={chip}
                  className="business-feature-chip"
                  style={{
                    backgroundColor: "#171917",
                    border: "1px solid #333633",
                    padding: "0.45rem 0.9rem",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                    color: "#d4cebe",
                    fontFamily: "var(--font-mono), monospace",
                    cursor: "default",
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>

            <a
              href="#walkthrough"
              className="hero-primary-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                backgroundColor: "#D8543D",
                color: "#FFFDF7",
                padding: "0.85rem 1.6rem",
                borderRadius: "8px",
                fontSize: "0.95rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Talk to our team ↗
            </a>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────
          6.5 BUSINESS ROI & TIME-SAVINGS CALCULATOR
      ──────────────────────────────────────────────────────────────────────── */}
      <BusinessRoiCalculator />

      {/* ────────────────────────────────────────────────────────────────────────
          7. LEDGER PRINCIPLES (The Standard)
      ──────────────────────────────────────────────────────────────────────── */}
      <section
        id="principles"
        style={{
          padding: "clamp(2rem, 3.5vw, 2.75rem) 2rem",
          maxWidth: "1360px",
          margin: "0 auto",
        }}
      >
        <div style={{ maxWidth: "720px", marginBottom: "1.75rem" }}>
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "0.8rem",
              letterSpacing: "0.08em",
              color: "#827F76",
              display: "block",
              marginBottom: "0.75rem",
            }}
          >
            04 / The Ledger standard
          </span>
          <h2
            style={{
              fontFamily: "var(--font-serif), serif",
              fontSize: "clamp(2.4rem, 4.5vw, 3.4rem)",
              lineHeight: "1.15",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#171817",
              marginBottom: "1rem",
            }}
          >
            Quietly rigorous. <br />
            <em style={{ fontStyle: "italic", fontWeight: 400, color: "#D8543D" }}>Deliberately useful.</em>
          </h2>
          <p style={{ fontSize: "1.1rem", lineHeight: "1.65", color: "#54524c" }}>
            The best financial tools don’t perform certainty. They earn it, one accurate entry at a time.
          </p>
        </div>

        {/* Architectural Bento Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {/* Bento Card 1: Deterministic Paisa Math Engine */}
          <div
            style={{
              backgroundColor: "#FFFDF7",
              border: "1px solid #D9D2C5",
              borderRadius: "16px",
              padding: "2.25rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: "0.72rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#D8543D",
                    backgroundColor: "rgba(216, 84, 61, 0.08)",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "6px",
                    fontWeight: 700,
                  }}
                >
                  ENGINE INVARIANT · ZERO DRIFT
                </span>
                <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "1.4rem", color: "#D8543D", fontWeight: 700 }}>
                  ∑
                </span>
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.75rem", color: "#171817" }}>
                Zero-Float Paisa Arithmetic
              </h3>
              <p style={{ fontSize: "0.93rem", lineHeight: "1.65", color: "#66635c", marginBottom: "1.5rem" }}>
                Every monetary value is stored strictly as integer paisa (1 BDT = 100 Paisa). IEEE-754 floating-point inaccuracies (like 0.1 + 0.2 ≠ 0.3) are mathematically impossible in Ledger.
              </p>

              {/* Code / Visual Box */}
              <div
                style={{
                  backgroundColor: "#171817",
                  color: "#FFFDF7",
                  borderRadius: "10px",
                  padding: "1rem 1.15rem",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: "0.8rem",
                  lineHeight: "1.6",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", color: "#827F76", borderBottom: "1px solid #282a29", paddingBottom: "0.4rem", marginBottom: "0.5rem" }}>
                  <span>PAISA ATOM</span>
                  <span style={{ color: "#D8543D" }}>ASSERTION PASS</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#E6DFD1" }}>1,48,500 Paisa</span>
                  <span style={{ color: "#FFFDF7", fontWeight: 700 }}>= ৳ 1,485.00</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
                  <span style={{ color: "#827F76" }}>Banker&apos;s Rounding:</span>
                  <span style={{ color: "#FFFDF7" }}>Half to Even</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "1.75rem", paddingTop: "1rem", borderTop: "1px solid #EFEAE1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono), monospace", color: "#827F76" }}>
                IEEE-754 Invariant
              </span>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#171817" }}>
                Exact to the Paisa →
              </span>
            </div>
          </div>

          {/* Bento Card 2: Append-Only Immutable Trail */}
          <div
            style={{
              backgroundColor: "#FFFDF7",
              border: "1px solid #D9D2C5",
              borderRadius: "16px",
              padding: "2.25rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: "0.72rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#141514",
                    backgroundColor: "#EDE7DC",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "6px",
                    fontWeight: 700,
                  }}
                >
                  AUDIT STANDARD · APPEND ONLY
                </span>
                <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "1.4rem", color: "#141514", fontWeight: 700 }}>
                  ⌁
                </span>
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.75rem", color: "#171817" }}>
                A Trail, Never a Mystery
              </h3>
              <p style={{ fontSize: "0.93rem", lineHeight: "1.65", color: "#66635c", marginBottom: "1.5rem" }}>
                No DELETE or silent UPDATE SQL commands ever touch posted books. Adjustments require explicitly signed reversing vouchers with immutable line-level snapshots.
              </p>

              {/* Code / Visual Box */}
              <div
                style={{
                  backgroundColor: "#171817",
                  color: "#FFFDF7",
                  borderRadius: "10px",
                  padding: "1rem 1.15rem",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: "0.8rem",
                  lineHeight: "1.6",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", color: "#827F76", borderBottom: "1px solid #282a29", paddingBottom: "0.4rem", marginBottom: "0.5rem" }}>
                  <span>LINEAGE CHAIN</span>
                  <span style={{ color: "#D8543D" }}>VERIFIED HASH</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#E6DFD1" }}>JV-000184 (Original)</span>
                  <span style={{ color: "#827F76" }}>POSTED</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
                  <span style={{ color: "#D8543D" }}>REV-000184 (Contra)</span>
                  <span style={{ color: "#D8543D" }}>NET ZERO</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "1.75rem", paddingTop: "1rem", borderTop: "1px solid #EFEAE1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono), monospace", color: "#827F76" }}>
                Cryptographic Integrity
              </span>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#171817" }}>
                Audit Logged →
              </span>
            </div>
          </div>

          {/* Bento Card 3: NBR Statutory VAT 9.1 & Mushak 6.3 */}
          <div
            style={{
              backgroundColor: "#FFFDF7",
              border: "1px solid #D9D2C5",
              borderRadius: "16px",
              padding: "2.25rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: "0.72rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#141514",
                    backgroundColor: "#EDE7DC",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "6px",
                    fontWeight: 700,
                  }}
                >
                  BANGLADESH STATUTORY · NBR READY
                </span>
                <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "1.4rem", color: "#141514", fontWeight: 700 }}>
                  ৳
                </span>
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.75rem", color: "#171817" }}>
                Mushak 6.3 &amp; VAT 9.1 Native
              </h3>
              <p style={{ fontSize: "0.93rem", lineHeight: "1.65", color: "#66635c", marginBottom: "1.5rem" }}>
                Generates authentic Mushak 6.3 tax challans at invoicing. Automated 15% standard rate calculation, input tax rebate tracking, and one-click Mushak 9.1 monthly export.
              </p>

              {/* Code / Visual Box */}
              <div
                style={{
                  backgroundColor: "#171817",
                  color: "#FFFDF7",
                  borderRadius: "10px",
                  padding: "1rem 1.15rem",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: "0.8rem",
                  lineHeight: "1.6",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", color: "#827F76", borderBottom: "1px solid #282a29", paddingBottom: "0.4rem", marginBottom: "0.5rem" }}>
                  <span>NBR COMPLIANCE</span>
                  <span style={{ color: "#D8543D" }}>AUTO SPLIT</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#E6DFD1" }}>Subtotal Taxable</span>
                  <span style={{ color: "#FFFDF7" }}>৳ 1,00,000.00</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
                  <span style={{ color: "#827F76" }}>15% Output VAT</span>
                  <span style={{ color: "#D8543D", fontWeight: 700 }}>+ ৳ 15,000.00</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "1.75rem", paddingTop: "1rem", borderTop: "1px solid #EFEAE1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono), monospace", color: "#827F76" }}>
                NBR Mushak 9.1 Export
              </span>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#171817" }}>
                Tax Compliant →
              </span>
            </div>
          </div>

          {/* Bento Card 4: Continuous 5-Step Month-End Close */}
          <div
            style={{
              backgroundColor: "#FFFDF7",
              border: "1px solid #D9D2C5",
              borderRadius: "16px",
              padding: "2.25rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: "0.72rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#171817",
                    backgroundColor: "#EDE7DC",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "6px",
                    fontWeight: 700,
                  }}
                >
                  WORKFLOW · 5-STEP CLOSE
                </span>
                <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "1.4rem", color: "#171817", fontWeight: 700 }}>
                  ◴
                </span>
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.75rem", color: "#171817" }}>
                Built for the Next Close
              </h3>
              <p style={{ fontSize: "0.93rem", lineHeight: "1.65", color: "#66635c", marginBottom: "1.5rem" }}>
                From automated two-way bank reconciliation to depreciation runs and zero-differential trial balance verification, closing the month is a calm checkpoint, not a crisis.
              </p>

              {/* Code / Visual Box */}
              <div
                style={{
                  backgroundColor: "#171817",
                  color: "#FFFDF7",
                  borderRadius: "10px",
                  padding: "1rem 1.15rem",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: "0.8rem",
                  lineHeight: "1.6",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", color: "#827F76", borderBottom: "1px solid #282a29", paddingBottom: "0.4rem", marginBottom: "0.5rem" }}>
                  <span>MONTH-END WIZARD</span>
                  <span style={{ color: "#8FA892" }}>5 OF 5 PASSED</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#E6DFD1" }}>Bank Reconciled</span>
                  <span style={{ color: "#8FA892" }}>100% MATCH</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
                  <span style={{ color: "#827F76" }}>Trial Balance Diff</span>
                  <span style={{ color: "#FFFDF7", fontWeight: 700 }}>৳ 0.00</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "1.75rem", paddingTop: "1rem", borderTop: "1px solid #EFEAE1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono), monospace", color: "#827F76" }}>
                Period Lock Guard
              </span>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#171817" }}>
                Explore Wizard →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────
          7.5 INTERACTIVE PROTOCOLS: TACTILE VOUCHERS & OCR SCANNER
      ──────────────────────────────────────────────────────────────────────── */}
      <section
        id="interactive-experience"
        style={{
          padding: "clamp(2rem, 3.5vw, 2.75rem) 2rem",
          maxWidth: "1360px",
          margin: "0 auto",
        }}
      >
        <div style={{ maxWidth: "760px", marginBottom: "1.75rem" }}>
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "0.8rem",
              letterSpacing: "0.08em",
              color: "#D8543D",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "0.75rem",
              fontWeight: 600,
            }}
          >
            05 / Interactive Accounting Touchpoints
          </span>
          <h2
            style={{
              fontFamily: "var(--font-serif), serif",
              fontSize: "clamp(2.4rem, 4.5vw, 3.4rem)",
              lineHeight: "1.15",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#171817",
              marginBottom: "1rem",
            }}
          >
            Tactile instruments. <br />
            <em style={{ fontStyle: "italic", fontWeight: 400, color: "#D8543D" }}>From physical till to general ledger.</em>
          </h2>
          <p style={{ fontSize: "1.08rem", lineHeight: "1.65", color: "#54524c" }}>
            Experience how real vouchers are stacked and verified, and how thermal vendor receipts are parsed directly into double-entry journal postings with statutory Mushak 6.3 VAT splits.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "2rem",
            alignItems: "start",
          }}
        >
          {/* Column 1: Journal Voucher Stack */}
          <div>
            <div style={{ marginBottom: "1rem" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: "0.75rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#827F76",
                }}
              >
                TACTILE AUDIT TRAIL
              </span>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginTop: "0.25rem", color: "#141514" }}>
                3D Journal Voucher Ledger
              </h3>
              <p style={{ fontSize: "0.9rem", color: "#66635c", marginTop: "0.25rem" }}>
                Flip through posted general vouchers with balanced debits and credits.
              </p>
            </div>
            <JournalVoucherStack />
          </div>

          {/* Column 2: Interactive Thermal Receipt Scanner */}
          <div>
            <div style={{ marginBottom: "1rem" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: "0.75rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#D8543D",
                  fontWeight: 600,
                }}
              >
                VISION OCR ENGINE · NBR MUSHAK 6.3
              </span>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginTop: "0.25rem", color: "#141514" }}>
                Thermal Receipt Scanner
              </h3>
              <p style={{ fontSize: "0.9rem", color: "#66635c", marginTop: "0.25rem" }}>
                Switch merchants to simulate optical character parsing and instant ledger posting.
              </p>
            </div>
            <InteractiveReceiptScanner />
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────
          7.6 ARCHITECTURAL HORIZONTAL SCROLL CAROUSEL
      ──────────────────────────────────────────────────────────────────────── */}
      <StackScrollSection />

      {/* ────────────────────────────────────────────────────────────────────────
          8. PROOF / PHILOSOPHY SECTION
      ──────────────────────────────────────────────────────────────────────── */}
      <section
        style={{
          borderTop: "1px solid #D9D2C5",
          borderBottom: "1px solid #D9D2C5",
          padding: "clamp(2rem, 3.5vw, 2.75rem) 2rem",
          backgroundColor: "#FAF7F0",
        }}
      >
        <div style={{ maxWidth: "1080px", margin: "0 auto", textAlign: "center" }}>
          <blockquote
            style={{
              fontFamily: "var(--font-serif), serif",
              fontSize: "clamp(1.75rem, 3.2vw, 2.6rem)",
              lineHeight: "1.3",
              fontWeight: 400,
              fontStyle: "italic",
              color: "#171817",
              margin: "0 0 1.25rem 0",
            }}
          >
            “Ledger doesn’t just tell you where the money went. It helps you decide where it can go next.”
          </blockquote>
          <cite
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "0.85rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#827F76",
              fontStyle: "normal",
              display: "block",
              marginBottom: "1.75rem",
            }}
          >
            — The Ledger principle
          </cite>

          {/* 3 Proof Metrics with Viewport Count Animation */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "2rem",
              paddingTop: "2rem",
              borderTop: "1px solid #E6DFD1",
            }}
          >
            <div>
              <div style={{ fontSize: "3.25rem", fontWeight: 700, fontFamily: "var(--font-mono), monospace", color: "#D8543D", lineHeight: 1.1, marginBottom: "0.6rem" }}>
                <CountUpNumber target={14} color="#D8543D" />
              </div>
              <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#171817", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.25rem" }}>
                accounting phases shipped
              </span>
              <span style={{ fontSize: "0.78rem", color: "#827F76", fontFamily: "var(--font-mono), monospace" }}>
                Phases P0 through P13 Shipped
              </span>
            </div>
            <div>
              <div style={{ fontSize: "3.25rem", fontWeight: 700, fontFamily: "var(--font-mono), monospace", color: "#C99B52", lineHeight: 1.1, marginBottom: "0.6rem" }}>
                <CountUpNumber target={20} color="#C99B52" />
              </div>
              <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#171817", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.25rem" }}>
                standard financial reports
              </span>
              <span style={{ fontSize: "0.78rem", color: "#827F76", fontFamily: "var(--font-mono), monospace" }}>
                Audit &amp; NBR Tax Verified
              </span>
            </div>
            <div>
              <div style={{ fontSize: "3.25rem", fontWeight: 700, fontFamily: "var(--font-mono), monospace", color: "#8FA892", lineHeight: 1.1, marginBottom: "0.6rem" }}>
                <CountUpNumber target={0} color="#8FA892" isZeroInvariant />
              </div>
              <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#171817", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.25rem" }}>
                hard deletes in the ledger
              </span>
              <span style={{ fontSize: "0.78rem", color: "#827F76", fontFamily: "var(--font-mono), monospace" }}>
                100% Append-Only Immutability
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────
          8.5 TRANSPARENT SAAS PRICING TIERS
      ──────────────────────────────────────────────────────────────────────── */}
      <PricingSection />

      {/* ────────────────────────────────────────────────────────────────────────
          8.6 SOCIAL PROOF, STATS & EXECUTIVE TESTIMONIALS
      ──────────────────────────────────────────────────────────────────────── */}
      <SocialProofTestimonials />

      {/* ────────────────────────────────────────────────────────────────────────
          9. ROADMAP SECTION
      ──────────────────────────────────────────────────────────────────────── */}
      <section
        id="roadmap"
        style={{
          padding: "clamp(2rem, 3.5vw, 2.75rem) 2rem",
          maxWidth: "1360px",
          margin: "0 auto",
        }}
      >
        <div style={{ maxWidth: "620px", marginBottom: "1.75rem" }}>
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "0.8rem",
              letterSpacing: "0.08em",
              color: "#827F76",
              display: "block",
              marginBottom: "0.75rem",
            }}
          >
            05 / The road ahead
          </span>
          <h2
            style={{
              fontFamily: "var(--font-serif), serif",
              fontSize: "clamp(2.4rem, 4.5vw, 3.4rem)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#171817",
              marginBottom: "1rem",
            }}
          >
            Already useful. <br />
            <em style={{ fontStyle: "italic", fontWeight: 400, color: "#C99B52" }}>Still getting better.</em>
          </h2>
          <p style={{ fontSize: "1.08rem", lineHeight: "1.65", color: "#54524c" }}>
            Ledger is built in public, with the fundamentals in place and the next layer clearly in sight.
          </p>
        </div>

        {/* 3 Horizontal Roadmap Columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {/* Card 1: Available Now */}
          <div
            style={{
              backgroundColor: "#FFFDF7",
              border: "1px solid #D9D2C5",
              borderRadius: "14px",
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono), monospace",
                  color: "#8FA892",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  display: "block",
                  marginBottom: "0.75rem",
                }}
              >
                ● Available now
              </span>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                Foundation
              </h3>
              <p style={{ fontSize: "0.92rem", lineHeight: "1.65", color: "#66635c" }}>
                Personal finance, double-entry accounting, tax, inventory, fixed assets, banking, payroll and more.
              </p>
            </div>
            <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono), monospace", color: "#827F76", marginTop: "1.5rem" }}>
              Phases P0 — P11
            </span>
          </div>

          {/* Card 2: In the works */}
          <div
            style={{
              backgroundColor: "#FFFDF7",
              border: "1px solid #D9D2C5",
              borderRadius: "14px",
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono), monospace",
                  color: "#C99B52",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  display: "block",
                  marginBottom: "0.75rem",
                }}
              >
                ● In the works
              </span>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                More context
              </h3>
              <p style={{ fontSize: "0.92rem", lineHeight: "1.65", color: "#66635c" }}>
                Recurring entries, budgets, segments and business insights that connect the numbers to the bigger picture.
              </p>
            </div>
            <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono), monospace", color: "#827F76", marginTop: "1.5rem" }}>
              Phases P12 — P13
            </span>
          </div>

          {/* Card 3: On the horizon */}
          <div
            style={{
              backgroundColor: "#FFFDF7",
              border: "1px solid #D9D2C5",
              borderRadius: "14px",
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono), monospace",
                  color: "#827F76",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  display: "block",
                  marginBottom: "0.75rem",
                }}
              >
                ○ On the horizon
              </span>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                More momentum
              </h3>
              <p style={{ fontSize: "0.92rem", lineHeight: "1.65", color: "#66635c" }}>
                A more guided month-end, printable documents, and a calmer path from close to confidence.
              </p>
            </div>
            <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono), monospace", color: "#827F76", marginTop: "1.5rem" }}>
              Built step by step
            </span>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────
          9.5 COMMERCIAL FAQ SECTION
      ──────────────────────────────────────────────────────────────────────── */}
      <LandingFaqSection />

      {/* ────────────────────────────────────────────────────────────────────────
          10. PREMIUM CTA SECTION
      ──────────────────────────────────────────────────────────────────────── */}
      <section
        id="walkthrough"
        style={{
          backgroundColor: "#D8543D",
          color: "#FFFDF7",
          padding: "clamp(2.25rem, 3.5vw, 3rem) 2rem",
        }}
      >
        <div
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "2.25rem",
            alignItems: "center",
          }}
        >
          {/* Left Text */}
          <div>
            <span
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "0.8rem",
                letterSpacing: "0.08em",
                color: "#ffc9c0",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "0.75rem",
              }}
            >
              Start with a clearer picture
            </span>
            <h2
              style={{
                fontFamily: "var(--font-serif), serif",
                fontSize: "clamp(2.5rem, 4.5vw, 3.8rem)",
                lineHeight: "1.12",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                margin: "0 0 1rem 0",
              }}
            >
              Make your next <br />
              <em style={{ fontStyle: "italic", fontWeight: 400 }}>decision count.</em>
            </h2>
            <p style={{ fontSize: "1.15rem", lineHeight: "1.65", color: "#fbe4e0", maxWidth: "480px" }}>
              Tell us what you’re building. We’ll show you where Ledger fits.
            </p>
          </div>

          {/* Right Form Card */}
          <div
            style={{
              backgroundColor: "#FFFDF7",
              color: "#171817",
              borderRadius: "16px",
              padding: "1.75rem",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.25)",
            }}
          >
            {formSubmitted ? (
              <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "#8FA892",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1.25rem auto",
                  }}
                >
                  <CheckCircle2 size={26} />
                </div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  Request Received
                </h3>
                <p style={{ fontSize: "0.95rem", color: "#66635c", lineHeight: "1.5" }}>
                  Thanks — we’ll reach out to your email (<strong>{formEmail}</strong>).
                </p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#54524c",
                      display: "block",
                      marginBottom: "0.4rem",
                    }}
                  >
                    Work or personal email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem 0.9rem",
                      borderRadius: "8px",
                      border: "1px solid #D9D2C5",
                      fontSize: "0.92rem",
                      backgroundColor: "#FFF",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#54524c",
                      display: "block",
                      marginBottom: "0.4rem",
                    }}
                  >
                    I’m exploring Ledger for
                  </label>
                  <select
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem 0.9rem",
                      borderRadius: "8px",
                      border: "1px solid #D9D2C5",
                      fontSize: "0.92rem",
                      backgroundColor: "#FFF",
                    }}
                  >
                    <option value="Personal">My personal finances</option>
                    <option value="Business">My business</option>
                    <option value="Both">Both</option>
                  </select>
                </div>

                <button
                  type="submit"
                  style={{
                    backgroundColor: "#171817",
                    color: "#FFFDF7",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.85rem",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    marginTop: "0.5rem",
                    transition: "transform 0.15s ease",
                  }}
                >
                  Request a walkthrough ↗
                </button>

                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#827F76",
                    textAlign: "center",
                    margin: "0.25rem 0 0 0",
                    fontFamily: "var(--font-mono), monospace",
                  }}
                >
                  No pressure. Just a useful conversation.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────
          11. FOOTER
      ──────────────────────────────────────────────────────────────────────── */}
      <footer
        style={{
          backgroundColor: "#171817",
          color: "#827F76",
          padding: "3rem 2rem 2rem 2rem",
          borderTop: "1px solid #2a2c2a",
        }}
      >
        <div
          style={{
            maxWidth: "1360px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "2.25rem",
              marginBottom: "2rem",
            }}
          >
            {/* Left Brand Col */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "7px",
                    backgroundColor: "#D8543D",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M6 4V19H18" stroke="#F6F2E9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="17.5" cy="11.5" r="2" fill="#F6F2E9" />
                  </svg>
                </div>
                <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#FFFDF7", letterSpacing: "-0.04em" }}>
                  ledger
                </span>
              </div>
              <p style={{ fontSize: "0.88rem", lineHeight: "1.6", color: "#ACA4BD", maxWidth: "280px" }}>
                Financial clarity for every taka. <br />
                Made for the people and businesses moving Bangladesh forward.
              </p>
            </div>

            {/* Links Columns */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.88rem" }}>
              <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono), monospace", color: "#D8543D", textTransform: "uppercase" }}>
                Product
              </span>
              <a href="#product" style={{ color: "#d1c9bd", textDecoration: "none" }}>
                Overview
              </a>
              <Link href="/accounts" style={{ color: "#d1c9bd", textDecoration: "none" }}>
                Chart of Accounts
              </Link>
              <Link href="/reports" style={{ color: "#d1c9bd", textDecoration: "none" }}>
                Financial Statements
              </Link>
              <Link href="/tax" style={{ color: "#d1c9bd", textDecoration: "none" }}>
                NBR VAT 9.1
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.88rem" }}>
              <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono), monospace", color: "#D8543D", textTransform: "uppercase" }}>
                Solutions
              </span>
              <a href="#workflows" style={{ color: "#d1c9bd", textDecoration: "none" }}>
                Enterprise Workflows
              </a>
              <a href="#pricing" style={{ color: "#d1c9bd", textDecoration: "none" }}>
                Transparent Pricing
              </a>
              <a href="#roi-calculator" style={{ color: "#d1c9bd", textDecoration: "none" }}>
                ROI Calculator
              </a>
              <a href="#faq" style={{ color: "#d1c9bd", textDecoration: "none" }}>
                Commercial FAQ
              </a>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.88rem" }}>
              <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono), monospace", color: "#D8543D", textTransform: "uppercase" }}>
                Platform
              </span>
              <Link href="/login" style={{ color: "#d1c9bd", textDecoration: "none" }}>
                Sign In ↗
              </Link>
              <a href="#roadmap" style={{ color: "#d1c9bd", textDecoration: "none" }}>
                Roadmap
              </a>
              <a href="#walkthrough" style={{ color: "#d1c9bd", textDecoration: "none" }}>
                Contact Team
              </a>
            </div>
          </div>

          {/* Bottom Copyright Row */}
          <div
            style={{
              paddingTop: "2rem",
              borderTop: "1px solid #232523",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              fontSize: "0.8rem",
              fontFamily: "var(--font-mono), monospace",
            }}
          >
            <div>© 2026 Ledger. All rights reserved.</div>
            <div style={{ color: "#D8543D" }}>Built with care in Bangladesh</div>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <Link href="/privacy" style={{ color: "inherit", textDecoration: "none" }}>Privacy</Link>
              <span>·</span>
              <Link href="/terms" style={{ color: "inherit", textDecoration: "none" }}>Terms</Link>
              <span>·</span>
              <Link href="/about" style={{ color: "inherit", textDecoration: "none" }}>Security</Link>
            </div>
          </div>

          {/* Monumental LEDGER Typographic Landmark */}
          <div
            style={{
              marginTop: "2rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid #1c1d1c",
              overflow: "hidden",
              textAlign: "center",
              userSelect: "none",
            }}
          >
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-serif), serif",
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
      </footer>


    </div>
  );
}
