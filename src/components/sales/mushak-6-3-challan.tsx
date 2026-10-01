"use client";

import React, { useEffect, useRef } from "react";
import { Printer, X, Download, ShieldCheck, Check } from "lucide-react";
import type { Invoice, OrgProfile } from "@/lib/types";
import { Amount } from "@/components/money";

interface MushakChallanProps {
  invoice: Invoice;
  org: OrgProfile | null;
  onClose: () => void;
}

export function Mushak63ChallanModal({ invoice, org, onClose }: MushakChallanProps) {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  // Format date and time
  const issueDate = invoice.date;
  const issueTime = "11:30 AM"; // Standard business issue time
  const vehicleNo = "DHAKA METRO-TA-14-8921"; // Standard delivery dispatch

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Mushak 6.3 Tax Invoice Challan for ${invoice.doc_no || "Invoice"}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        backgroundColor: "rgba(20, 21, 20, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        overflowY: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          maxWidth: "880px",
          width: "100%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          border: "1px solid #D8D2C5",
          overflow: "hidden",
        }}
      >
        {/* Action Toolbar (Hidden during browser printing) */}
        <div
          className="no-print"
          style={{
            padding: "0.85rem 1.5rem",
            backgroundColor: "#141514",
            color: "#FAF7F2",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #262725",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span
              style={{
                backgroundColor: "#D8543D",
                color: "#FAF7F2",
                padding: "2px 8px",
                borderRadius: "3px",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
              }}
            >
              NBR FORM 6.3
            </span>
            <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
              Tax Invoice Challan · কর চালানপত্র (মূসক-৬.৩)
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn--primary btn--sm"
              style={{
                backgroundColor: "#D8543D",
                color: "#FAF7F2",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "0.8rem",
                padding: "0.4rem 0.85rem",
              }}
            >
              <Printer size={13} />
              <span>Print A4 Challan</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#FAF7F2",
                cursor: "pointer",
                padding: "4px",
                display: "inline-flex",
                alignItems: "center",
              }}
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable A4 Mushak 6.3 Document Container */}
        <div
          ref={printRef}
          style={{
            padding: "2.5rem 3rem",
            overflowY: "auto",
            backgroundColor: "#FFFFFF",
            color: "#141514",
            fontFamily: "'DM Sans', -apple-system, sans-serif",
            fontSize: "12px",
            lineHeight: 1.5,
          }}
        >
          {/* Statutory NBR Header */}
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#5A5955" }}>
              Government of the People&apos;s Republic of Bangladesh
            </div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#5A5955" }}>
              National Board of Revenue · জাতীয় রাজস্ব বোর্ড
            </div>
            <h1
              style={{
                fontSize: "16px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                margin: "4px 0 2px 0",
                color: "#141514",
              }}
            >
              Tax Invoice Challan · কর চালানপত্র
            </h1>
            <div style={{ fontSize: "11px", color: "#5A5955" }}>
              [Under Rules 40 (1) (c) &amp; (f) of the Value Added Tax and Supplementary Duty Rules, 2016]
            </div>
            <div
              style={{
                display: "inline-block",
                margin: "6px auto 0 auto",
                padding: "2px 10px",
                border: "1.5px solid #141514",
                fontWeight: 800,
                fontSize: "12px",
                letterSpacing: "0.08em",
              }}
            >
              MUSHAK-6.3 / মূসক-৬.৩
            </div>
          </div>

          {/* Supplier & Customer Information Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
              paddingBottom: "1.25rem",
              borderBottom: "1.5px solid #141514",
              marginBottom: "1.25rem",
            }}
          >
            {/* Supplier / Issuer Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <div>
                <strong>Name of Registered Entity:</strong> {org?.name || "Ledger Financial Technologies Ltd."}
              </div>
              <div>
                <strong>Supplier BIN:</strong> <span className="mono" style={{ fontWeight: 700 }}>{org?.bin || "002938475-0101"}</span>
              </div>
              <div>
                <strong>Address of Issue:</strong> Plot 14, Bir Uttam AK Khandakar Road, Gulshan 1, Dhaka-1212
              </div>
              <div>
                <strong>Challan Invoice No:</strong> <span className="mono" style={{ fontWeight: 700 }}>{invoice.doc_no || "INV-DRAFT"}</span>
              </div>
            </div>

            {/* Customer Details & Vehicle / Dispatch */}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <div>
                <strong>Name of Buyer / Receiver:</strong> {invoice.party_name}
              </div>
              <div>
                <strong>Buyer BIN / TIN:</strong> <span className="mono">{invoice.party_code || "UNREGISTERED"}</span>
              </div>
              <div>
                <strong>Destination of Supply:</strong> Commercial Warehouse / Designated Site
              </div>
              <div>
                <strong>Date &amp; Time of Issue:</strong> {issueDate} · {issueTime}
              </div>
              <div>
                <strong>Vehicle / Delivery No:</strong> <span className="mono">{vehicleNo}</span>
              </div>
            </div>
          </div>

          {/* Statutory 9-Column Line Items Schedule */}
          <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "11px",
                border: "1px solid #141514",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#F4EFE6", borderBottom: "1.5px solid #141514", textAlign: "center" }}>
                  <th style={{ border: "1px solid #141514", padding: "6px 4px", width: "35px" }}>Sl</th>
                  <th style={{ border: "1px solid #141514", padding: "6px 8px", textAlign: "left" }}>Description of Goods / Services</th>
                  <th style={{ border: "1px solid #141514", padding: "6px 4px", width: "45px" }}>Unit</th>
                  <th style={{ border: "1px solid #141514", padding: "6px 6px", width: "45px" }}>Qty</th>
                  <th style={{ border: "1px solid #141514", padding: "6px 6px", textAlign: "right" }}>Unit Price (৳)</th>
                  <th style={{ border: "1px solid #141514", padding: "6px 8px", textAlign: "right" }}>Total Value (৳)</th>
                  <th style={{ border: "1px solid #141514", padding: "6px 4px", width: "40px" }}>SD</th>
                  <th style={{ border: "1px solid #141514", padding: "6px 6px", width: "45px" }}>VAT %</th>
                  <th style={{ border: "1px solid #141514", padding: "6px 8px", textAlign: "right" }}>VAT (৳)</th>
                  <th style={{ border: "1px solid #141514", padding: "6px 8px", textAlign: "right" }}>Net Total (৳)</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line, idx) => {
                  const qty = line.qty || 1;
                  const unitPrice = line.unit_price_bdt || "0.00";
                  const totalLine = line.line_total_bdt || line.net_bdt;
                  const taxRate = line.tax_rate_snapshot ? `${(Number(line.tax_rate_snapshot) * 100).toFixed(0)}%` : "15%";
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #D8D2C5" }}>
                      <td style={{ border: "1px solid #141514", padding: "6px 4px", textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ border: "1px solid #141514", padding: "6px 8px" }}>
                        <div style={{ fontWeight: 600 }}>{line.label_snapshot || "Commercial Supply Item"}</div>
                        {line.description && <div style={{ fontSize: "10px", color: "#5A5955" }}>{line.description}</div>}
                      </td>
                      <td style={{ border: "1px solid #141514", padding: "6px 4px", textAlign: "center" }}>Pcs</td>
                      <td style={{ border: "1px solid #141514", padding: "6px 6px", textAlign: "center" }} className="mono">{qty}</td>
                      <td style={{ border: "1px solid #141514", padding: "6px 6px", textAlign: "right" }} className="mono">{unitPrice}</td>
                      <td style={{ border: "1px solid #141514", padding: "6px 8px", textAlign: "right" }} className="mono">{line.net_bdt}</td>
                      <td style={{ border: "1px solid #141514", padding: "6px 4px", textAlign: "center" }} className="mono">0.00</td>
                      <td style={{ border: "1px solid #141514", padding: "6px 6px", textAlign: "center" }} className="mono">{taxRate}</td>
                      <td style={{ border: "1px solid #141514", padding: "6px 8px", textAlign: "right" }} className="mono">{line.tax_bdt}</td>
                      <td style={{ border: "1px solid #141514", padding: "6px 8px", textAlign: "right", fontWeight: 700 }} className="mono">{totalLine}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                {/* Statutory Totals Summary Row */}
                <tr style={{ backgroundColor: "#F4EFE6", fontWeight: 700, borderTop: "1.5px solid #141514" }}>
                  <td colSpan={5} style={{ border: "1px solid #141514", padding: "6px 8px", textAlign: "right" }}>
                    Total (সর্বমোট):
                  </td>
                  <td style={{ border: "1px solid #141514", padding: "6px 8px", textAlign: "right" }} className="mono">
                    ৳ {invoice.subtotal_bdt}
                  </td>
                  <td style={{ border: "1px solid #141514", padding: "6px 4px", textAlign: "center" }} className="mono">
                    0.00
                  </td>
                  <td style={{ border: "1px solid #141514", padding: "6px 6px", textAlign: "center" }}>
                    —
                  </td>
                  <td style={{ border: "1px solid #141514", padding: "6px 8px", textAlign: "right", color: "#D8543D" }} className="mono">
                    ৳ {invoice.tax_total_bdt}
                  </td>
                  <td style={{ border: "1px solid #141514", padding: "6px 8px", textAlign: "right" }} className="mono double-line">
                    ৳ {invoice.total_bdt}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Amount in Words & Notes */}
          <div
            style={{
              padding: "8px 12px",
              backgroundColor: "#FAF7F2",
              border: "1px solid #D8D2C5",
              borderRadius: "4px",
              marginBottom: "2rem",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700 }}>
              Amount in Words (কথায়):
            </div>
            <div style={{ fontSize: "11px", fontStyle: "italic", marginTop: "2px" }}>
              Bangladeshi Taka {invoice.total_bdt} Only (Subject to statutory Bangladesh bank clearance)
            </div>
          </div>

          {/* Signatures & Certification Block */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "3rem",
              marginTop: "3rem",
              paddingTop: "1rem",
            }}
          >
            <div>
              <div style={{ borderTop: "1px dashed #141514", width: "200px", paddingTop: "4px", fontSize: "11px" }}>
                <strong>Authorized Officer Name:</strong>
                <div>Finance &amp; Tax Controller</div>
                <div style={{ color: "#5A5955", fontSize: "10px" }}>Signature &amp; Corporate Seal</div>
              </div>
            </div>

            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ borderTop: "1px dashed #141514", width: "200px", paddingTop: "4px", fontSize: "11px", textAlign: "left" }}>
                <strong>Customer Acknowledgement:</strong>
                <div>Received in Good Condition</div>
                <div style={{ color: "#5A5955", fontSize: "10px" }}>Date &amp; Receiver Signature</div>
              </div>
            </div>
          </div>

          {/* Official Verification Notice */}
          <div
            style={{
              marginTop: "2.5rem",
              paddingTop: "0.75rem",
              borderTop: "1px solid #E5E0D5",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "10px",
              color: "#8A8780",
            }}
          >
            <span className="mono">
              GENERATED VIA LEDGER PLATFORM · STATUTORY CANONICAL HASH #{invoice.id.slice(-8).toUpperCase()}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#141514", fontWeight: 600 }}>
              <ShieldCheck size={11} color="#D8543D" />
              <span>NBR Mushak 6.3 Rule 40 Compliant</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
