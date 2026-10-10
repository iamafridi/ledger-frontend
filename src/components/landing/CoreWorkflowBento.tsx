"use client";

import React, { useState } from "react";
import {
  FileText,
  CreditCard,
  Building2,
  Boxes,
  Users,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export function CoreWorkflowBento() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const workflows = [
    {
      id: 1,
      badge: "Sales & Invoicing",
      title: "Automated Invoicing & Instant Collections",
      desc: "Generate tax-compliant B2B invoices with auto-calculated 15% NBR VAT, customizable payment terms, and direct bank settlement links.",
      stat: "৳12.4M+",
      statLabel: "Monthly receivables tracked",
      icon: <FileText size={20} color="#141514" />,
      features: ["Auto-calculated 15% VAT & VDS", "Accounts Receivable Aging (1-90+ days)", "Partial payment allocations"],
    },
    {
      id: 2,
      badge: "Treasury & Banking",
      title: "Consolidated Multi-Bank Feeds",
      desc: "Aggregate BRAC Bank, Dutch-Bangla, and bKash Corporate into one real-time liquidity view with auto-matching statement reconciliation.",
      stat: "99.8%",
      statLabel: "Auto-reconciled statements",
      icon: <CreditCard size={20} color="#141514" />,
      features: ["Multi-account cash runway", "One-click internal transfers", "Live float-free balances"],
    },
    {
      id: 3,
      badge: "Procurement & AP",
      title: "Vendor Bills & 3-Way Matching",
      desc: "Track purchase orders, receipt vouchers, and vendor payables. Issue automated Tax Withholding (TDS/VDS) certificates in seconds.",
      stat: "Zero",
      statLabel: "Duplicate vendor payments",
      icon: <Building2 size={20} color="#141514" />,
      features: ["AP aging schedules", "Vendor credit limits", "Input tax rebate capture"],
    },
    {
      id: 4,
      badge: "Inventory & Warehouses",
      title: "Perpetual Stock & Valuation",
      desc: "Track inventory across Tejgaon and Chittagong hubs with moving average cost (WAC), automated COGS relief, and discrepancy stocktakes.",
      stat: "Real-time",
      statLabel: "Perpetual stock valuation",
      icon: <Boxes size={20} color="#141514" />,
      features: ["Weighted Average Costing (WAC)", "Inter-warehouse stock transfers", "Automated low-stock reorder triggers"],
    },
    {
      id: 5,
      badge: "Statutory Compliance",
      title: "NBR Mushak 9.1 VAT Return Ready",
      desc: "Every invoice and procurement bill automatically categorizes standard, exempt, and withheld VAT. File monthly returns with one click.",
      stat: "100%",
      statLabel: "NBR statutory alignment",
      icon: <ShieldCheck size={20} color="#141514" />,
      features: ["Output tax & input tax rebate ledger", "Challan deposit tracking", "Withholding Mushak 6.3 certificate printing"],
    },
    {
      id: 6,
      badge: "Payroll & Staff",
      title: "Monthly Staff Payroll & Advances",
      desc: "Manage salary disbursements, staff welfare loans, monthly advances, and tax withholdings with single-batch journal vouchers.",
      stat: "1-Click",
      statLabel: "Bank payroll disbursement",
      icon: <Users size={20} color="#141514" />,
      features: ["Automated advance deductions", "Welfare loan schedules", "Batch bank disbursement logs"],
    },
  ];

  return (
    <section id="workflows" style={{ padding: "clamp(4rem, 7vw, 6.5rem) 2rem", maxWidth: "1440px", margin: "0 auto" }}>
      {/* Section Header */}
      <div style={{ textAlign: "center", maxWidth: "720px", margin: "0 auto 3.5rem" }}>
        <div className="tag-chip" style={{ marginBottom: "1rem" }}>
          <span className="tag-chip-check">✓</span>
          <span>Core Commercial Workflows</span>
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
          Built for every business department. <br />
          <em style={{ fontStyle: "italic", fontWeight: 400, color: "#D8543D" }}>United in one ledger.</em>
        </h2>

        <p style={{ fontSize: "1.05rem", lineHeight: 1.65, color: "#54524c", margin: 0 }}>
          Replace fragmented spreadsheets and disconnected tools. Ledger handles billing, procurement, inventory, banking, and statutory tax in one seamless double-entry core.
        </p>
      </div>

      {/* Bento Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
          gap: "1.5rem",
        }}
      >
        {workflows.map((item) => {
          const isHovered = hoveredCard === item.id;
          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredCard(item.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                borderRadius: "12px",
                border: `1px solid ${isHovered ? "#141514" : "#D8D2C5"}`,
                background: "#FFFFFF",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "1.5rem",
                transition: "all 0.15s ease",
                boxShadow: isHovered
                  ? "0 6px 20px rgba(20, 21, 20, 0.06)"
                  : "0 1px 3px rgba(20, 21, 20, 0.02)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      backgroundColor: "#F4EFE6",
                      border: "1px solid #D8D2C5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </div>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontFamily: "var(--font-mono), monospace",
                      fontWeight: 600,
                      color: "#54524c",
                      backgroundColor: "#F4EFE6",
                      padding: "0.25rem 0.65rem",
                      borderRadius: "6px",
                      border: "1px solid #E2DDD3",
                    }}
                  >
                    {item.badge}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "#171817",
                    marginBottom: "0.75rem",
                    lineHeight: 1.3,
                  }}
                >
                  {item.title}
                </h3>

                <p style={{ fontSize: "0.92rem", lineHeight: 1.6, color: "#54524c", marginBottom: "1.5rem" }}>
                  {item.desc}
                </p>

                {/* Key feature bullets */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {item.features.map((feat, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "#171817" }}>
                      <CheckCircle2 size={13} color="#D8543D" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Stat Bar */}
              <div
                style={{
                  paddingTop: "1.25rem",
                  borderTop: "1px solid #E5E0D5",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: "1.4rem", fontWeight: 700, color: "#141514" }}>
                    {item.stat}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "#8A8780", fontFamily: "var(--font-mono), monospace" }}>
                    {item.statLabel}
                  </div>
                </div>
                <div style={{ color: isHovered ? "#D8543D" : "#141514", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px", transition: "color 0.15s ease" }}>
                  Live in Suite ↗
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
