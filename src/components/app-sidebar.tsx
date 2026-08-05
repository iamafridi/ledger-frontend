"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Activity,
  TrendingUp,
  PlusCircle,
  Camera,
  PiggyBank,
  BookOpen,
  FileText,
  RefreshCw,
  Target,
  Lock,
  BarChart3,
  Receipt,
  ShoppingBag,
  Boxes,
  Handshake,
  CreditCard,
  Building2,
  FileSpreadsheet,
  Users,
  Settings,
  ClipboardList,
  ShieldCheck,
  Layers,
  LogOut,
} from "lucide-react";
import { useSession } from "./session-provider";
import { useAuth } from "./auth-provider";
import { api } from "@/lib/api";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  permission: string;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Core & Insights",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: <Activity size={16} />, permission: "dashboard.view" },
      { href: "/insights", label: "Insights", icon: <TrendingUp size={16} />, permission: "insights.view" },
      { href: "/expenses", label: "Expenses", icon: <PlusCircle size={16} />, permission: "expenses.read" },
      { href: "/receipts", label: "Receipt Scanner", icon: <Camera size={16} />, permission: "receipts.scan" },
      { href: "/pockets", label: "Savings Pockets", icon: <PiggyBank size={16} />, permission: "pockets.read" },
      { href: "/modules", label: "Modules Directory", icon: <Layers size={16} />, permission: "dashboard.view" },
    ],
  },
  {
    title: "Double-Entry Books",
    items: [
      { href: "/accounts", label: "Chart of Accounts", icon: <BookOpen size={16} />, permission: "coa.read" },
      { href: "/journals", label: "Journal Entries", icon: <FileText size={16} />, permission: "journals.read" },
      { href: "/recurring", label: "Recurring & Accruals", icon: <RefreshCw size={16} />, permission: "recurring.read" },
      { href: "/budgets", label: "Budgets & Variance", icon: <Target size={16} />, permission: "budgets.read" },
      { href: "/periods", label: "Period Close", icon: <Lock size={16} />, permission: "periods.read" },
      { href: "/reports", label: "Financial Reports", icon: <BarChart3 size={16} />, permission: "reports.view" },
    ],
  },
  {
    title: "Commercial & Trade",
    items: [
      { href: "/sales", label: "Sales & Invoicing", icon: <Receipt size={16} />, permission: "sales.read" },
      { href: "/purchases", label: "Purchases & AP", icon: <ShoppingBag size={16} />, permission: "purchases.read" },
      { href: "/inventory", label: "Warehouse Stock", icon: <Boxes size={16} />, permission: "inventory.read" },
      { href: "/advances", label: "Party Advances", icon: <Handshake size={16} />, permission: "advances.read" },
    ],
  },
  {
    title: "Treasury & Compliance",
    items: [
      { href: "/banking", label: "Bank & Cash", icon: <CreditCard size={16} />, permission: "banking.read" },
      { href: "/assets", label: "Fixed Assets", icon: <Building2 size={16} />, permission: "assets.read" },
      { href: "/tax", label: "Statutory VAT 9.1", icon: <FileSpreadsheet size={16} />, permission: "tax.read" },
      { href: "/staff", label: "Staff & Payroll", icon: <Users size={16} />, permission: "staff.read" },
      { href: "/audit", label: "Audit Trail", icon: <ShieldCheck size={16} />, permission: "audit.read" },
    ],
  },
  {
    title: "Master Data & Setup",
    items: [
      { href: "/parties", label: "Parties", icon: <Building2 size={16} />, permission: "masterdata.read" },
      { href: "/items", label: "Items & SKUs", icon: <Boxes size={16} />, permission: "masterdata.read" },
      { href: "/catalogs", label: "Price Catalogs", icon: <ClipboardList size={16} />, permission: "masterdata.read" },
      { href: "/segments", label: "Cost Centers & Segments", icon: <Layers size={16} />, permission: "segments.read" },
      { href: "/settings", label: "Settings", icon: <Settings size={16} />, permission: "settings.read" },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { can } = useSession();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [seeding, setSeeding] = useState(false);

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      await api("/demo/enterprise", { method: "POST" });
      window.location.reload();
    } catch (err) {
      alert("Could not seed demo data: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSeeding(false);
    }
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <>
      {/* Mobile Top Bar with Hamburger (AUD-NAV-01) */}
      <div
        className="show-mobile"
        style={{
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--s-2) var(--s-4)",
          background: "var(--surface)",
          borderBottom: "1px solid var(--line)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", textDecoration: "none" }}>
          <span style={{ fontWeight: 900, fontSize: "1.25rem", color: "var(--ink)" }}>LEDGER</span>
          <span className="chip chip--ok" style={{ fontSize: "0.625rem" }}>Live</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="btn btn--sm btn--quiet"
          style={{ minWidth: "44px", minHeight: "44px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem" }}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? "✕ Close" : "☰ Menu"}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 45,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {/* Main Collapsible Sidebar */}
      <aside
        style={{
          width: collapsed ? "72px" : "260px",
          minWidth: collapsed ? "72px" : "260px",
          background: "#FAF7F2",
          borderRight: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "sticky",
          top: 0,
          zIndex: 46,
          transition: "width 200ms ease, min-width 200ms ease",
          userSelect: "none",
        }}
        className={mobileOpen ? "app-sidebar-mobile-open" : "hide-mobile"}
      >
        {/* Sidebar Header & Collapse Icon */}
        <div
          style={{
            padding: "var(--s-3) var(--s-4)",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            minHeight: "56px",
          }}
        >
          {!collapsed ? (
            <Link
              href="/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                textDecoration: "none",
                color: "#141514",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "7px",
                  backgroundColor: "#141514",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "#FAF7F2", fontWeight: 800, fontSize: "0.9rem" }}>L</span>
              </div>
              <span style={{ fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.03em", color: "#141514" }}>ledger</span>
            </Link>
          ) : null}

          {/* Sidebar Collapse / Expand Toggle Button (Desktop) & Close Button (Mobile) */}
          <button
            type="button"
            onClick={() => {
              if (mobileOpen) {
                setMobileOpen(false);
              } else {
                setCollapsed(!collapsed);
              }
            }}
            title={mobileOpen ? "Close menu" : collapsed ? "Expand sidebar menu" : "Collapse sidebar menu"}
            aria-label={mobileOpen ? "Close menu" : collapsed ? "Expand sidebar menu" : "Collapse sidebar menu"}
            style={{
              background: "#FFFFFF",
              border: "1px solid #D8D2C5",
              color: "#5A5955",
              minWidth: "32px",
              minHeight: "32px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "0.85rem",
              transition: "all var(--fast) var(--ease)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#141514";
              e.currentTarget.style.borderColor = "#141514";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#5A5955";
              e.currentTarget.style.borderColor = "#D8D2C5";
            }}
          >
            {mobileOpen ? "✕" : collapsed ? "»" : "«"}
          </button>
        </div>

        {/* Quick Route Filter when Expanded */}
        {!collapsed ? (
          <div style={{ padding: "var(--s-2) var(--s-3)", borderBottom: "1px solid var(--line)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#FFFFFF",
                border: "1px solid var(--line)",
                borderRadius: "6px",
                padding: "5px 8px",
              }}
            >
              <input
                type="text"
                placeholder="Jump to module..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#141514",
                  fontSize: "0.78rem",
                  width: "100%",
                }}
              />
              {searchFilter ? (
                <button
                  type="button"
                  onClick={() => setSearchFilter("")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#8A8780",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  title="Clear filter"
                >
                  ✕
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
                  }}
                  className="hotkey-pill"
                  style={{ cursor: "pointer", border: "1px solid var(--line-firm)", background: "var(--surface)" }}
                  title="Open Command Palette (⌘K)"
                >
                  ⌘K
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* Scrollable Navigation Groups */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "var(--s-3) var(--s-2)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--s-4)",
          }}
        >
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => {
              if (!can(item.permission)) return false;
              if (!searchFilter.trim()) return true;
              const q = searchFilter.toLowerCase();
              return item.label.toLowerCase().includes(q) || item.href.toLowerCase().includes(q);
            });
            if (visibleItems.length === 0) return null;

            const isGroupCollapsed = !searchFilter.trim() && !!collapsedGroups[group.title];

            return (
              <div key={group.title} className="stack" style={{ gap: "2px" }}>
                {!collapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      padding: "var(--s-1) var(--s-3)",
                      cursor: "pointer",
                      textAlign: "left",
                      borderRadius: "4px",
                    }}
                    title="Toggle category"
                  >
                    <span
                      className="label"
                      style={{
                        fontSize: "0.625rem",
                        color: "#8A8780",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontWeight: 600,
                      }}
                    >
                      {group.title}
                    </span>
                    <span style={{ fontSize: "0.6rem", color: "#8A8780" }}>
                      {isGroupCollapsed ? "▸" : "▾"}
                    </span>
                  </button>
                ) : (
                  <div style={{ height: "1px", background: "var(--line)", marginBlock: "var(--s-2)" }} />
                )}

                {!isGroupCollapsed &&
                  visibleItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--s-3)",
                          padding: collapsed ? "var(--s-2) 0" : "0.45rem var(--s-3)",
                          justifyContent: collapsed ? "center" : "flex-start",
                          borderRadius: "6px",
                          textDecoration: "none",
                          fontSize: "0.85rem",
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? "#FFFDF7" : "#5A5955",
                          background: isActive ? "#141514" : "transparent",
                          border: `1px solid ${isActive ? "#141514" : "transparent"}`,
                          transition: "all var(--fast) var(--ease)",
                        }}
                      >
                        <span style={{ fontSize: "1rem", lineHeight: 1, color: isActive ? "#FFFDF7" : "#5A5955" }}>{item.icon}</span>
                        {!collapsed ? <span>{item.label}</span> : null}
                      </Link>
                    );
                  })}
              </div>
            );
          })}
        </div>

        {/* Quick Demo Data Trigger */}
        {!collapsed ? (
          <div style={{ padding: "var(--s-2) var(--s-3)", borderTop: "1px solid var(--line)", flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleSeedDemo}
              disabled={seeding}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "7px 10px",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: 600,
                fontFamily: "var(--font-mono), monospace",
                background: "#F4EFE6",
                border: "1px solid #D8D2C5",
                color: "#141514",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {seeding ? "Seeding Real Data…" : "Seed 25 Benchmark Cases"}
            </button>
          </div>
        ) : null}

        {/* Bottom User Account Widget */}
        <div
          style={{
            padding: "var(--s-3)",
            borderTop: "1px solid var(--line)",
            background: "#F4EFE6",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            gap: "var(--s-2)",
            flexShrink: 0,
          }}
        >
          {!collapsed ? (
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <span className="mono" style={{ fontSize: "var(--t-xs)", fontWeight: 700, color: "#141514", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.email || "Signed In"}
              </span>
              <span className="label" style={{ fontSize: "0.625rem", color: "#D8543D" }}>
                Verified Session
              </span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={async () => {
              try {
                await signOut();
                window.location.href = "/login?signedOut=true";
              } catch {
                window.location.href = "/login?signedOut=true";
              }
            }}
            title="Sign out of ledger session"
            aria-label="Sign out"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#FFFFFF",
              border: "1px solid #D8D2C5",
              color: "#5A5955",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#D8543D";
              e.currentTarget.style.borderColor = "#D8543D";
              e.currentTarget.style.backgroundColor = "#FDF4F2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#5A5955";
              e.currentTarget.style.borderColor = "#D8D2C5";
              e.currentTarget.style.backgroundColor = "#FFFFFF";
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  );
}
