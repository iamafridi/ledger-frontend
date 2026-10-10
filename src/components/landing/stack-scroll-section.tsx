"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

const PRINCIPLES = [
  {
    num: "01",
    title: "Zero Floating-Point Drift",
    subtitle: "Exact Decimal Arithmetic for BDT",
    desc: "Standard JavaScript IEEE-754 numbers fail basic monetary math (0.1 + 0.2 !== 0.3). Ledger strictly enforces exact integer paisa arithmetic and canonical 2-decimal strings via decimal.js across all journal lines, calculations, and financial reports.",
    badge: "decimal.js · 40 Digits",
  },
  {
    num: "02",
    title: "The Invariant Engine (I1–I6)",
    subtitle: "Mathematical Guarantees That Never Fail",
    desc: "Every post operation is validated against fundamental accounting invariants: balanced journals (I1), trial balance equality (I2), accounting equation integrity (I3), closed period locking (I4), and sub-ledger control tie-outs (I5).",
    badge: "14 Invariant Checks",
  },
  {
    num: "03",
    title: "Unified Dual-Bridge Architecture",
    subtitle: "From Household Receipts to Corporate Ledger",
    desc: "Seamlessly bridges personal expense scanning and savings pockets (PUB-01 to PUB-25) with a full corporate double-entry general ledger, sub-ledgers, and multi-user permissions without duplicating records.",
    badge: "Dual-Bridge (D3)",
  },
  {
    num: "04",
    title: "1-Click Enterprise Seeder",
    subtitle: "Instant Complete Company Initialization",
    desc: "Instantly seeds realistic corporate entities with customers, suppliers, inventory items, sales invoices, procurement bills, fixed assets, staff records, and posted payroll runs directly into MongoDB.",
    badge: "POST /demo/enterprise",
  },
  {
    num: "05",
    title: "Statutory NBR VAT & A4 Printing",
    subtitle: "Built for Official Bangladesh Compliance",
    desc: "Automated output tax and input rebate calculation with NBR VAT 9.1 returns, withholding tracking, and publication-quality printable A4 tax invoices and employee payslips.",
    badge: "NBR Form 9.1 Ready",
  },
];

export function StackScrollSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardWidth = 420;
    const newScrollLeft =
      direction === "left"
        ? scrollRef.current.scrollLeft - cardWidth
        : scrollRef.current.scrollLeft + cardWidth;

    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const index = Math.round(scrollRef.current.scrollLeft / 400);
    setActiveIndex(Math.min(Math.max(0, index), PRINCIPLES.length - 1));
  };

  return (
    <section
      id="why-ledger"
      className="section"
      style={{
        background: "linear-gradient(180deg, #07090c 0%, #0d1116 50%, #07090c 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div className="wrap stack-lg">
        <div className="row-between" style={{ alignItems: "flex-end" }}>
          <div className="stack" style={{ gap: "var(--s-2)" }}>
            <span
              className="chip"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(216, 84, 61, 0.12)",
                color: "#FFFDF7",
                border: "1px solid rgba(216, 84, 61, 0.45)",
                padding: "0.35rem 0.85rem",
                borderRadius: "999px",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#D8543D",
                }}
              />
              Architectural Non-Negotiables
            </span>
            <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", letterSpacing: "-0.03em", fontWeight: 800 }}>
              Why Ledger is Mathematically Superior
            </h2>
            <p className="muted" style={{ maxWidth: "58ch", color: "var(--ink-muted)", margin: 0 }}>
              Built from first principles for accountants, auditors, and enterprises who demand verifiable accuracy.
            </p>
          </div>

          {/* Navigation Arrows */}
          <div className="row" style={{ gap: "var(--s-2)" }}>
            <button
              type="button"
              onClick={() => scroll("left")}
              className="btn btn--quiet"
              style={{
                width: "44px",
                height: "44px",
                padding: 0,
                borderRadius: "50%",
                fontSize: "1.2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Scroll left"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="btn btn--quiet"
              style={{
                width: "44px",
                height: "44px",
                padding: 0,
                borderRadius: "50%",
                fontSize: "1.2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderColor: "rgba(184, 255, 46, 0.3)",
                color: "var(--lime)",
              }}
              aria-label="Scroll right"
            >
              →
            </button>
          </div>
        </div>

        {/* Swiper Container with Left and Right Blur Masks */}
        <div style={{ position: "relative", width: "100%" }}>
          {/* Left Blur Mask */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: "clamp(30px, 8vw, 80px)",
              background: "linear-gradient(90deg, #07090c 0%, transparent 100%)",
              zIndex: 10,
              pointerEvents: "none",
            }}
          />

          {/* Right Blur Mask */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: 0,
              width: "clamp(30px, 8vw, 80px)",
              background: "linear-gradient(270deg, #07090c 0%, transparent 100%)",
              zIndex: 10,
              pointerEvents: "none",
            }}
          />

          {/* Scroll Track */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            style={{
              display: "flex",
              gap: "var(--s-4)",
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              paddingInline: "var(--s-2)",
              paddingBlock: "var(--s-3)",
            }}
          >
            {PRINCIPLES.map((item, idx) => (
              <div
                key={item.num}
                className="panel stack"
                style={{
                  minWidth: "clamp(300px, 80vw, 420px)",
                  maxWidth: "420px",
                  scrollSnapAlign: "start",
                  background: "linear-gradient(180deg, #0f141c 0%, #0a0e14 100%)",
                  border: "1px solid rgba(184, 255, 46, 0.2)",
                  borderRadius: "var(--radius)",
                  padding: "var(--s-5)",
                  boxShadow: "0 15px 35px rgba(0, 0, 0, 0.7), 0 0 20px rgba(184, 255, 46, 0.05)",
                  gap: "var(--s-3)",
                  flexShrink: 0,
                }}
              >
                <div className="row-between">
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--t-2xl)",
                      fontWeight: 900,
                      color: "var(--lime)",
                      lineHeight: 1,
                    }}
                  >
                    {item.num}
                  </span>
                  <span
                    className="chip"
                    style={{
                      color: "var(--lime)",
                      borderColor: "rgba(184, 255, 46, 0.3)",
                      background: "rgba(184, 255, 46, 0.08)",
                      fontSize: "0.6875rem",
                    }}
                  >
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: "var(--t-lg)", margin: 0, fontWeight: 700 }}>{item.title}</h3>
                  <p className="label" style={{ margin: "2px 0 0 0", color: "var(--ink-faint)", textTransform: "none" }}>
                    {item.subtitle}
                  </p>
                </div>

                <p className="muted" style={{ margin: 0, lineHeight: 1.65, color: "var(--ink-muted)", fontSize: "var(--t-sm)" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Indicator Dots */}
        <div className="row" style={{ justifyContent: "center", gap: "var(--s-2)", marginTop: "var(--s-2)" }}>
          {PRINCIPLES.map((_, idx) => (
            <span
              key={idx}
              style={{
                width: activeIndex === idx ? "24px" : "8px",
                height: "8px",
                borderRadius: "var(--radius-pill)",
                background: activeIndex === idx ? "var(--lime)" : "var(--line-firm)",
                transition: "all var(--fast) var(--ease)",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
