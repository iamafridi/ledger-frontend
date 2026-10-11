"use client";

import { useState } from "react";

export function DashboardDemoExplorer() {
  const [activeTab, setActiveTab] = useState<"gl" | "sales" | "assets" | "payroll" | "vat">("gl");

  return (
    <section id="dashboard-demo" className="section">
      <div className="wrap stack-lg">
        <div className="stack" style={{ textAlign: "center", alignItems: "center", gap: "var(--s-3)" }}>
          <span className="chip chip--brand">Live Enterprise Interface</span>
          <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", letterSpacing: "-0.03em" }}>
            Explore the Core Modules
          </h2>
          <p className="muted" style={{ maxWidth: "60ch" }}>
            Click through the interactive module screens below to see how our unified double-entry architecture manages corporate finances from transactions to statutory compliance.
          </p>
        </div>

        {/* Tab Selector */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginBottom: "1.5rem",
          }}
        >
          {[
            { id: "gl", label: "General Ledger & Trial Balance" },
            { id: "sales", label: "Sales Invoicing & AR" },
            { id: "assets", label: "Fixed Assets & Depreciation" },
            { id: "payroll", label: "Staff Payroll & Loans" },
            { id: "vat", label: "Statutory NBR VAT 9.1" },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as typeof activeTab)}
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
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Simulated Dashboard Frame */}
        <div
          style={{
            border: "1px solid #D9D2C5",
            borderRadius: "14px",
            boxShadow: "none",
            background: "#FFFDF7",
            overflow: "hidden",
          }}
        >
          {/* Top window bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1.25rem",
              background: "#EDE7DC",
              borderBottom: "1px solid #D9D2C5",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#D8543D" }} />
              <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#C99B52" }} />
              <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#8FA892" }} />
              <span style={{ marginLeft: "0.75rem", fontFamily: "var(--font-mono), monospace", fontSize: "0.72rem", color: "#827F76" }}>
                app.ledger.local/{activeTab}
              </span>
            </div>
            <span
              style={{
                fontSize: "0.68rem",
                fontFamily: "var(--font-mono), monospace",
                backgroundColor: "#FFFDF7",
                color: "#171817",
                padding: "0.2rem 0.5rem",
                borderRadius: "4px",
                border: "1px solid #D9D2C5",
                fontWeight: 600,
              }}
            >
              ● Live Dual-Bridge Active
            </span>
          </div>

          {/* Module Content */}
          <div className="explorer-table-wrap" style={{ padding: "1.5rem" }}>
            <style>{`
              .explorer-table-wrap .ledger th {
                background: #EDE7DC !important;
                color: #54524c !important;
                border-bottom: 1px solid #D9D2C5 !important;
                font-size: 0.72rem !important;
              }
              .explorer-table-wrap .ledger td {
                color: #171817 !important;
                border-bottom: 1px solid #EFEAE1 !important;
                font-size: 0.86rem !important;
              }
              .explorer-table-wrap .ledger tbody tr:hover {
                background: #F4EFE6 !important;
              }
            `}</style>
            {activeTab === "gl" ? (
              <div className="stack" style={{ gap: "var(--s-4)" }}>
                <div className="row-between">
                  <div>
                    <h3 style={{ fontSize: "var(--t-lg)", margin: 0, color: "#171817" }}>Trial Balance · April 2026</h3>
                    <p className="muted" style={{ margin: 0, fontSize: "var(--t-sm)" }}>All 5 account classes tie out to zero paisa difference.</p>
                  </div>
                  <span
                    style={{
                      fontSize: "0.74rem",
                      fontFamily: "var(--font-mono), monospace",
                      backgroundColor: "#171817",
                      color: "#FFFDF7",
                      padding: "0.3rem 0.7rem",
                      borderRadius: "6px",
                      fontWeight: 600,
                    }}
                  >
                    DR ৳1,485,200.00 = CR ৳1,485,200.00
                  </span>
                </div>

                <div className="ledger-scroll">
                  <table className="ledger">
                    <thead>
                      <tr>
                        <th>Account</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th className="num">Debit (BDT)</th>
                        <th className="num">Credit (BDT)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="mono" style={{ fontWeight: 700 }}>1010</td>
                        <td>Prime Bank Operating</td>
                        <td><span style={{ fontSize: "0.72rem", backgroundColor: "#EDE7DC", color: "#171817", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>Asset</span></td>
                        <td className="mono num" style={{ fontWeight: 700, color: "#171817" }}>৳520,400.00</td>
                        <td className="mono num">—</td>
                      </tr>
                      <tr>
                        <td className="mono" style={{ fontWeight: 700 }}>1100</td>
                        <td>Accounts Receivable Control</td>
                        <td><span style={{ fontSize: "0.72rem", backgroundColor: "#EDE7DC", color: "#171817", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>Asset</span></td>
                        <td className="mono num" style={{ fontWeight: 700, color: "#171817" }}>৳145,000.00</td>
                        <td className="mono num">—</td>
                      </tr>
                      <tr>
                        <td className="mono" style={{ fontWeight: 700 }}>1500</td>
                        <td>Fixed Assets (Dell Server &amp; Van)</td>
                        <td><span style={{ fontSize: "0.72rem", backgroundColor: "#EDE7DC", color: "#171817", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>Asset</span></td>
                        <td className="mono num" style={{ fontWeight: 700, color: "#171817" }}>৳600,000.00</td>
                        <td className="mono num">—</td>
                      </tr>
                      <tr>
                        <td className="mono" style={{ fontWeight: 700 }}>2000</td>
                        <td>Accounts Payable (Suppliers)</td>
                        <td><span style={{ fontSize: "0.72rem", backgroundColor: "#EDE7DC", color: "#D8543D", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>Liability</span></td>
                        <td className="mono num">—</td>
                        <td className="mono num" style={{ fontWeight: 700, color: "#D8543D" }}>৳85,000.00</td>
                      </tr>
                      <tr>
                        <td className="mono" style={{ fontWeight: 700 }}>4000</td>
                        <td>Enterprise Sales Revenue</td>
                        <td><span style={{ fontSize: "0.72rem", backgroundColor: "#EDE7DC", color: "#171817", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>Revenue</span></td>
                        <td className="mono num">—</td>
                        <td className="mono num" style={{ fontWeight: 700, color: "#171817" }}>৳780,200.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {activeTab === "sales" ? (
              <div className="stack" style={{ gap: "var(--s-4)" }}>
                <div className="row-between">
                  <div>
                    <h3 style={{ fontSize: "var(--t-lg)", margin: 0, color: "#171817" }}>B2B Invoices &amp; Receivables</h3>
                    <p className="muted" style={{ margin: 0, fontSize: "var(--t-sm)" }}>Automatic VAT 15% calculation, discount handling, and print-ready A4 generation.</p>
                  </div>
                  <button
                    type="button"
                    style={{
                      backgroundColor: "#171817",
                      color: "#FFFDF7",
                      border: "1px solid #282a29",
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      fontFamily: "var(--font-mono), monospace",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    }}
                  >
                    + New Tax Invoice
                  </button>
                </div>

                <div className="ledger-scroll">
                  <table className="ledger">
                    <thead>
                      <tr>
                        <th>Doc #</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th className="num">Total (BDT)</th>
                        <th className="num">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="mono" style={{ fontWeight: 700, color: "#171817" }}>INV-2026-001</td>
                        <td>Apex Logistics Corp</td>
                        <td className="mono">2026-04-02</td>
                        <td><span style={{ fontSize: "0.72rem", backgroundColor: "#EDE7DC", color: "#171817", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>ISSUED</span></td>
                        <td className="mono num">৳31,000.00</td>
                        <td className="mono num" style={{ fontWeight: 700, color: "#D8543D" }}>৳31,000.00</td>
                      </tr>
                      <tr>
                        <td className="mono" style={{ fontWeight: 700, color: "#171817" }}>INV-2026-002</td>
                        <td>Dhaka Tech Solutions</td>
                        <td className="mono">2026-04-05</td>
                        <td><span style={{ fontSize: "0.72rem", backgroundColor: "#EDE7DC", color: "#171817", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>SETTLED</span></td>
                        <td className="mono num">৳16,250.00</td>
                        <td className="mono num" style={{ color: "#171817" }}>৳0.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {activeTab === "assets" ? (
              <div className="stack" style={{ gap: "var(--s-4)" }}>
                <div className="row-between">
                  <div>
                    <h3 style={{ fontSize: "var(--t-lg)", margin: 0, color: "#171817" }}>Fixed Asset Register</h3>
                    <p className="muted" style={{ margin: 0, fontSize: "var(--t-sm)" }}>Straight-line monthly depreciation charge tied 1:1 with Account 1500 &amp; 1510.</p>
                  </div>
                  <span style={{ fontSize: "0.74rem", fontFamily: "var(--font-mono), monospace", backgroundColor: "#EDE7DC", color: "#171817", padding: "0.3rem 0.7rem", borderRadius: "6px", fontWeight: 600 }}>Total NBV: ৳570,000.00</span>
                </div>

                <div className="ledger-scroll">
                  <table className="ledger">
                    <thead>
                      <tr>
                        <th>Asset Tag</th>
                        <th>Asset Name</th>
                        <th>Cost</th>
                        <th>Salvage</th>
                        <th>Useful Life</th>
                        <th className="num">Monthly Dep</th>
                        <th className="num">Net Book Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="mono" style={{ fontWeight: 700 }}>AST-SRV-01</td>
                        <td>Dell PowerEdge R750 Server</td>
                        <td className="mono">৳120,000.00</td>
                        <td className="mono">৳12,000.00</td>
                        <td>36 Mo</td>
                        <td className="mono num" style={{ color: "#D8543D" }}>৳3,000.00</td>
                        <td className="mono num" style={{ fontWeight: 700 }}>৳117,000.00</td>
                      </tr>
                      <tr>
                        <td className="mono" style={{ fontWeight: 700 }}>AST-VAN-01</td>
                        <td>Toyota HiAce Delivery Van</td>
                        <td className="mono">৳480,000.00</td>
                        <td className="mono">৳80,000.00</td>
                        <td>60 Mo</td>
                        <td className="mono num" style={{ color: "#D8543D" }}>৳6,666.67</td>
                        <td className="mono num" style={{ fontWeight: 700 }}>৳453,333.33</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {activeTab === "payroll" ? (
              <div className="stack" style={{ gap: "var(--s-4)" }}>
                <div className="row-between">
                  <div>
                    <h3 style={{ fontSize: "var(--t-lg)", margin: 0, color: "#171817" }}>Payroll Runs &amp; Staff Loans</h3>
                    <p className="muted" style={{ margin: 0, fontSize: "var(--t-sm)" }}>Two-step double-entry salary posting (`DR 5000 / CR 2300`) with auto loan deductions.</p>
                  </div>
                  <span style={{ fontSize: "0.74rem", fontFamily: "var(--font-mono), monospace", backgroundColor: "#171817", color: "#FFFDF7", padding: "0.3rem 0.7rem", borderRadius: "6px", fontWeight: 600 }}>Run Status: POSTED &amp; PAID</span>
                </div>

                <div className="ledger-scroll">
                  <table className="ledger">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Designation</th>
                        <th>Basic</th>
                        <th>HRA / Medical</th>
                        <th>Loan Deduct</th>
                        <th className="num">Net Disbursed</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Tariqul Islam</td>
                        <td className="muted">Senior Accountant</td>
                        <td className="mono">৳45,000.00</td>
                        <td className="mono">৳15,000.00</td>
                        <td className="mono" style={{ color: "#D8543D" }}>-৳5,000.00</td>
                        <td className="mono num" style={{ fontWeight: 700, color: "#171817" }}>৳55,000.00</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Sadia Sultana</td>
                        <td className="muted">Operations Lead</td>
                        <td className="mono">৳38,000.00</td>
                        <td className="mono">৳12,000.00</td>
                        <td className="mono">—</td>
                        <td className="mono num" style={{ fontWeight: 700, color: "#171817" }}>৳50,000.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {activeTab === "vat" ? (
              <div className="stack" style={{ gap: "var(--s-4)" }}>
                <div className="row-between">
                  <div>
                    <h3 style={{ fontSize: "var(--t-lg)", margin: 0, color: "#171817" }}>Statutory NBR VAT 9.1 Return</h3>
                    <p className="muted" style={{ margin: 0, fontSize: "var(--t-sm)" }}>Output VAT vs Input Tax credits automatically folded into statutory government filing bands.</p>
                  </div>
                  <span style={{ fontSize: "0.74rem", fontFamily: "var(--font-mono), monospace", backgroundColor: "#EDE7DC", color: "#171817", padding: "0.3rem 0.7rem", borderRadius: "6px", fontWeight: 600 }}>Net Payable to NBR: ৳23,450.00</span>
                </div>

                <div className="ledger-scroll">
                  <table className="ledger">
                    <thead>
                      <tr>
                        <th>Tax Band</th>
                        <th>Taxable Base</th>
                        <th>Output Tax (15%)</th>
                        <th>Input Rebate (15%)</th>
                        <th className="num">Net Payable</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Standard Rated Goods (15%)</td>
                        <td className="mono">৳320,000.00</td>
                        <td className="mono">৳48,000.00</td>
                        <td className="mono" style={{ color: "#D8543D" }}>-৳24,550.00</td>
                        <td className="mono num" style={{ fontWeight: 700, color: "#171817" }}>৳23,450.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
