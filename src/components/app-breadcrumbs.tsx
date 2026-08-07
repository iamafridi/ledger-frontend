"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, ArrowLeft } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Executive Dashboard",
  accounts: "Chart of Accounts",
  journals: "Journal Entries",
  recurring: "Recurring & Accruals",
  budgets: "Budgets & Variance",
  periods: "Period Close",
  reports: "Financial Reports",
  invoices: "Sales & Invoicing",
  bills: "Purchases & Accounts Payable",
  payments: "Cash & Payments",
  banking: "Bank Reconciliation",
  advances: "Advances & Prepayments",
  inventory: "Inventory & Warehouses",
  assets: "Fixed Assets & Depreciation",
  tax: "Tax & NBR VAT",
  staff: "Payroll & Staff",
  pockets: "Savings Pockets",
  modules: "Modules Directory",
  audit: "Audit Trail",
  settings: "Settings & Users",
};

export function AppBreadcrumbs() {
  const pathname = usePathname();
  const router = useRouter();

  // Break pathname into path segments
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const currentSegment = segments[segments.length - 1];
  const pageTitle = ROUTE_LABELS[currentSegment] || currentSegment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const isDashboard = pathname === "/dashboard";

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className="app-content-wrap"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        paddingBlock: "0.6rem",
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid var(--line)",
        fontSize: "var(--t-xs)",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {/* Back navigation button */}
        {!isDashboard && (
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 2) {
                router.back();
              } else {
                router.push("/dashboard");
              }
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "#F4EFE6",
              border: "1px solid #D8D2C5",
              borderRadius: "6px",
              padding: "0.25rem 0.55rem",
              color: "#141514",
              fontSize: "0.72rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#EBE5D8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#F4EFE6";
            }}
            aria-label="Go back to previous page"
          >
            <ArrowLeft size={13} />
            <span>Back</span>
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#6E6A62" }}>
          <Link
            href="/dashboard"
            style={{
              color: isDashboard ? "#141514" : "#6E6A62",
              textDecoration: "none",
              fontWeight: isDashboard ? 700 : 500,
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#141514")}
            onMouseLeave={(e) => (e.currentTarget.style.color = isDashboard ? "#141514" : "#6E6A62")}
          >
            Ledger
          </Link>

          {!isDashboard && (
            <>
              <ChevronRight size={13} style={{ color: "#9E998E" }} />
              <span style={{ color: "#141514", fontWeight: 700 }}>{pageTitle}</span>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "0.68rem",
            color: "#8E887E",
            letterSpacing: "0.04em",
          }}
        >
          {pathname}
        </span>
      </div>
    </nav>
  );
}
