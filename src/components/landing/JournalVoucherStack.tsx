"use client";

import React, { useState } from "react";
import { ArrowRight, ArrowLeft, CheckCircle2, Layers } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

interface JournalEntry {
  id: string;
  voucherNumber: string;
  title: string;
  date: string;
  country: string;
  status: string;
  lines: {
    account: string;
    type: "DR" | "CR";
    amount: string;
  }[];
  total: string;
}

const JOURNAL_VOUCHERS: JournalEntry[] = [
  {
    id: "v-184",
    voucherNumber: "LEDGER / JOURNAL 000184",
    title: "Client Retainer — October",
    date: "14 OCT 2026",
    country: "BANGLADESH",
    status: "POSTED ✓",
    lines: [
      { account: "1010 BRAC Bank Current", type: "DR", amount: "৳ 1,38,000.00" },
      { account: "4000 Retainer Revenue", type: "CR", amount: "৳ 1,20,000.00" },
      { account: "2100 Output VAT (15%)", type: "CR", amount: "৳ 18,000.00" },
    ],
    total: "৳ 1,38,000.00",
  },
  {
    id: "v-185",
    voucherNumber: "LEDGER / JOURNAL 000185",
    title: "Commercial Warehouse Lease — Tejgaon",
    date: "15 OCT 2026",
    country: "BANGLADESH",
    status: "POSTED ✓",
    lines: [
      { account: "1500 Leasehold Asset (Prepaid)", type: "DR", amount: "৳ 2,40,000.00" },
      { account: "1010 BRAC Bank Current", type: "CR", amount: "৳ 2,40,000.00" },
    ],
    total: "৳ 2,40,000.00",
  },
  {
    id: "v-186",
    voucherNumber: "LEDGER / JOURNAL 000186",
    title: "Aarong Goods Inventory Procurement",
    date: "16 OCT 2026",
    country: "BANGLADESH",
    status: "POSTED ✓",
    lines: [
      { account: "5010 Raw Materials Inventory", type: "DR", amount: "৳ 86,956.52" },
      { account: "2110 Input VAT Challan (15%)", type: "DR", amount: "৳ 13,043.48" },
      { account: "2010 Accounts Payable — Vendor", type: "CR", amount: "৳ 1,00,000.00" },
    ],
    total: "৳ 1,00,000.00",
  },
  {
    id: "v-187",
    voucherNumber: "LEDGER / JOURNAL 000187",
    title: "Advance Corporate Income Tax (AIT)",
    date: "18 OCT 2026",
    country: "BANGLADESH",
    status: "POSTED ✓",
    lines: [
      { account: "1400 Advance Tax (NBR Challan)", type: "DR", amount: "৳ 45,000.00" },
      { account: "1010 BRAC Bank Current", type: "CR", amount: "৳ 45,000.00" },
    ],
    total: "৳ 45,000.00",
  },
  {
    id: "v-188",
    voucherNumber: "LEDGER / JOURNAL 000188",
    title: "Monthly Staff Payroll & Provident Fund",
    date: "20 OCT 2026",
    country: "BANGLADESH",
    status: "POSTED ✓",
    lines: [
      { account: "5100 Payroll & Salaries Expense", type: "DR", amount: "৳ 3,50,000.00" },
      { account: "2200 Staff Provident Fund Payable", type: "CR", amount: "৳ 35,000.00" },
      { account: "1020 City Bank Corporate Account", type: "CR", amount: "৳ 3,15,000.00" },
    ],
    total: "৳ 3,50,000.00",
  },
];

export function JournalVoucherStack() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const nextCard = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % JOURNAL_VOUCHERS.length);
  };

  const prevCard = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + JOURNAL_VOUCHERS.length) % JOURNAL_VOUCHERS.length);
  };

  const activeVoucher = JOURNAL_VOUCHERS[currentIndex];
  const nextVoucher = JOURNAL_VOUCHERS[(currentIndex + 1) % JOURNAL_VOUCHERS.length];
  const thirdVoucher = JOURNAL_VOUCHERS[(currentIndex + 2) % JOURNAL_VOUCHERS.length];

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "560px", margin: "0 auto" }}>
      {/* Stack Navigation & Counter */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          padding: "0 0.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Layers size={14} style={{ color: "#D8543D" }} />
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "0.74rem",
              letterSpacing: "0.08em",
              color: "#827F76",
              textTransform: "uppercase",
            }}
          >
            Voucher Stack · {currentIndex + 1} of {JOURNAL_VOUCHERS.length}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={prevCard}
            aria-label="Previous voucher in stack"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "1px solid #363532",
              backgroundColor: "#171817",
              color: "#FFFDF7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.15s ease",
            }}
          >
            <ArrowLeft size={14} />
          </button>
          <button
            type="button"
            onClick={nextCard}
            aria-label="Next voucher in stack"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.45rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid #363532",
              backgroundColor: "#171817",
              color: "#FFFDF7",
              fontSize: "0.76rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "transform 0.15s ease",
            }}
          >
            <span>Deal Next</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* The Physical Stack Deck with Spring Physics */}
      <div style={{ position: "relative", minHeight: "360px" }}>
        {/* Layer 3: Deepest Background Card */}
        <motion.div
          animate={{
            rotate: 3.5,
            y: 22,
            x: 14,
            scale: 0.94,
          }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          onClick={nextCard}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "100%",
            backgroundColor: "#E4DDCF",
            borderRadius: "12px",
            border: "1px solid #C5BCAD",
            opacity: 0.65,
            zIndex: 0,
            cursor: "pointer",
          }}
        />

        {/* Layer 2: Middle Peeking Card */}
        <motion.div
          animate={{
            rotate: -2,
            y: 12,
            x: 8,
            scale: 0.97,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={nextCard}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "100%",
            backgroundColor: "#EDE7DC",
            borderRadius: "12px",
            border: "1px solid #D9D2C5",
            opacity: 0.9,
            zIndex: 1,
            boxShadow: "0 10px 25px rgba(0,0,0,0.22)",
            cursor: "pointer",
            padding: "1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono), monospace", color: "#827F76" }}>
            {nextVoucher.voucherNumber} · {nextVoucher.title}
          </span>
          <span style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono), monospace", color: "#827F76", fontWeight: 700 }}>
            {nextVoucher.total}
          </span>
        </motion.div>

        {/* Layer 1: Front Active Physical Document Paper Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeVoucher.id}
            initial={{
              x: direction * 40,
              y: -15,
              rotate: direction * 5,
              opacity: 0,
              scale: 0.96,
            }}
            animate={{
              x: 0,
              y: 0,
              rotate: 0,
              opacity: 1,
              scale: 1,
            }}
            exit={{
              x: direction * -120,
              y: -25,
              rotate: direction * -8,
              opacity: 0,
              scale: 0.92,
            }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 28,
            }}
            whileHover={{
              y: -6,
              boxShadow: "0 30px 60px rgba(0, 0, 0, 0.55), 0 0 1px rgba(0,0,0,0.15)",
              transition: { duration: 0.2 },
            }}
            whileTap={{ scale: 0.98 }}
            onClick={nextCard}
            style={{
              position: "relative",
              zIndex: 2,
              backgroundColor: "#FFFDF7",
              color: "#171817",
              borderRadius: "12px",
              border: "1px solid #282a29",
              padding: "1.75rem 2rem",
              boxShadow: "0 24px 50px rgba(0, 0, 0, 0.45), 0 0 1px rgba(0,0,0,0.1)",
              cursor: "pointer",
              userSelect: "none",
            }}
            title="Click card to shuffle to next voucher in stack"
          >
          {/* Card Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "2px solid #171817",
              paddingBottom: "0.85rem",
              marginBottom: "1.25rem",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono), monospace",
                  color: "#827F76",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {activeVoucher.voucherNumber}
              </span>
              <h4 style={{ fontSize: "1.18rem", fontWeight: 700, margin: "0.2rem 0 0 0", color: "#171817" }}>
                {activeVoucher.title}
              </h4>
            </div>
            <span
              style={{
                fontSize: "0.74rem",
                fontWeight: 700,
                color: "#171817",
                backgroundColor: "#EFE9DC",
                border: "1px solid #D9D2C5",
                padding: "0.25rem 0.65rem",
                borderRadius: "4px",
                fontFamily: "var(--font-mono), monospace",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#3ddc97" }} />
              {activeVoucher.status}
            </span>
          </div>

          {/* Date & Country Subheader */}
          <div
            style={{
              fontSize: "0.78rem",
              color: "#827F76",
              fontFamily: "var(--font-mono), monospace",
              marginBottom: "1.1rem",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{activeVoucher.date} · {activeVoucher.country}</span>
            <span style={{ color: "#D8543D", fontWeight: 600 }}>MUTATION BALANCED</span>
          </div>

          {/* Journal Table Lines */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.65rem",
              fontSize: "0.86rem",
              fontFamily: "var(--font-mono), monospace",
            }}
          >
            {activeVoucher.lines.map((line, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #ECE6D8",
                  paddingBottom: "0.45rem",
                }}
              >
                <span style={{ color: "#2B2A27" }}>{line.account}</span>
                <span style={{ fontWeight: 700, color: line.type === "DR" ? "#171817" : "#D8543D" }}>
                  {line.type} {line.amount}
                </span>
              </div>
            ))}
          </div>

          {/* Entry Total Footer */}
          <div
            style={{
              marginTop: "1.25rem",
              paddingTop: "0.85rem",
              borderTop: "2px solid #171817",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.92rem",
              fontWeight: 700,
              fontFamily: "var(--font-mono), monospace",
            }}
          >
            <span style={{ color: "#171817" }}>Double-Entry Sum</span>
            <span style={{ color: "#171817", fontSize: "1rem" }}>{activeVoucher.total}</span>
          </div>

          {/* Bottom Flip Prompt */}
          <div
            style={{
              marginTop: "0.85rem",
              textAlign: "right",
              fontSize: "0.7rem",
              fontFamily: "var(--font-mono), monospace",
              color: "#827F76",
            }}
          >
            Click card to inspect next voucher ({currentIndex + 1} of {JOURNAL_VOUCHERS.length}) ↗
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  </div>
  );
}
