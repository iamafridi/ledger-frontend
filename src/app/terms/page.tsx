import Link from "next/link";
import { ArrowLeft, Shield, Scale, FileText, CheckCircle2 } from "lucide-react";
import { FloatingNav } from "@/components/floating-nav";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Terms of Service — Ledger Double-Entry Platform",
  description: "Standard terms of service, mathematical invariants, and multi-tenant data governance for the Ledger accounting platform.",
};

export default function TermsPage() {
  return (
    <>
      <FloatingNav />
      <main id="main" className="wrap" style={{ maxWidth: "56rem", marginInline: "auto", paddingBlock: "calc(var(--s-7) + 2rem) var(--s-8)" }}>
        <div style={{ marginBottom: "var(--s-4)" }}>
          <Link
            href="/"
            className="btn btn--quiet btn--sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-2)" }}
          >
            <ArrowLeft size={14} />
            <span>Back to overview</span>
          </Link>
        </div>

        <header className="stack" style={{ gap: "var(--s-2)", borderBottom: "1px solid var(--border)", paddingBottom: "var(--s-4)", marginBottom: "var(--s-5)" }}>
          <p className="eyebrow">Legal &amp; Regulatory Invariants · Section 01</p>
          <h1 style={{ fontSize: "clamp(2rem, 3.5vw, 2.75rem)", fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>
            Terms of Service &amp; Accounting Agreement
          </h1>
          <p className="muted" style={{ fontSize: "var(--t-sm)", margin: 0 }}>
            Effective Date: October 2026 · Jurisdiction: Dhaka, Bangladesh · Canonical Revision 2.4
          </p>
        </header>

        <article className="stack" style={{ gap: "var(--s-5)", fontSize: "var(--t-sm)", lineHeight: 1.75 }}>
          <div className="panel" style={{ padding: "var(--s-4)", background: "rgba(216, 84, 61, 0.03)", borderColor: "rgba(216, 84, 61, 0.25)" }}>
            <div className="row" style={{ gap: "var(--s-3)", alignItems: "flex-start" }}>
              <Scale size={20} color="#D8543D" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ display: "block", color: "var(--ink)", marginBottom: "4px" }}>
                  The Invariant Double-Entry Guarantee
                </strong>
                <p style={{ margin: 0, color: "var(--ink-muted)" }}>
                  By operating Ledger, you acknowledge that every financial mutation is permanently governed by the Single Write Path double-entry ledger rule. Debits equal credits strictly at integer paisa resolution. Unbalanced mutations are rejected deterministically by the accounting kernel.
                </p>
              </div>
            </div>
          </div>

          <section className="stack" style={{ gap: "var(--s-2)" }}>
            <h2 style={{ fontSize: "var(--t-lg)", fontWeight: 700, margin: 0 }}>1. Mathematical Certainty &amp; Zero Floating-Point Drift</h2>
            <p className="muted" style={{ margin: 0 }}>
              The software executes arithmetic using 40-digit decimal precision and integer paisa storage in MongoDB. Under no circumstance does the platform calculate balances using IEEE-754 floating-point representations. You agree that system reports (Trial Balance, Balance Sheet, Profit &amp; Loss) are deterministic outputs of posted journal vouchers.
            </p>
          </section>

          <section className="stack" style={{ gap: "var(--s-2)" }}>
            <h2 style={{ fontSize: "var(--t-lg)", fontWeight: 700, margin: 0 }}>2. Statutory NBR Form 9.1 &amp; Tax Compliance</h2>
            <p className="muted" style={{ margin: 0 }}>
              VAT returns, Mushak 6.3 tax invoices, and Mushak 6.6 withholding certificates are generated according to the National Board of Revenue (NBR) Value Added Tax and Supplementary Duty Act 2012. You are responsible for ensuring that your company Business Identification Number (BIN) and withholding tax deductee data are accurate prior to locking monthly returns.
            </p>
          </section>

          <section className="stack" style={{ gap: "var(--s-2)" }}>
            <h2 style={{ fontSize: "var(--t-lg)", fontWeight: 700, margin: 0 }}>3. Monotonic Numbering &amp; Zero Hard Deletes</h2>
            <p className="muted" style={{ margin: 0 }}>
              In accordance with international accounting standards, posted legal documents (Tax Invoices, Bills, Debit/Credit Vouchers, and Fiscal Years) cannot be physically deleted. Any correction is executed via an atomic reversal journal entry referencing the original document with an explicit audit justification reason.
            </p>
          </section>

          <section className="stack" style={{ gap: "var(--s-2)" }}>
            <h2 style={{ fontSize: "var(--t-lg)", fontWeight: 700, margin: 0 }}>4. Multi-Tenant Tenancy &amp; Data Sovereignty</h2>
            <p className="muted" style={{ margin: 0 }}>
              Organization data is logically and cryptographically partitioned by Organization ID (`org_id`). No cross-tenant data leakage is permitted. Organizations maintain complete ownership of their chart of accounts, vouchers, customer master data, and inventory valuations.
            </p>
          </section>

          <section className="stack" style={{ gap: "var(--s-2)" }}>
            <h2 style={{ fontSize: "var(--t-lg)", fontWeight: 700, margin: 0 }}>5. Limitation of Liability</h2>
            <p className="muted" style={{ margin: 0 }}>
              Ledger provides autonomous calculation verification and double-entry consistency, but does not provide licensed chartered accountancy legal opinions. Final statutory filing signatures and tax remittances remain the sole responsibility of your company&rsquo;s appointed Chief Financial Officer or auditor.
            </p>
          </section>

          <div className="panel" style={{ padding: "var(--s-4)", marginTop: "var(--s-3)" }}>
            <div className="row-between" style={{ alignItems: "center" }}>
              <div>
                <p className="label" style={{ margin: 0 }}>Inquiries &amp; Governance</p>
                <p className="note" style={{ margin: "4px 0 0 0" }}>legal@ledgerfinancial.com · Gulshan Avenue, Dhaka 1212</p>
              </div>
              <Link href="/privacy" className="btn btn--quiet btn--sm">
                View Privacy Policy →
              </Link>
            </div>
          </div>
        </article>
      </main>
      <Footer variant="marketing" />
    </>
  );
}
