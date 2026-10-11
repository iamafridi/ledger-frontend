"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function LandingFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does Ledger compare to legacy systems like Tally or Excel for Bangladesh operations?",
      a: "Unlike desktop legacy tools, Ledger is a modern cloud operating system built natively for Bangladesh commercial law. Standard 15% NBR VAT, Mushak 6.3 challans, Mushak 9.1 returns, and withholding taxes (VDS/TDS) are computed automatically on the document lines rather than manually patched in spreadsheets.",
    },
    {
      q: "Can we import our existing Chart of Accounts, customers, and vendor records?",
      a: "Yes. Ledger provides automated CSV and JSON master data onboarding. You can bring your existing chart of accounts, customer balances, vendor lists, and warehouse inventory in under 15 minutes with complete validation against double-entry invariants.",
    },
    {
      q: "What does 'exact integer arithmetic' mean for our finance team?",
      a: "Standard software often uses floating-point numbers which silently introduce fractions of a cent over thousands of operations. Ledger stores all amounts in exact integer paisa (1 Taka = 100 Paisa), guaranteeing that trial balances, balance sheets, and tax schedules match to the exact paisa with zero rounding errors.",
    },
    {
      q: "Can our external statutory audit firm access our books?",
      a: "Yes. Ledger features a dedicated Auditor role with read-only permissions to inspect append-only journal vouchers, trial balance trees, and chronological audit trails without the ability to modify live transactions.",
    },
    {
      q: "How does multi-bank and mobile financial services (MFS) reconciliation work?",
      a: "You can map unlimited treasury accounts — including BRAC Bank corporate accounts, Dutch-Bangla Bank settlements, and bKash Corporate merchant accounts. Internal transfers post in a single atomic transaction, preventing half-finished entries.",
    },
    {
      q: "Can we start free and scale as our transaction volume grows?",
      a: "Yes. The Starter plan is free forever for personal bookkeeping and small consultancies. As your team grows, you can upgrade to Growth (৳2,999/mo) or Enterprise with a single click, keeping all historical ledgers and audit records intact.",
    },
  ];

  return (
    <section id="faq" style={{ padding: "clamp(4rem, 7vw, 6.5rem) 2rem", maxWidth: "960px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
        <div className="tag-chip" style={{ marginBottom: "1rem" }}>
          <span className="tag-chip-check">✓</span>
          <span>Frequently Answered Questions</span>
        </div>

        <h2
          style={{
            fontFamily: "var(--font-serif), serif",
            fontSize: "clamp(2.4rem, 4.5vw, 3.2rem)",
            lineHeight: 1.15,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "#171817",
            marginBottom: "1rem",
          }}
        >
          Everything you need to know.
        </h2>
        <p style={{ fontSize: "1.05rem", color: "#54524c", margin: 0 }}>
          Clear answers about architecture, compliance, migration, and scaling.
        </p>
      </div>

      {/* Accordion */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              style={{
                backgroundColor: "#FFFFFF",
                border: `1px solid ${isOpen ? "#141514" : "#D8D2C5"}`,
                borderRadius: "10px",
                overflow: "hidden",
                transition: "all 0.15s ease",
              }}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                style={{
                  width: "100%",
                  padding: "1.25rem 1.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  background: isOpen ? "#F4EFE6" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  color: "#171817",
                }}
              >
                <span>{faq.q}</span>
                <span style={{ color: isOpen ? "#D8543D" : "#8A8780", flexShrink: 0 }}>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </button>

              {isOpen && (
                <div style={{ padding: "1.25rem 1.75rem 1.5rem", fontSize: "0.94rem", lineHeight: 1.65, color: "#54524c", backgroundColor: "#FFFFFF" }}>
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
