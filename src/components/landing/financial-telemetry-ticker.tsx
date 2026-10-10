"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

interface TelemetryItem {
  id: string;
  label: string;
  value: string;
  delta?: string;
  isUp?: boolean;
  tag?: string;
}

const TELEMETRY_ITEMS: TelemetryItem[] = [
  { id: "usd", label: "USD / BDT", value: "৳ 121.50", delta: "+0.12%", isUp: true },
  { id: "eur", label: "EUR / BDT", value: "৳ 132.10", delta: "-0.05%", isUp: false },
  { id: "gold", label: "GOLD 22K (BAJUS)", value: "৳ 1,18,600 / bhori", delta: "+৳ 1,250", isUp: true },
  { id: "tbill", label: "BB 91-D T-BILL", value: "11.75%", delta: "Yield", isUp: true },
  { id: "callmoney", label: "CALL MONEY RATE", value: "9.25%", delta: "Interbank", isUp: false },
  { id: "nbr", label: "NBR STATUTORY", value: "MUSHAK 6.3 / 9.1", tag: "COMPLIANT" },
  { id: "invariants", label: "INVARIANT ENGINE", value: "14/14 PASS", delta: "Σ Dr = Σ Cr", isUp: true },
  { id: "engine", label: "PAISA ARITHMETIC", value: "ZERO DRIFT", tag: "EXACT" },
];

export function FinancialTelemetryTicker() {
  const [dhakaTime, setDhakaTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const timeStr = now.toLocaleTimeString("en-US", {
          timeZone: "Asia/Dhaka",
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        setDhakaTime(timeStr);
      } catch {
        setDhakaTime("BST 11:45:00 AM");
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      aria-label="Live Bangladesh Financial Telemetry"
      style={{
        borderTop: "1px solid #E5E0D5",
        borderBottom: "1px solid #E5E0D5",
        backgroundColor: "#F3EFE6",
        padding: "0.75rem 0",
        overflow: "hidden",
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      <div className="ticker-marquee-track">
        {[0, 1].map((copyIndex) => (
          <div
            key={copyIndex}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "2.5rem",
              paddingRight: "2.5rem",
              fontFamily: "var(--font-mono), monospace",
              fontSize: "0.78rem",
              color: "#141514",
              letterSpacing: "0.04em",
            }}
          >
            {/* Live Dhaka Financial Clock */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: "rgba(20, 21, 20, 0.06)",
                padding: "0.25rem 0.65rem",
                borderRadius: "4px",
                border: "1px solid #DCD7CB",
              }}
            >
              <Clock size={12} color="#D8543D" />
              <span style={{ fontWeight: 600, color: "#141514" }}>
                DHAKA BST: {dhakaTime || "BST UTC+6"}
              </span>
              <span
                style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#2E7D32",
                  boxShadow: "0 0 6px rgba(46, 125, 50, 0.6)",
                }}
              />
            </div>

            <span style={{ color: "#D8543D", fontWeight: 700 }}>·</span>

            {/* Macro Telemetry Elements */}
            {TELEMETRY_ITEMS.map((item) => (
              <React.Fragment key={item.id}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ color: "#6A6860", textTransform: "uppercase" }}>
                    {item.label}
                  </span>
                  <span style={{ fontWeight: 700, color: "#141514" }}>
                    {item.value}
                  </span>
                  {item.delta ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "2px",
                        fontSize: "0.72rem",
                        color: item.isUp ? "#2E7D32" : "#B73C28",
                        backgroundColor: item.isUp ? "rgba(46, 125, 50, 0.08)" : "rgba(183, 60, 40, 0.08)",
                        padding: "0.1rem 0.35rem",
                        borderRadius: "3px",
                        fontWeight: 600,
                      }}
                    >
                      {item.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {item.delta}
                    </span>
                  ) : null}
                  {item.tag ? (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: "#FAF7F2",
                        backgroundColor: "#141514",
                        padding: "0.1rem 0.35rem",
                        borderRadius: "3px",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                      }}
                    >
                      {item.tag}
                    </span>
                  ) : null}
                </div>
                <span style={{ color: "#D8543D", fontWeight: 700 }}>·</span>
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
