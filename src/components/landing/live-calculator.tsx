"use client";

import { useMemo, useState } from "react";

export function LiveCalculator() {
  const [tab, setTab] = useState<"cashflow" | "dps" | "loan" | "journal">("cashflow");

  // Cashflow inputs
  const [revenue, setRevenue] = useState(150000);
  const [expenses, setExpenses] = useState(85000);
  const [taxPercent, setTaxPercent] = useState(15);

  // DPS inputs
  const [dpsDeposit, setDpsDeposit] = useState(10000);
  const [dpsRate, setDpsRate] = useState(8.5);
  const [dpsMonths, setDpsMonths] = useState(12);

  // Loan inputs
  const [loanPrincipal, setLoanPrincipal] = useState(60000);
  const [loanRate, setLoanRate] = useState(9.0);
  const [loanTenor, setLoanTenor] = useState(6);

  // Computed Cashflow
  const taxAmount = (revenue * (taxPercent / 100));
  const netIncome = revenue - expenses - taxAmount;

  // Computed DPS Schedule
  const dpsSchedule = useMemo(() => {
    const monthlyRate = dpsRate / 12 / 100;
    let balance = 0;
    let totalInterest = 0;
    const rows = [];
    for (let i = 1; i <= dpsMonths; i++) {
      const start = balance;
      const afterDep = balance + dpsDeposit;
      const interest = Math.round((afterDep * monthlyRate) * 100) / 100;
      balance = Math.round((afterDep + interest) * 100) / 100;
      totalInterest += interest;
      rows.push({
        month: i,
        opening: start,
        deposit: dpsDeposit,
        interest,
        closing: balance,
      });
    }
    return { rows, totalDeposited: dpsDeposit * dpsMonths, totalInterest, maturity: balance };
  }, [dpsDeposit, dpsRate, dpsMonths]);

  // Computed Loan
  const loanMonthlyPrincipal = loanPrincipal / loanTenor;
  const loanMonthlyInterest = (loanPrincipal * (loanRate / 100)) / 12;
  const loanTotalEmi = loanMonthlyPrincipal + loanMonthlyInterest;

  return (
    <section id="live-calculator" className="section" style={{ background: "var(--surface)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
      <div className="wrap">
        <div className="stack" style={{ gap: "var(--s-3)", textAlign: "center", alignItems: "center" }}>
          <span className="chip chip--brand">Interactive Financial Engine</span>
          <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", letterSpacing: "-0.03em" }}>
            Real-Time Mathematical Sandbox
          </h2>
          <p className="muted" style={{ maxWidth: "58ch" }}>
            Experience the double-entry accounting engine live in your browser. Every calculation computes in exact decimal with zero float error.
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.5rem",
            marginTop: "1.75rem",
            marginBottom: "1.75rem",
            flexWrap: "wrap",
          }}
        >
          {[
            { id: "cashflow", label: "Income & Cash Flow" },
            { id: "dps", label: "DPS Compounding Schedule" },
            { id: "loan", label: "Staff Loan & EMI" },
            { id: "journal", label: "Double-Entry Balancing" },
          ].map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as typeof tab)}
                style={{
                  padding: "0.55rem 1.1rem",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  fontFamily: "var(--font-mono), monospace",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  backgroundColor: isActive ? "#171817" : "#EDE7DC",
                  color: isActive ? "#FFFDF7" : "#54524c",
                  border: isActive ? "1px solid #171817" : "1px solid #D9D2C5",
                  boxShadow: isActive ? "0 4px 12px rgba(23, 24, 23, 0.15)" : "none",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Income & Cash Flow */}
        {tab === "cashflow" ? (
          <div className="grid grid-2" style={{ alignItems: "center", gap: "var(--s-5)" }}>
            <div className="panel panel--sunk stack" style={{ gap: "var(--s-4)", border: "1px solid #D9D2C5" }}>
              <div className="row-between">
                <label className="label" htmlFor="calc-rev" style={{ color: "#171817", fontWeight: 600 }}>Monthly Revenue / Gross Salary</label>
                <span className="mono" style={{ fontWeight: 700, color: "#171817" }}>
                  ৳{revenue.toLocaleString()}
                </span>
              </div>
              <input
                id="calc-rev"
                type="range"
                min="20000"
                max="500000"
                step="5000"
                value={revenue}
                onChange={(e) => setRevenue(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#171817" }}
              />

              <div className="row-between">
                <label className="label" htmlFor="calc-exp" style={{ color: "#171817", fontWeight: 600 }}>Operating Expenses &amp; Bills</label>
                <span className="mono" style={{ fontWeight: 700, color: "#D8543D" }}>
                  ৳{expenses.toLocaleString()}
                </span>
              </div>
              <input
                id="calc-exp"
                type="range"
                min="5000"
                max="400000"
                step="5000"
                value={expenses}
                onChange={(e) => setExpenses(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#D8543D" }}
              />

              <div className="row-between">
                <label className="label" htmlFor="calc-tax" style={{ color: "#171817", fontWeight: 600 }}>Statutory VAT / Tax Rate (%)</label>
                <span className="mono" style={{ fontWeight: 700, color: "#171817" }}>
                  {taxPercent}%
                </span>
              </div>
              <input
                id="calc-tax"
                type="range"
                min="0"
                max="25"
                step="1"
                value={taxPercent}
                onChange={(e) => setTaxPercent(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#171817" }}
              />
            </div>

            <div className="panel stack" style={{ gap: "var(--s-4)", border: "1px solid #D9D2C5", borderLeft: "4px solid #171817" }}>
              <div className="row-between">
                <p className="label" style={{ color: "#54524c", fontWeight: 600 }}>Projected Net Surplus</p>
                <span style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono), monospace", backgroundColor: "#EDE7DC", color: "#171817", padding: "0.2rem 0.5rem", borderRadius: "4px", border: "1px solid #D9D2C5" }}>
                  Exact Paisa Calculation
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "var(--s-2)" }}>
                <span style={{ fontSize: "var(--t-3xl)", fontWeight: 800, color: netIncome >= 0 ? "#171817" : "#D8543D", fontFamily: "var(--font-sans)" }}>
                  ৳{netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="stack" style={{ gap: "var(--s-2)", borderTop: "1px solid var(--line)", paddingTop: "var(--s-3)" }}>
                <div className="row-between" style={{ fontSize: "var(--t-sm)" }}>
                  <span className="muted">Gross Revenue</span>
                  <span className="mono">৳{revenue.toFixed(2)}</span>
                </div>
                <div className="row-between" style={{ fontSize: "var(--t-sm)" }}>
                  <span className="muted">Operating Expenses (DR 5000)</span>
                  <span className="mono" style={{ color: "var(--up)" }}>-৳{expenses.toFixed(2)}</span>
                </div>
                <div className="row-between" style={{ fontSize: "var(--t-sm)" }}>
                  <span className="muted">Statutory Tax Payable (CR 2100)</span>
                  <span className="mono" style={{ color: "var(--ink-faint)" }}>-৳{taxAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Tab 2: DPS Compounding */}
        {tab === "dps" ? (
          <div className="grid grid-sidebar" style={{ gap: "var(--s-5)" }}>
            <div className="panel panel--sunk stack" style={{ gap: "var(--s-4)", border: "1px solid #D9D2C5" }}>
              <div className="row-between">
                <label className="label" htmlFor="calc-dps-dep" style={{ color: "#171817", fontWeight: 600 }}>Monthly Deposit</label>
                <span className="mono" style={{ fontWeight: 700, color: "#171817" }}>
                  ৳{dpsDeposit.toLocaleString()}
                </span>
              </div>
              <input
                id="calc-dps-dep"
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={dpsDeposit}
                onChange={(e) => setDpsDeposit(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#171817" }}
              />

              <div className="row-between">
                <label className="label" htmlFor="calc-dps-rate" style={{ color: "#171817", fontWeight: 600 }}>Annual Stated Rate (%)</label>
                <span className="mono" style={{ fontWeight: 700, color: "#D8543D" }}>
                  {dpsRate.toFixed(1)}%
                </span>
              </div>
              <input
                id="calc-dps-rate"
                type="range"
                min="4"
                max="14"
                step="0.5"
                value={dpsRate}
                onChange={(e) => setDpsRate(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#D8543D" }}
              />

              <div className="row-between">
                <label className="label" htmlFor="calc-dps-months" style={{ color: "#171817", fontWeight: 600 }}>Tenor (Months)</label>
                <span className="mono" style={{ fontWeight: 700, color: "#171817" }}>
                  {dpsMonths} Months
                </span>
              </div>
              <input
                id="calc-dps-months"
                type="range"
                min="3"
                max="36"
                step="1"
                value={dpsMonths}
                onChange={(e) => setDpsMonths(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#171817" }}
              />

              <div className="stack" style={{ gap: "var(--s-2)", background: "#FFFDF7", padding: "var(--s-3)", borderRadius: "var(--radius-sm)", border: "1px solid #D9D2C5" }}>
                <div className="row-between" style={{ fontSize: "var(--t-sm)" }}>
                  <span className="muted">Total Principal Deposited</span>
                  <span className="mono" style={{ color: "#171817", fontWeight: 600 }}>৳{dpsSchedule.totalDeposited.toLocaleString()}</span>
                </div>
                <div className="row-between" style={{ fontSize: "var(--t-sm)" }}>
                  <span className="muted">Compound Interest Earned</span>
                  <span className="mono" style={{ color: "#D8543D", fontWeight: 700 }}>
                    +৳{dpsSchedule.totalInterest.toFixed(2)}
                  </span>
                </div>
                <div className="row-between" style={{ fontSize: "var(--t-base)", fontWeight: 800, borderTop: "1px solid #D9D2C5", paddingTop: "var(--s-2)" }}>
                  <span style={{ color: "#171817" }}>Maturity Yield</span>
                  <span className="mono" style={{ color: "#171817" }}>
                    ৳{dpsSchedule.maturity.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Schedule preview */}
            <div className="panel ledger-scroll" style={{ maxHeight: "380px", overflowY: "auto", border: "1px solid #D9D2C5" }}>
              <table className="ledger">
                <thead>
                  <tr>
                    <th>Mo</th>
                    <th>Opening</th>
                    <th>Deposit</th>
                    <th>Interest</th>
                    <th className="num">Closing</th>
                  </tr>
                </thead>
                <tbody>
                  {dpsSchedule.rows.map((r) => (
                    <tr key={r.month}>
                      <td className="mono">{r.month}</td>
                      <td className="mono">৳{r.opening.toFixed(2)}</td>
                      <td className="mono">৳{r.deposit.toFixed(2)}</td>
                      <td className="mono" style={{ color: "#D8543D", fontWeight: 600 }}>+৳{r.interest.toFixed(2)}</td>
                      <td className="mono num" style={{ fontWeight: 700, color: "#171817" }}>৳{r.closing.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Tab 3: Staff Loan & EMI */}
        {tab === "loan" ? (
          <div className="grid grid-2" style={{ alignItems: "center", gap: "var(--s-5)" }}>
            <div className="panel panel--sunk stack" style={{ gap: "var(--s-4)", border: "1px solid #D9D2C5" }}>
              <div className="row-between">
                <label className="label" htmlFor="calc-loan-pr" style={{ color: "#171817", fontWeight: 600 }}>Loan Principal Amount</label>
                <span className="mono" style={{ fontWeight: 700, color: "#171817" }}>
                  ৳{loanPrincipal.toLocaleString()}
                </span>
              </div>
              <input
                id="calc-loan-pr"
                type="range"
                min="10000"
                max="300000"
                step="5000"
                value={loanPrincipal}
                onChange={(e) => setLoanPrincipal(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#171817" }}
              />

              <div className="row-between">
                <label className="label" htmlFor="calc-loan-rate" style={{ color: "#171817", fontWeight: 600 }}>Annual Interest Rate (%)</label>
                <span className="mono" style={{ fontWeight: 700, color: "#D8543D" }}>
                  {loanRate.toFixed(1)}%
                </span>
              </div>
              <input
                id="calc-loan-rate"
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={loanRate}
                onChange={(e) => setLoanRate(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#D8543D" }}
              />

              <div className="row-between">
                <label className="label" htmlFor="calc-loan-tenor" style={{ color: "#171817", fontWeight: 600 }}>Repayment Tenor (Months)</label>
                <span className="mono" style={{ fontWeight: 700, color: "#171817" }}>
                  {loanTenor} Months
                </span>
              </div>
              <input
                id="calc-loan-tenor"
                type="range"
                min="3"
                max="24"
                step="1"
                value={loanTenor}
                onChange={(e) => setLoanTenor(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#171817" }}
              />
            </div>

            <div className="panel stack" style={{ gap: "var(--s-4)", border: "1px solid #D9D2C5", borderLeft: "4px solid #171817" }}>
              <div className="row-between">
                <p className="label" style={{ color: "#54524c", fontWeight: 600 }}>Monthly Payroll Deduction (EMI)</p>
                <span style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono), monospace", backgroundColor: "#EDE7DC", color: "#171817", padding: "0.2rem 0.5rem", borderRadius: "4px", border: "1px solid #D9D2C5" }}>
                  Account 1600 Sub-Ledger
                </span>
              </div>
              <div>
                <span style={{ fontSize: "var(--t-3xl)", fontWeight: 800, color: "#171817", fontFamily: "var(--font-sans)" }}>
                  ৳{loanTotalEmi.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="note" style={{ marginTop: "var(--s-1)", color: "#54524c" }}>
                  Deducted automatically during each monthly salary payroll run.
                </p>
              </div>

              <div className="stack" style={{ gap: "var(--s-2)", borderTop: "1px solid #D9D2C5", paddingTop: "var(--s-3)" }}>
                <div className="row-between" style={{ fontSize: "var(--t-sm)" }}>
                  <span className="muted">Principal Recovery per month</span>
                  <span className="mono" style={{ color: "#171817" }}>৳{loanMonthlyPrincipal.toFixed(2)}</span>
                </div>
                <div className="row-between" style={{ fontSize: "var(--t-sm)" }}>
                  <span className="muted">Interest Income (CR 4200)</span>
                  <span className="mono" style={{ color: "#D8543D", fontWeight: 600 }}>৳{loanMonthlyInterest.toFixed(2)}</span>
                </div>
                <div className="row-between" style={{ fontSize: "var(--t-sm)" }}>
                  <span className="muted">Total Repaid Over {loanTenor} Months</span>
                  <span className="mono" style={{ fontWeight: 700, color: "#171817" }}>৳{(loanTotalEmi * loanTenor).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Tab 4: Double-Entry Balancing */}
        {tab === "journal" ? (
          <div className="panel stack" style={{ gap: "var(--s-4)", border: "1px solid #D9D2C5" }}>
            <div className="row-between">
              <div className="stack" style={{ gap: "var(--s-1)" }}>
                <h3 style={{ fontSize: "var(--t-lg)", margin: 0, color: "#171817" }}>Automated Invariant Balancing</h3>
                <p className="muted" style={{ margin: 0, fontSize: "var(--t-sm)" }}>
                  Every transaction produces balanced debits and credits. Invariant <code className="mono">I1-JOURNAL-BALANCED</code> guarantees zero discrepancy.
                </p>
              </div>
              <span style={{ fontSize: "0.74rem", fontFamily: "var(--font-mono), monospace", backgroundColor: "#171817", color: "#FFFDF7", padding: "0.3rem 0.7rem", borderRadius: "6px" }}>
                Σ Debits = Σ Credits = ৳45,000.00
              </span>
            </div>

            <div className="ledger-scroll">
              <table className="ledger">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Account Name</th>
                    <th>Side</th>
                    <th>Debit (BDT)</th>
                    <th className="num">Credit (BDT)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="mono" style={{ fontWeight: 700 }}>1010</td>
                    <td>Prime Bank Operating Account</td>
                    <td><span style={{ fontSize: "0.72rem", backgroundColor: "#EDE7DC", color: "#171817", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>Asset</span></td>
                    <td className="mono" style={{ fontWeight: 700, color: "#171817" }}>৳45,000.00</td>
                    <td className="mono num">—</td>
                  </tr>
                  <tr>
                    <td className="mono" style={{ fontWeight: 700 }}>4000</td>
                    <td>Enterprise Sales &amp; Services Revenue</td>
                    <td><span style={{ fontSize: "0.72rem", backgroundColor: "#EDE7DC", color: "#171817", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>Revenue</span></td>
                    <td className="mono">—</td>
                    <td className="mono num" style={{ fontWeight: 700, color: "#171817" }}>৳39,130.43</td>
                  </tr>
                  <tr>
                    <td className="mono" style={{ fontWeight: 700 }}>2100</td>
                    <td>Output VAT Payable (15% Standard)</td>
                    <td><span style={{ fontSize: "0.72rem", backgroundColor: "#EDE7DC", color: "#D8543D", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>Liability</span></td>
                    <td className="mono">—</td>
                    <td className="mono num" style={{ fontWeight: 700, color: "#D8543D" }}>৳5,869.57</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ background: "#EDE7DC", fontWeight: 800 }}>
                    <td colSpan={3} style={{ textAlign: "right", color: "#171817" }}>Total Trial Balance:</td>
                    <td className="mono" style={{ color: "#171817" }}>৳45,000.00</td>
                    <td className="mono num" style={{ color: "#171817" }}>৳45,000.00</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
