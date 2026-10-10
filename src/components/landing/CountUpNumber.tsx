"use client";

import React, { useEffect, useRef, useState } from "react";
import { useInView, animate } from "framer-motion";

interface CountUpNumberProps {
  target: number;
  duration?: number;
  isZeroInvariant?: boolean;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function CountUpNumber({
  target,
  duration = 1.8,
  isZeroInvariant = false,
  color,
  className,
  style,
}: CountUpNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [displayValue, setDisplayValue] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    if (!isInView) return;

    if (isZeroInvariant) {
      // For zero invariant: quickly flickers verifying check and locks cleanly onto 0
      const controls = animate(5, 0, {
        duration: 0.9,
        ease: "easeOut",
        onUpdate: (latest) => {
          setDisplayValue(Math.round(latest));
        },
        onComplete: () => {
          setDisplayValue(0);
          setIsCompleted(true);
        },
      });
      return () => controls.stop();
    }

    const controls = animate(0, target, {
      duration,
      ease: [0.16, 1, 0.3, 1], // easeOutExpo
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest));
      },
      onComplete: () => {
        setDisplayValue(target);
        setIsCompleted(true);
      },
    });

    return () => controls.stop();
  }, [isInView, target, duration, isZeroInvariant]);

  return (
    <span
      ref={ref}
      className={className}
      style={{
        fontFamily: "var(--font-mono), monospace",
        fontWeight: 700,
        color: color || "inherit",
        display: "inline-flex",
        alignItems: "baseline",
        gap: "0.25rem",
        ...style,
      }}
    >
      <span>{displayValue}</span>
      {isZeroInvariant && (
        <span
          style={{
            fontSize: "0.45em",
            fontFamily: "var(--font-mono), monospace",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#8FA892",
            border: "1px solid #8FA892",
            padding: "0.15em 0.45em",
            borderRadius: "4px",
            verticalAlign: "middle",
            marginLeft: "0.35rem",
          }}
          title="Strict ledger immutability — zero hard deletes allowed"
        >
          STRICT
        </span>
      )}
    </span>
  );
}
