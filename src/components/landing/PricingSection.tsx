"use client";

import React, { useState } from "react";
import { Check, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: "Starter & Personal",
      desc: "For solopreneurs, consultants, and individuals demanding mathematical certainty for personal finances.",
      monthlyPrice: 0,
      annualPrice: 0,
      badge: null,
      highlight: false,
      ctaLabel: "Start Free Forever",
      ctaHref: "/login",
      features: [
        "1 User Account",
        "Personal Cashflow & Expense Tracking",
        "Single-Entry & Double-Entry Mirror",
        "Basic P&L and Trial Balance Views",
        "Cash Runway Forecasting",
        "Standard Community Support",
      ],
    },
    {
      name: "Growth & SME",
      desc: "For fast-growing companies and trading businesses needing unified invoicing, multi-bank treasury, and NBR VAT compliance.",
      monthlyPrice: 2999,
      annualPrice: 2399,
      badge: "MOST POPULAR",
      highlight: true,
      ctaLabel: "Launch Commercial Suite",
      ctaHref: "/login",
      features: [
        "Up to 10 Team Members with RBAC",
        "Unlimited B2B Invoicing & Customer Receivables",
        "Vendor Bills, AP Aging & Withholding Certificates",
        "Multi-Bank Treasury (BRAC, DBBL, bKash)",
        "Perpetual Inventory Tracking (2 Warehouses)",
        "Staff Directory & Monthly Payroll Runs",
        "Full NBR Mushak 9.1 VAT Return Generation",
        "20 Standard Financial & Audit Reports",
        "Priority Support & Data Migration Assistance",
      ],
    },
    {
      name: "Enterprise Group",
      desc: "For multi-entity holding groups, manufacturing plants, and high-volume operations requiring customized architecture.",
      monthlyPrice: 9999,
      annualPrice: 7999,
      badge: "SCALE & COMPLIANCE",
      highlight: false,
      ctaLabel: "Talk to Enterprise Sales",
      ctaHref: "#walkthrough",
      features: [
        "Unlimited Team Seats & Roles",
        "Multi-Branch & Multi-Entity Consolidation",
        "Unlimited Warehouses with Inter-Hub Transfers",
        "Fixed Asset Register with Automatic Depreciation",
        "Custom Chart of Accounts & Cost Centers",
        "Staff Welfare Loans & Salary Advance Engine",
        "Append-Only Immutable Audit Trail Registry",
        "Custom Webhooks & REST API Access",
        "99.99% Uptime SLA & Dedicated Account Manager",
      ],
    },
  ];

  return (
    <section id="pricing" style={{ padding: "clamp(4rem, 7vw, 6.5rem) 2rem", maxWidth: "1440px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 3rem" }}>
        <div className="tag-chip" style={{ marginBottom: "1rem" }}>
          <span className="tag-chip-check">✓</span>
          <span>Transparent Pricing</span>
        </div>

        <h2
          style={{
            fontFamily: "var(--font-serif), serif",
            fontSize: "clamp(2.4rem, 4.5vw, 3.4rem)",
            lineHeight: 1.15,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "#171817",
            marginBottom: "1.25rem",
          }}
        >
          Honest pricing for <br />
          <em style={{ fontStyle: "italic", fontWeight: 400, color: "#D8543D" }}>real engineering discipline.</em>
        </h2>

        <p style={{ fontSize: "1.05rem", lineHeight: 1.6, color: "#54524c", marginBottom: "2rem" }}>
          No hidden implementation fees. No surprise per-document surcharges. Scale your financial foundation with confidence.
        </p>

        {/* Monthly / Annual Toggle */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: "#F4EFE6",
            padding: "0.3rem 0.45rem",
            borderRadius: "8px",
            border: "1px solid #D8D2C5",
          }}
        >
          <button
            type="button"
            onClick={() => setAnnual(false)}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "6px",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor: !annual ? "#141514" : "transparent",
              color: !annual ? "#FFFDF7" : "#54524c",
              transition: "all 0.15s ease",
            }}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "6px",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor: annual ? "#141514" : "transparent",
              color: annual ? "#FFFDF7" : "#54524c",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              transition: "all 0.15s ease",
            }}
          >
            <span>Annual</span>
            <span
              style={{
                fontSize: "0.68rem",
                backgroundColor: "#D8543D",
                color: "#FFFDF7",
                padding: "0.15rem 0.45rem",
                borderRadius: "4px",
                fontFamily: "var(--font-mono), monospace",
                fontWeight: 700,
              }}
            >
              SAVE 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))",
          gap: "2rem",
          alignItems: "stretch",
        }}
      >
        {plans.map((plan, index) => {
          const price = annual ? plan.annualPrice : plan.monthlyPrice;
          return (
            <div
              key={index}
              style={{
                borderRadius: "12px",
                backgroundColor: plan.highlight ? "#141514" : "#FFFFFF",
                color: plan.highlight ? "#FFFDF7" : "#141514",
                border: plan.highlight ? "2px solid #141514" : "1px solid #D8D2C5",
                padding: "2.5rem 2rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "2rem",
                position: "relative",
                boxShadow: plan.highlight
                  ? "0 12px 30px rgba(20, 21, 20, 0.12)"
                  : "0 2px 8px rgba(20, 21, 20, 0.03)",
                transform: plan.highlight ? "scale(1.02)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              {plan.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: "-13px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "#D8543D",
                    color: "#FFFFFF",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    fontFamily: "var(--font-mono), monospace",
                    letterSpacing: "0.08em",
                    padding: "0.25rem 0.85rem",
                    borderRadius: "6px",
                  }}
                >
                  {plan.badge}
                </div>
              )}

              <div>
                <h3 style={{ fontSize: "1.45rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  {plan.name}
                </h3>
                <p style={{ fontSize: "0.88rem", lineHeight: 1.5, color: plan.highlight ? "#D9D2C5" : "#54524c", marginBottom: "1.75rem", minHeight: "2.6rem" }}>
                  {plan.desc}
                </p>

                {/* Price Display */}
                <div style={{ marginBottom: "2rem", display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                  <span style={{ fontSize: "clamp(2.5rem, 4vw, 3.25rem)", fontWeight: 800, fontFamily: "var(--font-serif), serif", lineHeight: 1 }}>
                    {price === 0 ? "৳0" : `৳${price.toLocaleString()}`}
                  </span>
                  <span style={{ fontSize: "0.88rem", color: plan.highlight ? "#8A8780" : "#8A8780", fontFamily: "var(--font-mono), monospace" }}>
                    {price === 0 ? "/ free forever" : "/ month"}
                  </span>
                </div>

                <hr style={{ border: "none", borderTop: `1px solid ${plan.highlight ? "rgba(255,255,255,0.12)" : "#E5E0D5"}`, margin: "0 0 1.75rem 0" }} />

                {/* Feature List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem", fontSize: "0.85rem" }}>
                      <Check
                        size={16}
                        color="#D8543D"
                        style={{ flexShrink: 0, marginTop: "2px" }}
                      />
                      <span style={{ color: plan.highlight ? "#FFFDF7" : "#141514", lineHeight: 1.45 }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={plan.ctaHref}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.45rem",
                  padding: "0.85rem 1.4rem",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  textDecoration: "none",
                  textAlign: "center",
                  backgroundColor: plan.highlight ? "#D8543D" : "#141514",
                  color: "#FFFFFF",
                  transition: "opacity 0.15s ease",
                }}
              >
                <span>{plan.ctaLabel}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
