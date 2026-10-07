"use client";

import { useState } from "react";
import { Database, CheckCircle2, Building2, Laptop, ShoppingBag } from "lucide-react";
import { api, ApiError } from "@/lib/api";

interface DemoSeederBannerProps {
  sectionName?: string;
  onSeeded?: () => void;
  compact?: boolean;
}

type ScenarioKey = "FMCG" | "TECH" | "RETAIL";

const SCENARIOS: { key: ScenarioKey; label: string; desc: string; icon: typeof Building2 }[] = [
  {
    key: "FMCG",
    label: "FMCG & Wholesale",
    desc: "Wholesale packaging, paper suppliers, delivery van, logistics staff",
    icon: Building2,
  },
  {
    key: "TECH",
    label: "Tech & SaaS Agency",
    desc: "Retainers, cloud SLA, server hardware, software engineering payroll",
    icon: Laptop,
  },
  {
    key: "RETAIL",
    label: "Flagship Retail Store",
    desc: "High volume POS, retail catalog inventory, counter staff & suppliers",
    icon: ShoppingBag,
  },
];

export function DemoSeederBanner({ sectionName, onSeeded, compact = false }: DemoSeederBannerProps) {
  const [busy, setBusy] = useState(false);
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>("FMCG");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async (scenarioToSeed?: ScenarioKey) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    const chosenScenario = scenarioToSeed ?? activeScenario;
    try {
      const res = await api<{
        seeded: {
          period: string;
          parties: number;
          items: number;
          invoices: number;
          bills: number;
          assets: number;
          staff: number;
          runs: number;
          loans: number;
        };
      }>("/demo/scenario", {
        method: "POST",
        body: JSON.stringify({ scenario: chosenScenario }),
      });

      setSuccess(
        `Loaded [${chosenScenario}] preset: ${res.seeded.parties} parties, ${res.seeded.items} items, ${res.seeded.invoices} invoices, ${res.seeded.bills} bills, ${res.seeded.assets} assets, and ${res.seeded.staff} staff in ${res.seeded.period}!`
      );
      if (onSeeded) {
        onSeeded();
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to seed demo data.");
    } finally {
      setBusy(false);
    }
  };

  if (compact) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--s-3)",
          padding: "var(--s-3) var(--s-4)",
          borderRadius: "8px",
          backgroundColor: "#F4EFE6",
          border: "1px solid #D8D2C5",
          fontSize: "var(--t-xs)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
          <Database size={14} style={{ color: "#D8543D", flexShrink: 0 }} />
          <span style={{ color: "#141514" }}>Need scenario data {sectionName ? `for ${sectionName.toLowerCase()}` : "to test"}?</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => handleSeed("FMCG")}
            disabled={busy}
            className="btn btn--sm"
            style={{
              fontSize: "11px",
              padding: "0.3rem 0.6rem",
              backgroundColor: "#141514",
              color: "#FFFDF7",
              borderRadius: "5px",
              fontWeight: 600,
            }}
          >
            {busy ? "Seeding…" : "FMCG"}
          </button>
          <button
            type="button"
            onClick={() => handleSeed("TECH")}
            disabled={busy}
            className="btn btn--sm"
            style={{
              fontSize: "11px",
              padding: "0.3rem 0.6rem",
              backgroundColor: "#141514",
              color: "#FFFDF7",
              borderRadius: "5px",
              fontWeight: 600,
            }}
          >
            Tech
          </button>
          <button
            type="button"
            onClick={() => handleSeed("RETAIL")}
            disabled={busy}
            className="btn btn--sm"
            style={{
              fontSize: "11px",
              padding: "0.3rem 0.6rem",
              backgroundColor: "#141514",
              color: "#FFFDF7",
              borderRadius: "5px",
              fontWeight: 600,
            }}
          >
            Retail
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "var(--s-5)",
        borderRadius: "8px",
        backgroundColor: "#FFFFFF",
        border: "1px solid #D8D2C5",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-4)",
        marginBlock: "var(--s-4)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--s-4)", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "var(--s-3)", alignItems: "flex-start" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "#F4EFE6",
              border: "1px solid #E5E0D5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#D8543D",
              flexShrink: 0,
            }}
          >
            <Database size={18} />
          </div>
          <div>
            <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "var(--t-sm)", fontWeight: 700, color: "#141514" }}>
              Live Real-Case Benchmark Data Available
            </h4>
            <p style={{ margin: 0, fontSize: "var(--t-xs)", color: "#6E6A62" }}>
              Choose an industry archetype to populate {sectionName ? `the ${sectionName} module` : "every business section"} with verified corporate transactions.
            </p>
          </div>
        </div>
      </div>

      {/* Scenario Selection Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0.75rem",
        }}
      >
        {SCENARIOS.map((item) => {
          const Icon = item.icon;
          const isSelected = activeScenario === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveScenario(item.key)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "0.35rem",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: isSelected ? "1.5px solid #141514" : "1px solid #E5E0D5",
                backgroundColor: isSelected ? "#FAF7F2" : "#FFFFFF",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%" }}>
                <Icon size={16} style={{ color: isSelected ? "#D8543D" : "#6E6A62" }} />
                <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#141514" }}>{item.label}</span>
                {isSelected && (
                  <span
                    style={{
                      marginLeft: "auto",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "#D8543D",
                    }}
                  />
                )}
              </div>
              <span style={{ fontSize: "11px", color: "#6E6A62", lineHeight: "1.35" }}>{item.desc}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <span style={{ fontSize: "11px", color: "#8E887E" }}>
          Active Preset: <strong style={{ color: "#141514" }}>{SCENARIOS.find((s) => s.key === activeScenario)?.label}</strong>
        </span>

        <button
          type="button"
          onClick={() => handleSeed(activeScenario)}
          disabled={busy}
          className="btn btn--primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            backgroundColor: "#141514",
            color: "#FFFDF7",
            borderRadius: "8px",
            fontWeight: 600,
            padding: "0.55rem 1.1rem",
            fontSize: "var(--t-xs)",
          }}
        >
          {busy ? (
            "Seeding Preset…"
          ) : success ? (
            <>
              <CheckCircle2 size={14} /> Preset Seeded!
            </>
          ) : (
            <>
              <Database size={14} /> Seed {SCENARIOS.find((s) => s.key === activeScenario)?.label}
            </>
          )}
        </button>
      </div>

      {success && (
        <p style={{ margin: 0, fontSize: "var(--t-xs)", color: "#141514", fontWeight: 600 }}>
          <span style={{ color: "#D8543D" }}>✓</span> {success}
        </p>
      )}

      {error && (
        <p style={{ margin: 0, fontSize: "var(--t-xs)", color: "#D8543D", fontWeight: 600 }}>
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

