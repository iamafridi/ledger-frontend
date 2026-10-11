"use client";

import React from "react";
import { ShieldCheck, CheckCircle2, Quote } from "lucide-react";

export function SocialProofTestimonials() {
  const stats = [
    { value: "৳1.4B+", label: "Balanced Transactions Tracked" },
    { value: "100%", label: "Strict Double-Entry Invariant" },
    { value: "99.99%", label: "Platform Availability Uptime" },
    { value: "4 Hours", label: "Average Month-End Close (vs 9 Days)" },
  ];

  const testimonials = [
    {
      quote:
        "We previously operated with 14 disconnected spreadsheets and an outdated desktop system. Moving to Ledger reduced our month-end reconciliation time from nine days to just under four hours.",
      author: "Farhan Ahmed, FCA",
      role: "Chief Financial Officer",
      company: "Apex Meridian Group",
      tag: "Apparel & Export",
    },
    {
      quote:
        "In retail distribution, missing 15% VAT input rebates or carrying float discrepancies causes massive tax penalties. Ledger gives our treasury team complete visibility across all bank accounts and warehouse stock.",
      author: "Nabila Hossain",
      role: "Managing Director",
      company: "Bengal Retail & Logistics",
      tag: "Retail Distribution",
    },
    {
      quote:
        "The immutable append-only journal entries gave our statutory auditors 100% confidence from day one. Invariants aren’t marketing slogans here — the math is mathematically bulletproof.",
      author: "Tariqul Karim",
      role: "Head of Finance & Operations",
      company: "Novas Trading Corp",
      tag: "Trading & Logistics",
    },
  ];

  return (
    <section id="proof" style={{ padding: "clamp(4rem, 7vw, 6.5rem) 2rem", maxWidth: "1440px", margin: "0 auto" }}>
      {/* Metrics Banner */}
      <div
        style={{
          backgroundColor: "#141514",
          color: "#FFFDF7",
          borderRadius: "12px",
          padding: "clamp(2rem, 4vw, 3rem)",
          marginBottom: "4.5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "2rem",
          textAlign: "center",
          boxShadow: "0 12px 30px rgba(20, 21, 20, 0.1)",
        }}
      >
        {stats.map((s, idx) => (
          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <div
              style={{
                fontFamily: "var(--font-serif), serif",
                fontSize: "clamp(2rem, 3.8vw, 2.75rem)",
                fontWeight: 700,
                color: idx === 0 ? "#D8543D" : "#FFFDF7",
                lineHeight: 1.1,
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: "0.82rem", color: "#8A8780", fontFamily: "var(--font-mono), monospace" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Testimonials Header */}
      <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 3.5rem" }}>
        <div className="tag-chip" style={{ marginBottom: "1rem" }}>
          <span className="tag-chip-check">✓</span>
          <span>Proven In The Field</span>
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
          Trusted by finance leaders <br />
          <em style={{ fontStyle: "italic", fontWeight: 400, color: "#D8543D" }}>who refuse ambiguity.</em>
        </h2>

        <p style={{ fontSize: "1.05rem", lineHeight: 1.65, color: "#54524c", margin: 0 }}>
          Real companies handling real payroll, multi-bank liquidity, and statutory tax obligations every single day.
        </p>
      </div>

      {/* Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
          gap: "1.75rem",
        }}
      >
        {testimonials.map((item, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #D8D2C5",
              borderRadius: "12px",
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "1.5rem",
              boxShadow: "0 2px 8px rgba(20, 21, 20, 0.03)",
              position: "relative",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontFamily: "var(--font-mono), monospace",
                    color: "#54524c",
                    backgroundColor: "#F4EFE6",
                    border: "1px solid #E2DDD3",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "4px",
                    fontWeight: 600,
                  }}
                >
                  {item.tag}
                </span>
                <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.75rem", color: "#D8543D", fontWeight: 700 }}>
                  VERIFIED AUDIT
                </span>
              </div>

              <p style={{ fontSize: "0.95rem", lineHeight: 1.65, color: "#141514", fontStyle: "italic", margin: 0 }}>
                &ldquo;{item.quote}&rdquo;
              </p>
            </div>

            <div style={{ borderTop: "1px solid #E5E0D5", paddingTop: "1rem" }}>
              <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#141514" }}>{item.author}</div>
              <div style={{ fontSize: "0.78rem", color: "#8A8780", marginTop: "2px" }}>
                {item.role} · <strong style={{ color: "#54524c" }}>{item.company}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
