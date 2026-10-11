"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useSession } from "./session-provider";

/**
 * Every destination, paired with the permission the API requires to use it.
 *
 * The permission is stated here rather than inferred from a role so this list
 * cannot drift from `core/permissions.ts` on the server by having one of them
 * re-seeded: a link appears if and only if the caller's own permission list —
 * read from the database on sign-in — contains the code below.
 */
const LINKS = [
  { href: "/dashboard", label: "Dashboard", permission: "dashboard.view" },
  { href: "/expenses", label: "Expenses", permission: "expenses.read" },
  { href: "/receipts", label: "Receipts", permission: "receipts.scan" },
  { href: "/pockets", label: "Pockets", permission: "pockets.read" },
  { href: "/insights", label: "Insights", permission: "insights.view" },
  // The books. Ordered the way an accountant opens them: the chart first,
  // because every other screen resolves its account codes against it.
  { href: "/accounts", label: "Accounts", permission: "coa.read" },
  // Master data, in the order documents are written: the parties you trade
  // with, the items you trade, then the catalogs their lines draw on.
  { href: "/parties", label: "Parties", permission: "masterdata.read" },
  { href: "/items", label: "Items", permission: "masterdata.read" },
  { href: "/catalogs", label: "Catalogs", permission: "masterdata.read" },
  // The documents themselves, in the order money moves: what you billed, what
  // arrived, and what is still owed.
  { href: "/sales", label: "Sales", permission: "sales.read" },
  { href: "/purchases", label: "Purchases", permission: "purchases.read" },
  // What the buying and selling documents leave on a shelf, and what it is
  // worth. After Purchases, because stock arrives by being bought.
  { href: "/inventory", label: "Stock", permission: "inventory.read" },
  // What the organisation owns and writes down over time. After Stock, because
  // both answer "what is on the balance sheet that is not money".
  { href: "/assets", label: "Assets", permission: "assets.read" },
  // Money a party is holding with us. After the documents that create it,
  // because an advance is what a receipt or payment left unclaimed.
  { href: "/advances", label: "Advances", permission: "advances.read" },
  // Where the money actually sits: the accounts it is in, and what the bank
  // says about them. After the documents, because that is the order money moves.
  { href: "/banking", label: "Banking", permission: "banking.read" },
  // What the documents above produced: the tax on them, and what is owed to the
  // tax office rather than to a counterparty.
  { href: "/tax", label: "Tax", permission: "tax.read" },
  // People who work for the organisation: their master, their loans and the
  // monthly payroll runs that pay them.
  { href: "/staff", label: "Staff", permission: "staff.read" },
  { href: "/journals", label: "Journals", permission: "journals.read" },
  { href: "/periods", label: "Periods", permission: "periods.read" },
  { href: "/reports", label: "Reports", permission: "reports.view" },
  { href: "/settings", label: "Settings", permission: "settings.read" },
] as const;

/**
 * Navigation. Identity and sign-out live in the account bar below, so this row
 * has one job.
 *
 * Ten destinations do not fit across a 390px screen, and a horizontally
 * scrolling strip hides half of them behind a gesture with no affordance. On
 * small screens the same links become a drawer instead: one control, every
 * destination visible at once, each a full-width target.
 *
 * Destinations the caller lacks permission for are removed before rendering —
 * see `LINKS` above.
 */
export function Masthead() {
  const pathname = usePathname();
  const { can } = useSession();
  const [open, setOpen] = useState(false);

  // A role's menu is decided once per session rather than per render, so a
  // VIEWER never sees a link appear and then disappear.
  const links = LINKS.filter((link) => can(link.permission));

  // Close on navigation. Without this the drawer stays open over the page you
  // just asked for.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes it, and the page behind must not scroll while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="masthead">
      <div className="wrap masthead-inner">
        <Link className="wordmark" href="/dashboard">
          Ledger
        </Link>

        {/* The wide-screen nav. Hidden on small screens in favour of the drawer. */}
        <nav className="nav nav--wide" aria-label="Sections">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="drawer-toggle"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close the menu" : "Open the menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={`burger ${open ? "is-open" : ""}`} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="drawer-toggle-text">{open ? "Close" : "Menu"}</span>
        </button>
      </div>

      {/* Rendered rather than unmounted so the panel can transition out. */}
      <div
        className={`drawer-scrim ${open ? "is-open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <nav
        id="mobile-nav"
        className={`drawer ${open ? "is-open" : ""}`}
        aria-label="Sections"
        // While closed the panel is off-screen but still in the document, so its
        // links would otherwise stay in the tab order and be reachable by a
        // keyboard user who cannot see them. `inert` takes the whole subtree out.
        inert={!open}
      >
        <p className="label drawer-heading">Go to</p>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="drawer-link"
            aria-current={pathname === link.href ? "page" : undefined}
          >
            {link.label}
            <span className="drawer-chevron" aria-hidden="true">
              →
            </span>
          </Link>
        ))}
      </nav>
    </header>
  );
}
