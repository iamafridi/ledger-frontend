import React from "react";
import { Check, ShieldCheck, Lock, FileCheck } from "lucide-react";

export type SealType = "POSTED" | "AUDITED" | "NBR_9_1" | "LOCKED";

interface SealProps {
  type: SealType;
  label?: string;
  reference?: string;
  className?: string;
  style?: React.CSSProperties;
}

const SEAL_CONFIG: Record<
  SealType,
  {
    defaultLabel: string;
    sublabel: string;
    color: string;
    icon: (size: number) => React.ReactNode;
  }
> = {
  POSTED: {
    defaultLabel: "POSTED & BALANCED",
    sublabel: "INVARIANT I1 SATISFIED",
    color: "var(--ink)",
    icon: (s) => <Check size={s} strokeWidth={2.5} />,
  },
  AUDITED: {
    defaultLabel: "AUDIT LOGGED",
    sublabel: "APPEND-ONLY I6",
    color: "var(--accent)",
    icon: (s) => <ShieldCheck size={s} strokeWidth={2} />,
  },
  NBR_9_1: {
    defaultLabel: "STATUTORY VAT 9.1",
    sublabel: "NBR BANGLADESH COMPLIANT",
    color: "var(--ink)",
    icon: (s) => <FileCheck size={s} strokeWidth={2} />,
  },
  LOCKED: {
    defaultLabel: "PERIOD CLOSED",
    sublabel: "NON-MUTABLE FISCAL BOUNDARY",
    color: "var(--accent)",
    icon: (s) => <Lock size={s} strokeWidth={2} />,
  },
};

export function Seal({ type, label, reference, className = "", style = {} }: SealProps) {
  const config = SEAL_CONFIG[type];
  const displayLabel = label || config.defaultLabel;

  return (
    <div
      className={`seal-stamp ${type === "AUDITED" || type === "LOCKED" ? "seal-stamp--audited" : "seal-stamp--posted"} ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        ...style,
      }}
      title={`${displayLabel} — ${config.sublabel}${reference ? ` [${reference}]` : ""}`}
    >
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        {config.icon(12)}
      </span>
      <span style={{ letterSpacing: "0.08em" }}>{displayLabel}</span>
      {reference && (
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            opacity: 0.75,
            fontSize: "0.625rem",
            marginLeft: "2px",
          }}
        >
          #{reference}
        </span>
      )}
    </div>
  );
}
