"use client";

import React, { useState, useMemo } from "react";
import { Clock, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export function BusinessRoiCalculator() {
  const [invoicesCount, setInvoicesCount] = useState<number>(80);
  const [bankChannels, setBankChannels] = useState<number>(3);
  const [teamMembers, setTeamMembers] = useState<number>(8);

  const calculations = useMemo(() => {
    // Hours saved: ~15 mins per invoice/bill reconciliation manual work, plus 1.5 hrs per bank statement, plus 2 hrs per staff payroll
    const reconciliationHours = Math.round((invoicesCount * 0.22) + (bankChannels * 2.5) + (teamMembers * 0.75));
    // Labor cost saved: estimated standard bookkeeping rate of ~৳900/hr in Dhaka
    const moneySavedBdt = Math.round(reconciliationHours * 900);
    // Annual savings
    const annualSavingsBdt = moneySavedBdt * 12;
    const complianceScore = 100;

    return {
      hoursSaved: reconciliationHours,
      moneySavedBdt,
      annualSavingsBdt,
      complianceScore,
    };
  }, [invoicesCount, bankChannels, teamMembers]);

  return (
    <section id="roi-calculator" style={{ padding: "clamp(4rem, 7vw, 6.5rem) 2rem", maxWidth: "1440px", margin: "0 auto" }}>
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #D8D2C5",
          borderRadius: "16px",
          padding: "clamp(2rem, 5vw, 4rem)",
          boxShadow: "0 2px 12px rgba(20, 21, 20, 0.03)",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))", gap: "3.5rem", alignItems: "center" }}>
          {/* Left Column: Sliders */}
          <div>
            <div className="tag-chip" style={{ marginBottom: "1rem" }}>
              <span className="tag-chip-check">✓</span>
              <span>Interactive Efficiency Engine</span>
            </div>

            <h2
              style={{
                fontFamily: "var(--font-serif), serif",
                fontSize: "clamp(2.2rem, 4vw, 3rem)",
                lineHeight: 1.15,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "#171817",
                marginBottom: "1.25rem",
              }}
            >
              Calculate your team’s <br />
              <em style={{ fontStyle: "italic", fontWeight: 400, color: "#D8543D" }}>monthly time &amp; cost return.</em>
            </h2>

            <p style={{ fontSize: "1rem", lineHeight: 1.6, color: "#54524c", marginBottom: "2.5rem" }}>
              See how replacing manual spreadsheet reconciliation, paper bill entry, and tax calculations with Ledger transforms your operating bottom line.
            </p>

            {/* Slider 1: Invoices & Bills */}
            <div style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <label style={{ fontSize: "0.92rem", fontWeight: 600, color: "#171817" }}>
                  Monthly B2B Invoices &amp; Bills
                </label>
                <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "1.1rem", fontWeight: 700, color: "#D8543D" }}>
                  {invoicesCount} docs
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="5"
                value={invoicesCount}
                onChange={(e) => setInvoicesCount(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#D8543D", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#8A8780", fontFamily: "var(--font-mono), monospace", marginTop: "0.25rem" }}>
                <span>10 (Freelance)</span>
                <span>250</span>
                <span>500+ (Enterprise)</span>
              </div>
            </div>

            {/* Slider 2: Bank & Settlement Channels */}
            <div style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <label style={{ fontSize: "0.92rem", fontWeight: 600, color: "#171817" }}>
                  Active Bank Accounts &amp; MFS Channels
                </label>
                <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "1.1rem", fontWeight: 700, color: "#141514" }}>
                  {bankChannels} accounts
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={bankChannels}
                onChange={(e) => setBankChannels(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#141514", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#8A8780", fontFamily: "var(--font-mono), monospace", marginTop: "0.25rem" }}>
                <span>1 channel</span>
                <span>5 channels</span>
                <span>10 channels</span>
              </div>
            </div>

            {/* Slider 3: Staff & Team Size */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <label style={{ fontSize: "0.92rem", fontWeight: 600, color: "#171817" }}>
                  Staff on Payroll &amp; Advances
                </label>
                <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "1.1rem", fontWeight: 700, color: "#141514" }}>
                  {teamMembers} staff
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                step="1"
                value={teamMembers}
                onChange={(e) => setTeamMembers(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#141514", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#8A8780", fontFamily: "var(--font-mono), monospace", marginTop: "0.25rem" }}>
                <span>1 employee</span>
                <span>30 employees</span>
                <span>60+ employees</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Output Card */}
          <div
            style={{
              backgroundColor: "#141514",
              color: "#FFFDF7",
              borderRadius: "12px",
              padding: "clamp(1.75rem, 4vw, 2.75rem)",
              boxShadow: "0 12px 30px rgba(20, 21, 20, 0.12)",
              display: "flex",
              flexDirection: "column",
              gap: "2rem",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontFamily: "var(--font-mono), monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#D8543D",
                  backgroundColor: "rgba(216, 84, 61, 0.12)",
                  padding: "0.25rem 0.65rem",
                  borderRadius: "4px",
                  display: "inline-block",
                  marginBottom: "0.75rem",
                  fontWeight: 700,
                }}
              >
                Projected Monthly Operating ROI
              </span>
              <div style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: 800, fontFamily: "var(--font-serif), serif", lineHeight: 1.1, color: "#FFFDF7" }}>
                ৳{calculations.moneySavedBdt.toLocaleString()}
                <span style={{ fontSize: "1rem", fontFamily: "var(--font-sans), sans-serif", color: "#8A8780", fontWeight: 400, marginLeft: "0.35rem" }}>
                  / month saved
                </span>
              </div>
              <div style={{ fontSize: "0.85rem", color: "#D8543D", fontFamily: "var(--font-mono), monospace", marginTop: "0.5rem" }}>
                ≈ ৳{calculations.annualSavingsBdt.toLocaleString()} annualized efficiency gain
              </div>
            </div>

            {/* Breakdown Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.5rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "#D8543D", marginBottom: "0.35rem" }}>
                  <Clock size={16} />
                  <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>Reconciliation Time</span>
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-mono), monospace", color: "#FFFDF7" }}>
                  {calculations.hoursSaved} hrs
                </div>
                <div style={{ fontSize: "0.72rem", color: "#8A8780" }}>freed for core business</div>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "#D8543D", marginBottom: "0.35rem" }}>
                  <ShieldCheck size={16} />
                  <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>NBR Tax Audit Risk</span>
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-mono), monospace", color: "#FFFDF7" }}>
                  0%
                </div>
                <div style={{ fontSize: "0.72rem", color: "#8A8780" }}>100% Mushak 9.1 precision</div>
              </div>
            </div>

            {/* Value Highlights */}
            <div style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "8px", padding: "1rem 1.25rem", fontSize: "0.82rem", lineHeight: 1.5, color: "#D9D2C5" }}>
              <strong>Instant Payback:</strong> With standard plans starting at just ৳2,999/mo, Ledger pays for itself within the first <strong>3 days</strong> of monthly operations.
            </div>

            <Link
              href="/login?redirect=/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.85rem 1.4rem",
                borderRadius: "8px",
                backgroundColor: "#D8543D",
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: "0.95rem",
                textDecoration: "none",
                textAlign: "center",
                transition: "opacity 0.15s ease",
              }}
            >
              <span>Unlock These Savings in Live Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
