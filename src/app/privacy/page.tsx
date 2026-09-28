import Link from "next/link";
import { ArrowLeft, Lock, Database, ShieldCheck, EyeOff } from "lucide-react";
import { FloatingNav } from "@/components/floating-nav";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Privacy Policy & Data Sovereignty — Ledger",
  description: "Privacy practices, security architecture, data retention rules, and multi-tenant isolation policies for the Ledger platform.",
};

export default function PrivacyPage() {
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
          <p className="eyebrow">Data Sovereignty &amp; Security · Section 02</p>
          <h1 style={{ fontSize: "clamp(2rem, 3.5vw, 2.75rem)", fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>
            Privacy Policy &amp; Data Security Architecture
          </h1>
          <p className="muted" style={{ fontSize: "var(--t-sm)", margin: 0 }}>
            Updated: October 2026 · Confidential Financial Protection Standards
          </p>
        </header>

        <article className="stack" style={{ gap: "var(--s-5)", fontSize: "var(--t-sm)", lineHeight: 1.75 }}>
          <div className="panel" style={{ padding: "var(--s-4)", background: "rgba(20, 21, 20, 0.02)" }}>
            <div className="row" style={{ gap: "var(--s-3)", alignItems: "flex-start" }}>
              <Lock size={20} color="#D8543D" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ display: "block", color: "var(--ink)", marginBottom: "4px" }}>
                  Zero External Ad Trackers · Absolute Financial Privacy
                </strong>
                <p style={{ margin: 0, color: "var(--ink-muted)" }}>
                  Ledger contains zero ad tracking scripts, zero surveillance telemetry, and zero behavioral monetization cookies. All financial records, bills, receipts, and employee payroll slips belong exclusively to your organization tenant.
                </p>
              </div>
            </div>
          </div>

          <section className="stack" style={{ gap: "var(--s-2)" }}>
            <h2 style={{ fontSize: "var(--t-lg)", fontWeight: 700, margin: 0 }}>1. What Data Is Collected</h2>
            <p className="muted" style={{ margin: 0 }}>
              We store exclusively the data necessary to maintain auditable double-entry books:
            </p>
            <ul style={{ margin: "var(--s-1) 0 0 var(--s-4)", padding: 0, color: "var(--ink-muted)" }}>
              <li><strong>Authentication credentials:</strong> Email address and encrypted password hashes managed via secure Firebase token infrastructure.</li>
              <li><strong>Ledger records:</strong> Accounts, journal entries, invoice line snapshots, payments, and receipts.</li>
              <li><strong>Statutory tax filings:</strong> VAT 9.1 return figures and withholding Mushak certificates.</li>
              <li><strong>Audit trail metadata:</strong> Operator user ID, client IP address, and mutation timestamp to comply with anti-fraud auditing requirements.</li>
            </ul>
          </section>

          <section className="stack" style={{ gap: "var(--s-2)" }}>
            <h2 style={{ fontSize: "var(--t-lg)", fontWeight: 700, margin: 0 }}>2. Cryptographic Storage &amp; Isolation</h2>
            <p className="muted" style={{ margin: 0 }}>
              Data in transit is secured with TLS 1.3 / HTTPS. Data at rest is encrypted in MongoDB using AES-256 encryption. Database indexes enforce strict tenant partition isolation on all queries (<code>{"{ org_id: current_tenant }"}</code>), guaranteeing no cross-organization data contamination.
            </p>
          </section>

          <section className="stack" style={{ gap: "var(--s-2)" }}>
            <h2 style={{ fontSize: "var(--t-lg)", fontWeight: 700, margin: 0 }}>3. Archival Retention &amp; Legal Compliance</h2>
            <p className="muted" style={{ margin: 0 }}>
              Pursuant to the Companies Act 1994 (Section 181) and National Board of Revenue regulations, books of account must be preserved for a statutory period of not less than 8 fiscal years. Because of this legal requirement, financial vouchers cannot be silently expunged.
            </p>
          </section>

          <section className="stack" style={{ gap: "var(--s-2)" }}>
            <h2 style={{ fontSize: "var(--t-lg)", fontWeight: 700, margin: 0 }}>4. Export &amp; Portability Rights</h2>
            <p className="muted" style={{ margin: 0 }}>
              You retain the unrestricted right to export your complete General Ledger, Chart of Accounts, and Trial Balance in standard RFC-4180 CSV or JSON format at any time without fees or proprietary format locks.
            </p>
          </section>

          <div className="panel" style={{ padding: "var(--s-4)", marginTop: "var(--s-3)" }}>
            <div className="row-between" style={{ alignItems: "center" }}>
              <div>
                <p className="label" style={{ margin: 0 }}>Security Officer</p>
                <p className="note" style={{ margin: "4px 0 0 0" }}>security@ledgerfinancial.com · PGP Fingerprint Available on Request</p>
              </div>
              <Link href="/terms" className="btn btn--quiet btn--sm">
                View Terms of Service →
              </Link>
            </div>
          </div>
        </article>
      </main>
      <Footer variant="marketing" />
    </>
  );
}
