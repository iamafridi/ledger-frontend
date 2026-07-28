"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, RefreshCw, X } from "lucide-react";

export interface AlertProps {
  variant?: "error" | "warning" | "success" | "info";
  title?: string;
  children: React.ReactNode;
  onRetry?: () => void;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function Alert({
  variant = "error",
  title,
  children,
  onRetry,
  onClose,
  className = "",
  style,
}: AlertProps) {
  const isError = variant === "error";
  const isWarning = variant === "warning";
  const isSuccess = variant === "success";

  const borderColor = isError
    ? "rgba(216, 84, 61, 0.3)"
    : isWarning
    ? "rgba(216, 84, 61, 0.25)"
    : isSuccess
    ? "var(--line-firm)"
    : "var(--line)";

  const leftBarColor = isError
    ? "#D8543D"
    : isWarning
    ? "#D8543D"
    : isSuccess
    ? "#141514"
    : "#5A5955";

  const bgColor = isError
    ? "rgba(216, 84, 61, 0.07)"
    : isWarning
    ? "rgba(216, 84, 61, 0.05)"
    : isSuccess
    ? "#F4EFE6"
    : "var(--surface)";

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      role="alert"
      className={`alert ${className}`}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.85rem",
        padding: "0.85rem 1.15rem",
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderLeft: `4px solid ${leftBarColor}`,
        borderRadius: "8px",
        fontSize: "0.875rem",
        color: "#141514",
        lineHeight: 1.5,
        ...style,
      }}
    >
      {/* Icon */}
      <div style={{ marginTop: "2px", flexShrink: 0 }}>
        {isError || isWarning ? (
          <AlertTriangle size={18} color="#D8543D" />
        ) : isSuccess ? (
          <CheckCircle2 size={18} color="#141514" />
        ) : (
          <Info size={18} color="#5A5955" />
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title ? (
          <p
            style={{
              margin: "0 0 2px 0",
              fontWeight: 700,
              fontSize: "0.875rem",
              color: "#141514",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </p>
        ) : null}
        <div style={{ margin: 0, color: "#2B2A27" }}>{children}</div>
      </div>

      {/* Action Buttons: Retry and Close */}
      {(onRetry || onClose) && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 8px",
                borderRadius: "4px",
                border: "1px solid var(--line-firm)",
                background: "#FFFFFF",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#141514",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F4EFE6")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
            >
              <RefreshCw size={12} />
              Retry
            </button>
          ) : null}

          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Dismiss alert"
              style={{
                background: "transparent",
                border: "none",
                padding: "2px",
                color: "#8A8780",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#141514")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8A8780")}
            >
              <X size={15} />
            </button>
          ) : null}
        </div>
      )}
    </motion.div>
  );
}
