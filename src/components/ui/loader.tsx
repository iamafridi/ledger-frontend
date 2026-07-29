"use client";

import React from "react";
import { motion } from "framer-motion";

export function Spinner({ size = 28, color = "#D8543D" }: { size?: number; color?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2.5px solid rgba(20, 21, 20, 0.1)`,
        borderTopColor: color,
        display: "inline-block",
      }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageLoader({
  message = "Reconciling Ledger Invariants…",
  subtext = "Verifying double-entry balances and active accounts",
}: {
  message?: string;
  subtext?: string;
}) {
  return (
    <div
      style={{
        minHeight: "45vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.25rem",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <div style={{ position: "relative", width: "48px", height: "48px" }}>
        {/* Outer subtle ring */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid #E5E0D5",
          }}
        />
        {/* Rotating active indicator */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2.5px solid transparent",
            borderTopColor: "#D8543D",
            borderRightColor: "#141514",
          }}
        />
        {/* Center dot */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#141514",
          }}
        />
      </div>

      <div>
        <p
          style={{
            margin: 0,
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "#141514",
            letterSpacing: "-0.01em",
          }}
        >
          {message}
        </p>
        {subtext && (
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "0.8rem",
              color: "#5A5955",
            }}
          >
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

export function SkeletonBox({
  width = "100%",
  height = "20px",
  borderRadius = "6px",
  style,
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}
