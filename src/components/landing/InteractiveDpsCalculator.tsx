"use client";

import React, { useState, useMemo } from "react";
import { TrendingUp, Landmark, ShieldCheck } from "lucide-react";
import { playAcousticTick, playVaultClick } from "@/lib/audio";

export function InteractiveDpsCalculator() {
  const [deposit, setDeposit] = useState<number>(15000);
  const [years, setYears] = useState<number>(5);
  const [rate, setRate] = useState<number>(10.5);

  const months = years * 12;
  const monthlyRate = rate / 12 / 100;
  const principal = deposit * months;

  // Compound future value formula for monthly annuity due
  const maturity = useMemo(() => {
    const fv = deposit * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    return Math.round(fv);
  }, [deposit, monthlyRate, months]);

  const profit = maturity - principal;
  const gainPercent = Math.round((profit / principal) * 100);

  // Generate SVG curve points
  const points = useMemo(() => {
    const pts = [];
    const stepMonths = Math.max(1, Math.floor(months / 8));
    for (let m = 0; m <= months; m += stepMonths) {
      const p = deposit * m;
      const v = m === 0 ? 0 : deposit * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) * (1 + monthlyRate);
      pts.push({ m, p, v });
    }
    return pts;
  }, [deposit, monthlyRate, months]);

  const maxVal = maturity * 1.05;
  const svgW = 380;
  const svgH = 140;

  const svgPath = useMemo(() => {
    return points
      .map((pt, i) => {
        const x = (pt.m / months) * svgW;
        const y = svgH - (pt.v / maxVal) * svgH;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [points, months, maxVal]);

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
      {/* Top Gold Header */}
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
            DPS &amp; FDR COMPOUND INTEREST ENGINE
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#C99B52", fontSize: "0.72rem", fontFamily: "var(--font-mono)" }}>
          <TrendingUp size={13} />
          <span>MONTHLY ANNUITY DUE MATH</span>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
          padding: "1.5rem",
        }}
      >
        {/* Left: Interactive Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Monthly Deposit Slider */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.76rem", color: "#827F76", fontFamily: "var(--font-mono)" }}>MONTHLY SAVINGS DEPOSIT</span>
              <strong style={{ fontSize: "1.15rem", fontFamily: "var(--font-mono)", color: "#FFFDF7" }}>
                ৳ {deposit.toLocaleString()}
                <span style={{ fontSize: "0.72rem", color: "#827F76" }}>/mo</span>
              </strong>
            </div>
            <input
              type="range"
              min={2000}
              max={100000}
              step={1000}
              value={deposit}
              onChange={(e) => {
                playAcousticTick(1600 + Number(e.target.value) / 100, 0.015, 0.02);
                setDeposit(Number(e.target.value));
              }}
              style={{
                width: "100%",
                accentColor: "#C99B52",
                cursor: "pointer",
              }}
            />
          </div>

          {/* Tenure Preset Buttons */}
          <div>
            <span style={{ fontSize: "0.74rem", color: "#827F76", fontFamily: "var(--font-mono)", display: "block", marginBottom: "0.4rem" }}>
              PLAN TENURE &amp; ANNUAL PROFIT RATE
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
              {[
                { y: 3, r: 9.5, label: "3 Yrs (9.5%)" },
                { y: 5, r: 10.5, label: "5 Yrs (10.5%)" },
                { y: 10, r: 11.5, label: "10 Yrs (11.5%)" },
              ].map((item) => (
                <button
                  key={item.y}
                  type="button"
                  onClick={() => {
                    playAcousticTick(1800, 0.02);
                    setYears(item.y);
                    setRate(item.r);
                    playVaultClick();
                  }}
                  style={{
                    padding: "0.5rem 0.4rem",
                    borderRadius: "8px",
                    border: years === item.y ? "1px solid #C99B52" : "1px solid #282a28",
                    backgroundColor: years === item.y ? "rgba(201, 155, 82, 0.18)" : "#141614",
                    color: years === item.y ? "#E5C287" : "#827F76",
                    fontSize: "0.74rem",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={{ padding: "0.75rem", backgroundColor: "#141614", borderRadius: "8px", border: "1px solid #232623" }}>
              <span style={{ fontSize: "0.65rem", color: "#827F76", fontFamily: "var(--font-mono)", display: "block" }}>TOTAL PRINCIPAL</span>
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#FFFDF7", fontFamily: "var(--font-mono)" }}>
                ৳ {principal.toLocaleString()}
              </span>
            </div>
            <div style={{ padding: "0.75rem", backgroundColor: "#141614", borderRadius: "8px", border: "1px solid #232623" }}>
              <span style={{ fontSize: "0.65rem", color: "#827F76", fontFamily: "var(--font-mono)", display: "block" }}>COMPOUND PROFIT</span>
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#4ADE80", fontFamily: "var(--font-mono)" }}>
                + ৳ {profit.toLocaleString()} ({gainPercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Dynamic Growth Curve & Guaranteed Maturity Card */}
        <div
          style={{
            backgroundColor: "#141614",
            borderRadius: "12px",
            border: "1px solid #282a28",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: "0.68rem", color: "#827F76", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              GUARANTEED MATURITY SUM
            </span>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#C99B52", fontFamily: "var(--font-mono)", marginTop: "0.2rem" }}>
              ৳ {maturity.toLocaleString()}
              <span style={{ fontSize: "1.1rem", opacity: 0.6 }}>.00</span>
            </div>
          </div>

          {/* SVG Trajectory Chart */}
          <div style={{ width: "100%", height: "110px", margin: "0.75rem 0", position: "relative" }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="dpsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C99B52" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#C99B52" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${svgPath} L ${svgW} ${svgH} L 0 ${svgH} Z`} fill="url(#dpsGrad)" />
              <path d={svgPath} fill="none" stroke="#C99B52" strokeWidth="2.5" />
            </svg>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#827F76", fontFamily: "var(--font-mono)" }}>
            <span>Month 1: ৳ {deposit.toLocaleString()}</span>
            <span>Month {months}: ৳ {maturity.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
