"use client";

import React, { useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { playAcousticTick, playVaultClick } from "@/lib/audio";

interface ReceiptSample {
  id: "shwapno" | "aarong" | "startech";
  merchant: string;
  category: string;
  binNo: string;
  challanNo: string;
  date: string;
  items: { name: string; qty: number; unitPrice: number; total: number }[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  debitAccount: string;
  vatAccount: string;
  creditAccount: string;
}

const RECEIPT_SAMPLES: ReceiptSample[] = [
  {
    id: "shwapno",
    merchant: "Shwapno Superstore (Gulshan 1)",
    category: "Groceries & Household Supplies",
    binNo: "BIN: 002391048-0101",
    challanNo: "MUSHAK-6.3/2026/8941",
    date: "14 Oct 2026, 18:42",
    items: [
      { name: "Miniket Premium Rice 5kg", qty: 2, unitPrice: 420, total: 840 },
      { name: "Rupchanda Fortified Soybean Oil 5L", qty: 1, unitPrice: 910, total: 910 },
      { name: "Radhuni Turmeric & Chilli Spices", qty: 3, unitPrice: 180, total: 540 },
      { name: "Aarong Dairy Full Cream Milk 1L", qty: 4, unitPrice: 95, total: 380 },
      { name: "Fresh Tissue & Cleaning Detergent", qty: 1, unitPrice: 304, total: 304 },
    ],
    subtotal: 2974,
    vatRate: 0.15,
    vatAmount: 446,
    grandTotal: 3420,
    debitAccount: "5100 Office & Pantry Supplies",
    vatAccount: "1150 Input VAT Paid (Mushak 6.3)",
    creditAccount: "1000 Corporate Petty Cash Till",
  },
  {
    id: "aarong",
    merchant: "Aarong Lifestyle (Tejgaon Flagship)",
    category: "Corporate Uniforms & Festive Gifts",
    binNo: "BIN: 001928475-0202",
    challanNo: "MUSHAK-6.3/2026/3042",
    date: "12 Oct 2026, 14:15",
    items: [
      { name: "Executive Silk Panjabi Set", qty: 2, unitPrice: 3200, total: 6400 },
      { name: "Handcrafted Jute Corporate Folder", qty: 5, unitPrice: 276.6, total: 1383 },
    ],
    subtotal: 7783,
    vatRate: 0.15,
    vatAmount: 1167,
    grandTotal: 8950,
    debitAccount: "5200 Staff Welfare & Executive Apparel",
    vatAccount: "1150 Input VAT Paid (Mushak 6.3)",
    creditAccount: "1010 BRAC Bank Corporate Visa",
  },
  {
    id: "startech",
    merchant: "Star Tech & Engineering Ltd (IDB)",
    category: "IT Hardware & Peripherals",
    binNo: "BIN: 003849120-0404",
    challanNo: "MUSHAK-6.3/2026/1198",
    date: "10 Oct 2026, 11:20",
    items: [
      { name: "Dell UltraSharp 27\" 4K IPS Monitor", qty: 1, unitPrice: 21305, total: 21305 },
    ],
    subtotal: 21305,
    vatRate: 0.15,
    vatAmount: 3195,
    grandTotal: 24500,
    debitAccount: "1500 Computer & Electronic Hardware",
    vatAccount: "1150 Input VAT Paid (Mushak 6.3)",
    creditAccount: "2000 Accounts Payable (Star Tech Ltd)",
  },
];

export function InteractiveReceiptScanner() {
  const [selectedId, setSelectedId] = useState<"shwapno" | "aarong" | "startech">("shwapno");
  const [isScanning, setIsScanning] = useState(false);

  const receipt = RECEIPT_SAMPLES.find((r) => r.id === selectedId) || RECEIPT_SAMPLES[0];

  const handleSelect = (id: "shwapno" | "aarong" | "startech") => {
    playAcousticTick(2200, 0.02);
    setSelectedId(id);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      playVaultClick();
    }, 600);
  };

  return (
    <div
      style={{
        backgroundColor: "#0C0D0C",
        borderRadius: "20px",
        border: "1px solid rgba(201, 155, 82, 0.3)",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top Gold Foil Ribbon */}
      <div
        style={{
          padding: "0.85rem 1.25rem",
          backgroundColor: "#141614",
          borderBottom: "1px solid #232623",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#C99B52", boxShadow: "0 0 10px #C99B52" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", fontWeight: 700, color: "#FFFDF7", letterSpacing: "0.06em" }}>
            AI RECEIPT &amp; MUSHAK 6.3 OCR PIPELINE
          </span>
        </div>

        {/* Merchant Sample Switchers */}
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {RECEIPT_SAMPLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelect(r.id)}
              style={{
                padding: "0.3rem 0.65rem",
                borderRadius: "6px",
                border: selectedId === r.id ? "1px solid #C99B52" : "1px solid #282a28",
                backgroundColor: selectedId === r.id ? "rgba(201, 155, 82, 0.18)" : "#181a18",
                color: selectedId === r.id ? "#E5C287" : "#827F76",
                fontSize: "0.72rem",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {r.id.toUpperCase()} (৳ {r.grandTotal.toLocaleString()})
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Scanned Physical Challan vs Auto-Generated Voucher */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
          padding: "1.5rem",
        }}
      >
        {/* Left: Thermal Scanned Receipt Paper */}
        <div
          style={{
            backgroundColor: "#FFFDF7",
            color: "#171817",
            borderRadius: "12px",
            padding: "1.5rem",
            fontFamily: "var(--font-mono), monospace",
            position: "relative",
            boxShadow: "0 12px 30px rgba(0, 0, 0, 0.4)",
            border: "1px solid #E6E0D3",
            overflow: "hidden",
          }}
        >
          {/* Animated Laser Scanning Line */}
          {isScanning && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                backgroundColor: "#D8543D",
                boxShadow: "0 0 12px #D8543D, 0 0 24px #D8543D",
                animation: "scanLineAnim 0.6s ease-in-out infinite alternate",
                zIndex: 10,
              }}
            />
          )}

          {/* Receipt Header */}
          <div style={{ textAlign: "center", borderBottom: "1px dashed #171817", paddingBottom: "0.75rem", marginBottom: "0.75rem" }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, textTransform: "uppercase" }}>
              {receipt.merchant}
            </div>
            <div style={{ fontSize: "0.68rem", color: "#66635c", marginTop: "2px" }}>
              {receipt.binNo} · {receipt.challanNo}
            </div>
            <div style={{ fontSize: "0.65rem", color: "#827F76", marginTop: "2px" }}>
              {receipt.date}
            </div>
          </div>

          {/* Line Items */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", fontSize: "0.72rem" }}>
            {receipt.items.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>
                  {item.qty}x {item.name}
                </span>
                <span style={{ fontWeight: 600 }}>৳ {item.total.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Subtotal & 15% VAT Totals */}
          <div style={{ borderTop: "1px dashed #171817", marginTop: "0.75rem", paddingTop: "0.6rem", display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#54524c" }}>
              <span>Subtotal (Excl. VAT)</span>
              <span>৳ {receipt.subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#D8543D", fontWeight: 700 }}>
              <span>15% Statutory Input VAT</span>
              <span>+ ৳ {receipt.vatAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "0.95rem", borderTop: "1px solid #171817", paddingTop: "0.4rem", marginTop: "0.2rem" }}>
              <span>TOTAL PAID</span>
              <span>৳ {receipt.grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* OCR Watermark Stamp */}
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              right: "16px",
              transform: "rotate(-12deg)",
              border: "2px solid #D8543D",
              color: "#D8543D",
              fontSize: "0.65rem",
              fontWeight: 800,
              padding: "2px 6px",
              borderRadius: "4px",
              opacity: 0.8,
              letterSpacing: "0.08em",
            }}
          >
            NBR VAT VERIFIED
          </div>
        </div>

        {/* Right: Double-Entry Voucher Generation Engine */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* AI Intelligence Header */}
          <div
            style={{
              backgroundColor: "rgba(201, 155, 82, 0.08)",
              border: "1px solid rgba(201, 155, 82, 0.25)",
              borderRadius: "10px",
              padding: "0.85rem 1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <ShieldCheck size={18} color="#D8543D" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: "0.76rem", color: "#FFFDF7", lineHeight: 1.4 }}>
              <strong>Zero-Touch Vision OCR:</strong> Extracted merchant BIN, 15% VAT Challan, and itemized accounts with 99.8% precision.
            </div>
          </div>

          {/* Double-Entry Journal Voucher */}
          <div
            style={{
              backgroundColor: "#141514",
              border: "1px solid #282a28",
              borderRadius: "10px",
              padding: "1rem",
              fontFamily: "var(--font-mono), monospace",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.72rem", color: "#827F76" }}>JOURNAL ENTRY // VOUCHER #2026-OCR</span>
              <span style={{ fontSize: "0.68rem", color: "#4ADE80", fontWeight: 700 }}>BALANCED (0.00 DIFFERENCE)</span>
            </div>

            {/* Debit Lines */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.76rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#FFFDF7" }}>
                <span>DR {receipt.debitAccount}</span>
                <span style={{ color: "#4ADE80", fontWeight: 700 }}>+ ৳ {receipt.subtotal.toLocaleString()}.00</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#FFFDF7" }}>
                <span>DR {receipt.vatAccount}</span>
                <span style={{ color: "#4ADE80", fontWeight: 700 }}>+ ৳ {receipt.vatAmount.toLocaleString()}.00</span>
              </div>

              {/* Credit Line */}
              <div style={{ display: "flex", justifyContent: "space-between", color: "#FFFDF7", borderTop: "1px solid #222", paddingTop: "0.4rem", marginTop: "0.2rem" }}>
                <span style={{ paddingLeft: "1rem" }}>CR {receipt.creditAccount}</span>
                <span style={{ color: "#D8543D", fontWeight: 700 }}>− ৳ {receipt.grandTotal.toLocaleString()}.00</span>
              </div>
            </div>

            {/* Total Balance Check */}
            <div
              style={{
                marginTop: "0.85rem",
                paddingTop: "0.65rem",
                borderTop: "1px dashed #333",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.74rem",
                color: "#C99B52",
                fontWeight: 700,
              }}
            >
              <span>∑ Total Debits = ∑ Total Credits</span>
              <span>৳ {receipt.grandTotal.toLocaleString()}.00</span>
            </div>
          </div>

          {/* Statutory Tax & Compliance Seal */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.72rem", color: "#827F76", fontFamily: "var(--font-mono)" }}>
            <ShieldCheck size={14} color="#4ADE80" />
            <span>Ready for NBR VAT 9.1 Return &amp; Mushak 6.3 Audit Schedule</span>
          </div>
        </div>
      </div>
    </div>
  );
}
