"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Amount } from "@/components/money";
import { useSession } from "@/components/session-provider";
import { toast } from "@/components/toast-provider";
import { Modal } from "@/components/ui/modal";
import { api, ApiError } from "@/lib/api";
import type {
  Account,
  LoanInstallment,
  PayrollRun,
  Payslip,
  RunDetail,
  RunPreview,
  Staff,
  StaffLedgerResult,
  StaffLoan,
} from "@/lib/types";

type Tab = "directory" | "runs" | "payslips" | "loans" | "ledger";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "directory", label: "Staff directory" },
  { key: "runs", label: "Payroll runs" },
  { key: "payslips", label: "Payslips" },
  { key: "loans", label: "Loans & advances" },
  { key: "ledger", label: "Staff ledger" },
];

const today = (): string => new Date().toISOString().slice(0, 10);
const thisMonth = (): string => new Date().toISOString().slice(0, 7);

export default function StaffPage() {
  const { can } = useSession();
  const canWrite = can("staff.write");

  const [tab, setTab] = useState<Tab>("directory");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Master Data
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loans, setLoans] = useState<StaffLoan[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Directory state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "ACTIVE" | "INACTIVE">("");
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [staffDraft, setStaffDraft] = useState({
    code: "",
    name: "",
    designation: "",
    joining_date: today(),
    branch: "",
    monthly_salary_bdt: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  // Payroll run wizard state
  const [showRunModal, setShowRunModal] = useState(false);
  const [runPeriod, setRunPeriod] = useState(thisMonth());
  const [runExpenseAccount, setRunExpenseAccount] = useState("5100");
  const [runPreview, setRunPreview] = useState<RunPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedRun, setSelectedRun] = useState<RunDetail | null>(null);

  // Run payment & reverse modals
  const [payRunModal, setPayRunModal] = useState<PayrollRun | null>(null);
  const [payAccountCode, setPayAccountCode] = useState("1010");
  const [reverseRunModal, setReverseRunModal] = useState<PayrollRun | null>(null);
  const [reverseReason, setReverseReason] = useState("");

  // Loans state
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanDraft, setLoanDraft] = useState({
    staff_id: "",
    kind: "LOAN" as "LOAN" | "ADVANCE",
    principal_bdt: "",
    disbursed_on: today(),
    account_code: "1010",
    interest_rate_percent: "12.00",
    term_months: 12,
    notes: "",
  });
  const [selectedLoan, setSelectedLoan] = useState<StaffLoan | null>(null);
  const [collectLoanModal, setCollectLoanModal] = useState<StaffLoan | null>(null);
  const [collectDraft, setCollectDraft] = useState({
    amount_bdt: "",
    date: today(),
    account_code: "1000",
    memo: "Cash repayment",
  });

  // Payslip inspector modal
  const [inspectPayslip, setInspectPayslip] = useState<Payslip | null>(null);
  const [payslipPeriodFilter, setPayslipPeriodFilter] = useState("");
  const [payslipStaffFilter, setPayslipStaffFilter] = useState("");

  // Staff Ledger state
  const [ledgerStaffId, setLedgerStaffId] = useState("");
  const [staffLedgerData, setStaffLedgerData] = useState<StaffLedgerResult | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [staffRes, runsRes, payslipsRes, loansRes, coaRes] = await Promise.all([
        api<{ staff: Staff[] }>("/staff?limit=300"),
        api<{ runs: PayrollRun[] }>("/staff/runs?limit=100"),
        api<{ payslips: Payslip[] }>("/staff/payslips?limit=200"),
        api<{ loans: StaffLoan[] }>("/staff/loans?limit=200"),
        api<{ accounts: Account[] }>("/coa?include_inactive=true"),
      ]);
      setStaffList(staffRes.staff);
      setRuns(runsRes.runs);
      setPayslips(payslipsRes.payslips);
      setLoans(loansRes.loans);
      setAccounts(coaRes.accounts);
      if (staffRes.staff.length > 0 && !ledgerStaffId) {
        setLedgerStaffId(staffRes.staff[0].id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load payroll data.");
    } finally {
      setLoading(false);
    }
  }, [ledgerStaffId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Load staff ledger when selected employee changes
  useEffect(() => {
    if (!ledgerStaffId || tab !== "ledger") return;
    let active = true;
    setLedgerLoading(true);
    api<StaffLedgerResult>(`/staff/${ledgerStaffId}/ledger`)
      .then((data) => {
        if (active) setStaffLedgerData(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : "Could not load staff ledger.");
      })
      .finally(() => {
        if (active) setLedgerLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ledgerStaffId, tab]);

  // Run Preview loader
  const loadPreview = async (period: string, expCode: string) => {
    setPreviewLoading(true);
    setError(null);
    try {
      const res = await api<{ preview: RunPreview }>("/staff/runs/preview", {
        method: "POST",
        body: { period_key: period, expense_account_code: expCode },
      });
      setRunPreview(res.preview);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not generate payroll preview.");
      setRunPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleOpenRunWizard = () => {
    setShowRunModal(true);
    setRunPeriod(thisMonth());
    void loadPreview(thisMonth(), runExpenseAccount);
  };

  // Staff creation / update
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (editingStaff) {
        await api(`/staff/${editingStaff.id}`, {
          method: "PATCH",
          body: {
            name: staffDraft.name,
            designation: staffDraft.designation,
            branch: staffDraft.branch,
            monthly_salary_bdt: staffDraft.monthly_salary_bdt,
            status: staffDraft.status,
          },
        });
        const msg = `Updated profile for ${staffDraft.name}.`;
        setNotice(msg);
        toast.success(msg);
      } else {
        await api("/staff", {
          method: "POST",
          body: staffDraft,
        });
        const msg = `Created employee ${staffDraft.name} (${staffDraft.code}).`;
        setNotice(msg);
        toast.success(msg);
      }
      setShowStaffModal(false);
      setEditingStaff(null);
      await loadData();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to save staff member.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // Post Payroll Run
  const handlePostRun = async () => {
    if (!runPreview) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api("/staff/runs", {
        method: "POST",
        body: {
          period_key: runPeriod,
          expense_account_code: runExpenseAccount,
          date: runPreview.date,
        },
      });
      const msg = `Payroll run for ${runPeriod} posted successfully.`;
      setNotice(msg);
      toast.success(msg);
      setShowRunModal(false);
      setRunPreview(null);
      await loadData();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to post payroll run.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // Pay Payroll Run
  const handlePayRun = async () => {
    if (!payRunModal) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api(`/staff/runs/${payRunModal.id}/pay`, {
        method: "POST",
        body: {
          payment_account_code: payAccountCode,
          paid_on: today(),
        },
      });
      const msg = `Disbursed payroll payment for ${payRunModal.period_key}.`;
      setNotice(msg);
      toast.success(msg);
      setPayRunModal(null);
      await loadData();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to process payroll payment.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // Reverse Payroll Run
  const handleReverseRun = async () => {
    if (!reverseRunModal || !reverseReason.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api(`/staff/runs/${reverseRunModal.id}/reverse`, {
        method: "POST",
        body: { reason: reverseReason },
      });
      const msg = `Reversed payroll run for ${reverseRunModal.period_key}.`;
      setNotice(msg);
      toast.success(msg);
      setReverseRunModal(null);
      setReverseReason("");
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reverse payroll run.");
    } finally {
      setBusy(false);
    }
  };

  // Create Loan / Advance
  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api("/staff/loans", {
        method: "POST",
        body: {
          staff_id: loanDraft.staff_id,
          kind: loanDraft.kind,
          principal_bdt: loanDraft.principal_bdt,
          disbursed_on: loanDraft.disbursed_on,
          account_code: loanDraft.account_code,
          interest_rate_percent: loanDraft.kind === "LOAN" ? loanDraft.interest_rate_percent : "0.00",
          term_months: loanDraft.kind === "LOAN" ? Number(loanDraft.term_months) : 0,
          notes: loanDraft.notes,
        },
      });
      setNotice(`Disbursed ${loanDraft.kind.toLowerCase()} of ৳${loanDraft.principal_bdt}.`);
      setShowLoanModal(false);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to disburse loan.");
    } finally {
      setBusy(false);
    }
  };

  // Collect Cash on Loan
  const handleCollectLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectLoanModal) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api(`/staff/loans/${collectLoanModal.id}/collect`, {
        method: "POST",
        body: {
          amount_bdt: collectDraft.amount_bdt,
          date: collectDraft.date,
          account_code: collectDraft.account_code,
          memo: collectDraft.memo,
        },
      });
      setNotice(`Collected cash repayment of ৳${collectDraft.amount_bdt}.`);
      setCollectLoanModal(null);
      if (selectedLoan && selectedLoan.id === collectLoanModal.id) {
        const refreshed = await api<{ loan: StaffLoan }>(`/staff/loans/${selectedLoan.id}`);
        setSelectedLoan(refreshed.loan);
      }
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to record cash repayment.");
    } finally {
      setBusy(false);
    }
  };

  // View Loan Details
  const handleInspectLoan = async (loan: StaffLoan) => {
    try {
      const res = await api<{ loan: StaffLoan }>(`/staff/loans/${loan.id}`);
      setSelectedLoan(res.loan);
    } catch {
      setSelectedLoan(loan);
    }
  };

  // View Run Details
  const handleInspectRun = async (run: PayrollRun) => {
    try {
      const res = await api<{ run: RunDetail }>(`/staff/runs/${run.id}`);
      setSelectedRun(res.run);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load run details.");
    }
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.designation.toLowerCase().includes(q) ||
          s.branch.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [staffList, statusFilter, search]);

  // Filtered payslips
  const filteredPayslips = useMemo(() => {
    return payslips.filter((p) => {
      if (payslipPeriodFilter && p.period_key !== payslipPeriodFilter) return false;
      if (payslipStaffFilter && p.staff_id !== payslipStaffFilter) return false;
      return true;
    });
  }, [payslips, payslipPeriodFilter, payslipStaffFilter]);

  // Overall totals
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.status === "ACTIVE").length;
  const monthlySalaryBudget = staffList
    .filter((s) => s.status === "ACTIVE")
    .reduce((acc, s) => acc + (parseFloat(s.monthly_salary_bdt) || 0), 0);
  const totalLoansOutstanding = loans
    .filter((l) => l.status === "ACTIVE")
    .reduce((acc, l) => acc + (parseFloat(l.outstanding_bdt) || 0), 0);

  return (
    <div className="staff-container">
      {/* Header */}
      <div className="staff-header">
        <div>
          <p className="eyebrow">05 &nbsp; Human capital &amp; payroll</p>
          <h1 style={{ fontSize: "var(--t-2xl)", color: "#141514", margin: "var(--s-1) 0" }}>
            Payroll &amp; Staff Ledger
          </h1>
          <p className="muted" style={{ margin: 0, maxWidth: "68ch" }}>
            Employee master, monthly payroll runs with balanced GL postings, loan amortization schedules &amp; staff sub-ledgers.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
          {canWrite && tab === "directory" && (
            <button
              onClick={() => {
                setEditingStaff(null);
                setStaffDraft({
                  code: `EMP-${String(staffList.length + 1).padStart(3, "0")}`,
                  name: "",
                  designation: "",
                  joining_date: today(),
                  branch: "Main Branch",
                  monthly_salary_bdt: "30000.00",
                  status: "ACTIVE",
                });
                setShowStaffModal(true);
              }}
              className="btn btn--primary btn--sm"
            >
              + Add Employee
            </button>
          )}
          {canWrite && tab === "runs" && (
            <button onClick={handleOpenRunWizard} className="btn btn--primary btn--sm">
              + New Payroll Run
            </button>
          )}
          {canWrite && tab === "loans" && (
            <button
              onClick={() => {
                setLoanDraft({
                  staff_id: staffList.find((s) => s.status === "ACTIVE")?.id || "",
                  kind: "LOAN",
                  principal_bdt: "50000.00",
                  disbursed_on: today(),
                  account_code: "1010",
                  interest_rate_percent: "12.00",
                  term_months: 12,
                  notes: "",
                });
                setShowLoanModal(true);
              }}
              className="btn btn--primary btn--sm"
            >
              + Disburse Loan / Advance
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="staff-tab-bar">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`staff-tab-btn ${tab === t.key ? "active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Feedback alerts */}
      {error && (
        <p className="alert alert--error" role="alert" style={{ margin: 0 }}>
          {error}
        </p>
      )}
      {notice && (
        <p className="alert alert--ok" role="status" style={{ margin: 0 }}>
          {notice}
        </p>
      )}

      {/* KPI Stats Ribbon */}
      <div className="staff-kpi-grid">
        <div className="staff-kpi-card">
          <div className="label" style={{ color: "#6E6A62" }}>Total Staff</div>
          <div style={{ fontSize: "var(--t-lg)", fontWeight: 700, color: "#141514", marginTop: "4px" }}>
            {totalStaff} <span style={{ fontSize: "var(--t-xs)", fontWeight: 500, color: "#8E887E" }}>({activeStaff} active)</span>
          </div>
        </div>
        <div className="staff-kpi-card">
          <div className="label" style={{ color: "#6E6A62" }}>Active Monthly Payroll</div>
          <div style={{ fontSize: "var(--t-lg)", fontWeight: 700, color: "#141514", marginTop: "4px" }}>
            <Amount value={monthlySalaryBudget.toFixed(2)} />
          </div>
        </div>
        <div className="staff-kpi-card">
          <div className="label" style={{ color: "#6E6A62" }}>Loans &amp; Advances Owed</div>
          <div style={{ fontSize: "var(--t-lg)", fontWeight: 700, color: "#D8543D", marginTop: "4px" }}>
            <Amount value={totalLoansOutstanding.toFixed(2)} />
          </div>
        </div>
        <div className="staff-kpi-card">
          <div className="label" style={{ color: "#6E6A62" }}>Completed Runs</div>
          <div style={{ fontSize: "var(--t-lg)", fontWeight: 700, color: "#141514", marginTop: "4px" }}>
            {runs.filter((r) => r.status === "POSTED").length}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-zinc-500">Loading payroll data...</div>
      ) : (
        <>
          {/* TAB 1: STAFF DIRECTORY */}
          {tab === "directory" && (
            <div className="stack">
              <div className="row-between" style={{ gap: "var(--s-3)" }}>
                <div style={{ position: "relative", display: "flex", alignItems: "center", flex: 1, minWidth: "240px", maxWidth: "420px" }}>
                  <input
                    type="text"
                    placeholder="Search by name, code, designation, branch..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: "100%", paddingRight: search ? "2.2rem" : undefined }}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="Clear staff search query"
                      style={{
                        position: "absolute",
                        right: "0.5rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--ink-muted)",
                        padding: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "28px",
                        minHeight: "28px",
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "" | "ACTIVE" | "INACTIVE")}
                  style={{ width: "auto", minWidth: "160px" }}
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="panel panel--flush">
                <div className="ledger-scroll">
                  <table className="ledger">
                    <thead>
                      <tr>
                        <th scope="col">Code</th>
                        <th scope="col">Name</th>
                        <th scope="col">Designation</th>
                        <th scope="col">Branch</th>
                        <th scope="col" className="num">Monthly Base</th>
                        <th scope="col" className="num">Owed (Loans/Adv)</th>
                        <th scope="col">Last Paid</th>
                        <th scope="col">Status</th>
                        <th scope="col" className="num">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaff.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: "center", padding: "var(--s-6)", color: "#8E887E" }}>
                            No staff members found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredStaff.map((staff) => (
                          <tr key={staff.id}>
                            <td className="mono" style={{ fontWeight: 600 }}>{staff.code}</td>
                            <td style={{ fontWeight: 600, color: "#141514" }}>{staff.name}</td>
                            <td style={{ color: "#6E6A62" }}>{staff.designation || "—"}</td>
                            <td style={{ color: "#6E6A62" }}>{staff.branch || "—"}</td>
                            <td className="num mono">
                              <Amount value={staff.monthly_salary_bdt} />
                            </td>
                            <td className="num mono">
                              {parseFloat(staff.total_owed_bdt) > 0 ? (
                                <span style={{ color: "#D8543D", fontWeight: 600 }}>
                                  <Amount value={staff.total_owed_bdt} />
                                </span>
                              ) : (
                                <span style={{ color: "#8E887E" }}>0.00</span>
                              )}
                            </td>
                            <td className="mono" style={{ fontSize: "var(--t-xs)", color: "#6E6A62" }}>
                              {staff.last_paid_period || "Never"}
                            </td>
                            <td>
                              <span className={`chip ${staff.status === "ACTIVE" ? "chip--ok" : ""}`}>
                                {staff.status.toLowerCase()}
                              </span>
                            </td>
                            <td className="num" style={{ whiteSpace: "nowrap" }}>
                              <div style={{ display: "inline-flex", gap: "var(--s-2)" }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLedgerStaffId(staff.id);
                                    setTab("ledger");
                                  }}
                                  className="btn btn--quiet btn--sm"
                                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem" }}
                                >
                                  Ledger
                                </button>
                                {canWrite && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingStaff(staff);
                                      setStaffDraft({
                                        code: staff.code,
                                        name: staff.name,
                                        designation: staff.designation,
                                        joining_date: staff.joining_date,
                                        branch: staff.branch,
                                        monthly_salary_bdt: staff.monthly_salary_bdt,
                                        status: staff.status,
                                      });
                                      setShowStaffModal(true);
                                    }}
                                    className="btn btn--quiet btn--sm"
                                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem" }}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAYROLL RUNS */}
          {tab === "runs" && (
            <div className="stack">
              <div className="panel panel--flush">
                <div className="ledger-scroll">
                  <table className="ledger">
                    <thead>
                      <tr>
                        <th scope="col">Period</th>
                        <th scope="col">Posting Date</th>
                        <th scope="col" style={{ textAlign: "center" }}>Staff Count</th>
                        <th scope="col" className="num">Gross (Expense)</th>
                        <th scope="col" className="num">Deductions</th>
                        <th scope="col" className="num">Net Payable</th>
                        <th scope="col">Payment Status</th>
                        <th scope="col">Run Status</th>
                        <th scope="col" className="num">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: "center", padding: "var(--s-6)", color: "#8E887E" }}>
                            No payroll runs recorded yet. Click &quot;+ New Payroll Run&quot; to generate.
                          </td>
                        </tr>
                      ) : (
                        runs.map((run) => (
                          <tr key={run.id}>
                            <td className="mono" style={{ fontWeight: 600 }}>{run.period_key}</td>
                            <td style={{ color: "#6E6A62" }}>{run.date}</td>
                            <td style={{ textAlign: "center", fontWeight: 600 }}>{run.staff_count}</td>
                            <td className="num mono">
                              <Amount value={run.gross_bdt} />
                            </td>
                            <td className="num mono" style={{ color: "#6E6A62" }}>
                              <Amount value={run.deductions_bdt} />
                            </td>
                            <td className="num mono" style={{ fontWeight: 700, color: "#141514" }}>
                              <Amount value={run.net_bdt} />
                            </td>
                            <td>
                              {run.paid_on ? (
                                <span className="chip chip--ok">Paid ({run.paid_on})</span>
                              ) : run.status === "REVERSED" ? (
                                <span style={{ color: "#8E887E" }}>—</span>
                              ) : (
                                <span className="chip chip--brand">Unpaid (Payable)</span>
                              )}
                            </td>
                            <td>
                              <span className={`chip ${run.status === "POSTED" ? "chip--ok" : "chip--short"}`}>
                                {run.status.toLowerCase()}
                              </span>
                            </td>
                            <td className="num" style={{ whiteSpace: "nowrap" }}>
                              <div style={{ display: "inline-flex", gap: "var(--s-2)" }}>
                                <button
                                  type="button"
                                  onClick={() => handleInspectRun(run)}
                                  className="btn btn--quiet btn--sm"
                                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem" }}
                                >
                                  Details
                                </button>
                                {canWrite && run.status === "POSTED" && !run.paid_on && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPayRunModal(run);
                                      setPayAccountCode("1010");
                                    }}
                                    className="btn btn--primary btn--sm"
                                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem" }}
                                  >
                                    Disburse / Pay
                                  </button>
                                )}
                                {canWrite && run.status === "POSTED" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReverseRunModal(run);
                                      setReverseReason("");
                                    }}
                                    className="btn btn--quiet btn--sm"
                                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem", color: "#D8543D" }}
                                  >
                                    Reverse
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Run details drawer */}
              {selectedRun && (
                <div className="panel panel--flush" style={{ marginTop: "var(--s-4)", border: "1px solid #D8543D" }}>
                  <div className="panel-head" style={{ borderBottom: "1px solid var(--line)" }}>
                    <div>
                      <div className="label" style={{ color: "#D8543D" }}>Run Audit Breakdown</div>
                      <h3 style={{ fontSize: "var(--t-lg)", fontWeight: 700, margin: "2px 0 0 0" }}>
                        Payroll Run Details: {selectedRun.period_key}
                      </h3>
                      <p className="note" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
                        Date: {selectedRun.date} · Status: <span className="chip chip--ok">{selectedRun.status}</span> · Expense Account: {selectedRun.expense_account_code}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedRun(null)}
                      className="btn btn--quiet btn--sm"
                    >
                      Close ✕
                    </button>
                  </div>

                  <div style={{ padding: "var(--s-4)" }}>
                    <div className="staff-kpi-grid" style={{ marginBottom: "var(--s-4)" }}>
                      <div className="staff-kpi-card">
                        <div className="label">Gross Salaries (5100)</div>
                        <div style={{ fontSize: "var(--t-md)", fontWeight: 700, marginTop: "4px" }}>
                          <Amount value={selectedRun.gross_bdt} />
                        </div>
                      </div>
                      <div className="staff-kpi-card">
                        <div className="label">Deductions (1600)</div>
                        <div style={{ fontSize: "var(--t-md)", fontWeight: 700, color: "#6E6A62", marginTop: "4px" }}>
                          <Amount
                            value={(
                              parseFloat(selectedRun.loan_principal_bdt) +
                              parseFloat(selectedRun.advance_bdt)
                            ).toFixed(2)}
                          />
                        </div>
                      </div>
                      <div className="staff-kpi-card">
                        <div className="label">Loan Interest (4100)</div>
                        <div style={{ fontSize: "var(--t-md)", fontWeight: 700, color: "#2E7D32", marginTop: "4px" }}>
                          <Amount value={selectedRun.loan_interest_bdt} />
                        </div>
                      </div>
                      <div className="staff-kpi-card">
                        <div className="label">Net Payable (2300)</div>
                        <div style={{ fontSize: "var(--t-md)", fontWeight: 700, color: "#D8543D", marginTop: "4px" }}>
                          <Amount value={selectedRun.net_bdt} />
                        </div>
                      </div>
                    </div>

                    <div className="label" style={{ marginBottom: "var(--s-2)" }}>
                      Generated Payslips ({selectedRun.payslips.length})
                    </div>
                    <div className="ledger-scroll">
                      <table className="ledger">
                        <thead>
                          <tr>
                            <th scope="col">Doc No</th>
                            <th scope="col">Staff</th>
                            <th scope="col" className="num">Basic</th>
                            <th scope="col" className="num">Allowances</th>
                            <th scope="col" className="num">Gross</th>
                            <th scope="col" className="num">Loan Rec.</th>
                            <th scope="col" className="num">Adv Rec.</th>
                            <th scope="col" className="num">Interest</th>
                            <th scope="col" className="num">Tax</th>
                            <th scope="col" className="num">Net</th>
                            <th scope="col">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRun.payslips.map((ps) => (
                            <tr key={ps.id}>
                              <td className="mono">{ps.doc_no || "—"}</td>
                              <td style={{ fontWeight: 600 }}>{ps.staff_name}</td>
                              <td className="num mono"><Amount value={ps.basic_bdt} /></td>
                              <td className="num mono"><Amount value={ps.allowances_bdt} /></td>
                              <td className="num mono" style={{ fontWeight: 600 }}><Amount value={ps.gross_bdt} /></td>
                              <td className="num mono" style={{ color: "#6E6A62" }}><Amount value={ps.loan_principal_bdt} /></td>
                              <td className="num mono" style={{ color: "#6E6A62" }}><Amount value={ps.advance_bdt} /></td>
                              <td className="num mono" style={{ color: "#6E6A62" }}><Amount value={ps.loan_interest_bdt} /></td>
                              <td className="num mono" style={{ color: "#6E6A62" }}><Amount value={ps.tax_bdt} /></td>
                              <td className="num mono" style={{ fontWeight: 700, color: "#141514" }}><Amount value={ps.net_bdt} /></td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => setInspectPayslip(ps)}
                                  className="btn btn--quiet btn--sm"
                                  style={{ padding: "0.2rem 0.5rem", fontSize: "0.72rem" }}
                                >
                                  View Slip
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PAYSLIPS */}
          {tab === "payslips" && (
            <div className="stack">
              <div className="row" style={{ gap: "var(--s-3)", alignItems: "center" }}>
                <input
                  type="month"
                  value={payslipPeriodFilter}
                  onChange={(e) => setPayslipPeriodFilter(e.target.value)}
                  style={{ width: "auto" }}
                />
                <select
                  value={payslipStaffFilter}
                  onChange={(e) => setPayslipStaffFilter(e.target.value)}
                  style={{ flex: 1, minWidth: "220px", maxWidth: "380px" }}
                >
                  <option value="">All Employees</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
                {(payslipPeriodFilter || payslipStaffFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setPayslipPeriodFilter("");
                      setPayslipStaffFilter("");
                    }}
                    className="btn btn--quiet btn--sm"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              <div className="panel panel--flush">
                <div className="ledger-scroll">
                  <table className="ledger">
                    <thead>
                      <tr>
                        <th scope="col">Doc No</th>
                        <th scope="col">Period</th>
                        <th scope="col">Employee</th>
                        <th scope="col" className="num">Basic</th>
                        <th scope="col" className="num">Allowances</th>
                        <th scope="col" className="num">Gross</th>
                        <th scope="col" className="num">Deductions</th>
                        <th scope="col" className="num">Net Payable</th>
                        <th scope="col">Status</th>
                        <th scope="col" className="num">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayslips.length === 0 ? (
                        <tr>
                          <td colSpan={10} style={{ textAlign: "center", padding: "var(--s-6)", color: "#8E887E" }}>
                            No payslips found.
                          </td>
                        </tr>
                      ) : (
                        filteredPayslips.map((ps) => (
                          <tr key={ps.id}>
                            <td className="mono" style={{ fontWeight: 600 }}>{ps.doc_no || "—"}</td>
                            <td className="mono" style={{ color: "#6E6A62" }}>{ps.period_key}</td>
                            <td style={{ fontWeight: 600, color: "#141514" }}>{ps.staff_name}</td>
                            <td className="num mono">
                              <Amount value={ps.basic_bdt} />
                            </td>
                            <td className="num mono">
                              <Amount value={ps.allowances_bdt} />
                            </td>
                            <td className="num mono">
                              <Amount value={ps.gross_bdt} />
                            </td>
                            <td className="num mono" style={{ color: "#6E6A62" }}>
                              <Amount value={ps.deductions_bdt} />
                            </td>
                            <td className="num mono" style={{ fontWeight: 700, color: "#141514" }}>
                              <Amount value={ps.net_bdt} />
                            </td>
                            <td>
                              <span
                                className={`chip ${
                                  ps.status === "PAID"
                                    ? "chip--ok"
                                    : ps.status === "POSTED"
                                    ? "chip--brand"
                                    : ""
                                }`}
                              >
                                {ps.status.toLowerCase()}
                              </span>
                            </td>
                            <td className="num">
                              <button
                                type="button"
                                onClick={() => setInspectPayslip(ps)}
                                className="btn btn--quiet btn--sm"
                                style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem" }}
                              >
                                Inspect
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LOANS & ADVANCES */}
          {tab === "loans" && (
            <div className="stack">
              <div className="panel panel--flush">
                <div className="ledger-scroll">
                  <table className="ledger">
                    <thead>
                      <tr>
                        <th scope="col">Doc No</th>
                        <th scope="col">Employee</th>
                        <th scope="col">Kind</th>
                        <th scope="col">Disbursed Date</th>
                        <th scope="col" className="num">Principal</th>
                        <th scope="col" className="num">Interest Rate</th>
                        <th scope="col" className="num">Term</th>
                        <th scope="col" className="num">Installment</th>
                        <th scope="col" className="num">Outstanding</th>
                        <th scope="col" className="num">Repaid</th>
                        <th scope="col">Status</th>
                        <th scope="col" className="num">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.length === 0 ? (
                        <tr>
                          <td colSpan={12} style={{ textAlign: "center", padding: "var(--s-6)", color: "#8E887E" }}>
                            No staff loans or advances recorded.
                          </td>
                        </tr>
                      ) : (
                        loans.map((loan) => (
                          <tr key={loan.id}>
                            <td className="mono" style={{ fontWeight: 600 }}>{loan.doc_no || "—"}</td>
                            <td style={{ fontWeight: 600, color: "#141514" }}>
                              {loan.staff_name} ({loan.staff_code})
                            </td>
                            <td>
                              <span className="chip">
                                {loan.kind}
                              </span>
                            </td>
                            <td style={{ color: "#6E6A62" }}>{loan.disbursed_on}</td>
                            <td className="num mono">
                              <Amount value={loan.principal_bdt} />
                            </td>
                            <td className="num mono">
                              {loan.kind === "LOAN" ? `${loan.interest_rate_percent}%` : "0%"}
                            </td>
                            <td className="num">
                              {loan.kind === "LOAN" ? `${loan.term_months} mo` : "1 mo"}
                            </td>
                            <td className="num mono">
                              <Amount value={loan.installment_bdt} />
                            </td>
                            <td className="num mono" style={{ fontWeight: 700, color: "#D8543D" }}>
                              <Amount value={loan.outstanding_bdt} />
                            </td>
                            <td className="num mono" style={{ color: "#2E7D32" }}>
                              <Amount value={loan.repaid_bdt} />
                            </td>
                            <td>
                              <span className={`chip ${loan.status === "ACTIVE" ? "chip--ok" : ""}`}>
                                {loan.status.toLowerCase()}
                              </span>
                            </td>
                            <td className="num" style={{ whiteSpace: "nowrap" }}>
                              <div style={{ display: "inline-flex", gap: "var(--s-2)" }}>
                                <button
                                  type="button"
                                  onClick={() => handleInspectLoan(loan)}
                                  className="btn btn--quiet btn--sm"
                                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem" }}
                                >
                                  Schedule
                                </button>
                                {canWrite && loan.status === "ACTIVE" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCollectLoanModal(loan);
                                      setCollectDraft({
                                        amount_bdt: loan.installment_bdt,
                                        date: today(),
                                        account_code: "1000",
                                        memo: "Cash installment repayment",
                                      });
                                    }}
                                    className="btn btn--primary btn--sm"
                                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem" }}
                                  >
                                    Repay Cash
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Loan schedule inspector drawer */}
              {selectedLoan && (
                <div className="panel panel--flush" style={{ marginTop: "var(--s-4)", border: "1px solid #D8543D" }}>
                  <div className="panel-head" style={{ borderBottom: "1px solid var(--line)" }}>
                    <div>
                      <div className="label" style={{ color: "#D8543D" }}>Amortization Schedule</div>
                      <h3 style={{ fontSize: "var(--t-lg)", fontWeight: 700, margin: "2px 0 0 0" }}>
                        {selectedLoan.kind === "LOAN" ? "Loan Schedule" : "Advance Details"}: {selectedLoan.doc_no}
                      </h3>
                      <p className="note" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
                        Staff: {selectedLoan.staff_name} ({selectedLoan.staff_code}) · Principal: ৳{selectedLoan.principal_bdt} · Total Interest: ৳{selectedLoan.total_interest_bdt} · Outstanding: ৳{selectedLoan.outstanding_bdt}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedLoan(null)}
                      className="btn btn--quiet btn--sm"
                    >
                      Close ✕
                    </button>
                  </div>

                  <div style={{ padding: "var(--s-4)" }}>
                    <div className="ledger-scroll">
                      <table className="ledger">
                        <thead>
                          <tr>
                            <th scope="col">#</th>
                            <th scope="col">Due Date</th>
                            <th scope="col" className="num">Installment BDT</th>
                            <th scope="col" className="num">Principal Part</th>
                            <th scope="col" className="num">Interest Part</th>
                            <th scope="col" className="num">Paid BDT</th>
                            <th scope="col">Status</th>
                            <th scope="col">Paid On</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedLoan.schedule || []).map((inst: LoanInstallment) => (
                            <tr key={inst.id}>
                              <td className="mono">{inst.seq}</td>
                              <td style={{ color: "#6E6A62" }}>{inst.due_date}</td>
                              <td className="num mono" style={{ fontWeight: 600 }}>
                                <Amount value={inst.amount_bdt} />
                              </td>
                              <td className="num mono" style={{ color: "#6E6A62" }}>
                                <Amount value={inst.principal_bdt} />
                              </td>
                              <td className="num mono" style={{ color: "#6E6A62" }}>
                                <Amount value={inst.interest_bdt} />
                              </td>
                              <td className="num mono" style={{ fontWeight: 700, color: "#2E7D32" }}>
                                <Amount value={inst.paid_bdt} />
                              </td>
                              <td>
                                <span className={`chip ${inst.status === "PAID" ? "chip--ok" : "chip--brand"}`}>
                                  {inst.status}
                                </span>
                              </td>
                              <td style={{ color: "#6E6A62" }}>{inst.paid_on || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: STAFF LEDGER */}
          {tab === "ledger" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Select Employee:
                </label>
                <select
                  value={ledgerStaffId}
                  onChange={(e) => setLedgerStaffId(e.target.value)}
                  className="input max-w-sm"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) - {s.designation || "Staff"}
                    </option>
                  ))}
                </select>
              </div>

              {ledgerLoading ? (
                <div className="py-8 text-center text-sm text-zinc-500">Loading ledger records...</div>
              ) : staffLedgerData ? (
                <div className="stack">
                  {/* Ledger totals */}
                  <div className="staff-kpi-grid">
                    <div className="staff-kpi-card">
                      <div className="label">Gross Salary Accrued</div>
                      <div style={{ fontSize: "var(--t-md)", fontWeight: 700, marginTop: "4px" }}>
                        <Amount value={staffLedgerData.totals.gross_bdt} />
                      </div>
                    </div>
                    <div className="staff-kpi-card">
                      <div className="label">Total Deductions</div>
                      <div style={{ fontSize: "var(--t-md)", fontWeight: 700, color: "#6E6A62", marginTop: "4px" }}>
                        <Amount value={staffLedgerData.totals.deductions_bdt} />
                      </div>
                    </div>
                    <div className="staff-kpi-card">
                      <div className="label">Net Salary Paid Out</div>
                      <div style={{ fontSize: "var(--t-md)", fontWeight: 700, color: "#2E7D32", marginTop: "4px" }}>
                        <Amount value={staffLedgerData.totals.net_paid_bdt} />
                      </div>
                    </div>
                    <div className="staff-kpi-card">
                      <div className="label">Net Payable Remaining</div>
                      <div style={{ fontSize: "var(--t-md)", fontWeight: 700, color: "#D8543D", marginTop: "4px" }}>
                        <Amount value={staffLedgerData.totals.net_payable_bdt} />
                      </div>
                    </div>
                  </div>

                  {/* Transaction Ledger Table */}
                  <div className="panel panel--flush">
                    <div className="ledger-scroll">
                      <table className="ledger">
                        <thead>
                          <tr>
                            <th scope="col">Date</th>
                            <th scope="col">Kind</th>
                            <th scope="col">Reference</th>
                            <th scope="col">Memo</th>
                            <th scope="col">Direction</th>
                            <th scope="col" className="num">Amount BDT</th>
                            <th scope="col">Settled</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffLedgerData.rows.length === 0 ? (
                            <tr>
                              <td colSpan={7} style={{ textAlign: "center", padding: "var(--s-6)", color: "#8E887E" }}>
                                No financial ledger transactions for this employee yet.
                              </td>
                            </tr>
                          ) : (
                            staffLedgerData.rows.map((row, idx) => (
                              <tr key={idx}>
                                <td style={{ color: "#6E6A62" }}>{row.date}</td>
                                <td>
                                  <span className="chip">
                                    {row.kind}
                                  </span>
                                </td>
                                <td className="mono" style={{ fontSize: "var(--t-xs)", color: "#6E6A62" }}>{row.ref}</td>
                                <td style={{ color: "#141514" }}>{row.memo}</td>
                                <td>
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      fontWeight: 700,
                                      color: row.direction === "OUT" ? "#D8543D" : "#2E7D32",
                                    }}
                                  >
                                    {row.direction}
                                  </span>
                                </td>
                                <td className="num mono" style={{ fontWeight: 600 }}>
                                  <Amount value={row.amount_bdt} />
                                </td>
                                <td>
                                  {row.settled ? (
                                    <span className="chip chip--ok">✓ Settled</span>
                                  ) : (
                                    <span className="chip chip--brand">Pending</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </>
      )}

      {/* MODAL: Add / Edit Staff */}
      <Modal
        isOpen={showStaffModal}
        onClose={() => {
          setShowStaffModal(false);
          setEditingStaff(null);
        }}
        eyebrow="Employee Master"
        title={editingStaff ? "Edit Employee Profile" : "Add New Employee"}
        description="Configure employee details, designation, segment, and monthly gross base."
        maxWidth="34rem"
      >
        <form onSubmit={handleSaveStaff} style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s-3)" }}>
            <div className="field">
              <label className="label">Employee Code</label>
              <input
                type="text"
                required
                disabled={!!editingStaff}
                value={staffDraft.code}
                onChange={(e) => setStaffDraft({ ...staffDraft, code: e.target.value })}
                className="mono"
              />
            </div>
            <div className="field">
              <label className="label">Status</label>
              <select
                value={staffDraft.status}
                onChange={(e) =>
                  setStaffDraft({ ...staffDraft, status: e.target.value as "ACTIVE" | "INACTIVE" })
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label className="label">Full Name</label>
            <input
              type="text"
              required
              value={staffDraft.name}
              onChange={(e) => setStaffDraft({ ...staffDraft, name: e.target.value })}
              placeholder="e.g. Tariqul Islam"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s-3)" }}>
            <div className="field">
              <label className="label">Designation</label>
              <input
                type="text"
                value={staffDraft.designation}
                onChange={(e) => setStaffDraft({ ...staffDraft, designation: e.target.value })}
                placeholder="e.g. Senior Accountant"
              />
            </div>
            <div className="field">
              <label className="label">Branch / Segment</label>
              <input
                type="text"
                value={staffDraft.branch}
                onChange={(e) => setStaffDraft({ ...staffDraft, branch: e.target.value })}
                placeholder="e.g. Head Office"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s-3)" }}>
            <div className="field">
              <label className="label">Joining Date</label>
              <input
                type="date"
                required
                value={staffDraft.joining_date}
                onChange={(e) => setStaffDraft({ ...staffDraft, joining_date: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="label">Monthly Gross Base (BDT)</label>
              <input
                type="number"
                step="0.01"
                required
                value={staffDraft.monthly_salary_bdt}
                onChange={(e) => setStaffDraft({ ...staffDraft, monthly_salary_bdt: e.target.value })}
                className="mono"
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--s-2)", paddingTop: "var(--s-3)", borderTop: "1px solid var(--line)" }}>
            <button
              type="button"
              onClick={() => {
                setShowStaffModal(false);
                setEditingStaff(null);
              }}
              className="btn btn--quiet btn--sm"
            >
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn btn--primary btn--sm">
              {busy ? "Saving…" : "Save Employee"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Payroll Run Wizard */}
      <Modal
        isOpen={showRunModal}
        onClose={() => {
          setShowRunModal(false);
          setRunPreview(null);
        }}
        eyebrow="Statutory Accrual"
        title="Generate Monthly Payroll Run"
        description="Calculates salary accruals, automatic loan installment deductions, and advance recoveries. Balanced entry: DR 5100 / CR 2300, 1600, 4100, 2200."
        maxWidth="44rem"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s-3)" }}>
            <div className="field">
              <label className="label">Payroll Month</label>
              <input
                type="month"
                value={runPeriod}
                onChange={(e) => {
                  setRunPeriod(e.target.value);
                  void loadPreview(e.target.value, runExpenseAccount);
                }}
                className="mono"
              />
            </div>
            <div className="field">
              <label className="label">Salaries Expense Account</label>
              <select
                value={runExpenseAccount}
                onChange={(e) => {
                  setRunExpenseAccount(e.target.value);
                  void loadPreview(runPeriod, e.target.value);
                }}
                className="mono"
              >
                {accounts
                  .filter((a) => a.type === "EXPENSE")
                  .map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} - {a.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {previewLoading ? (
            <div style={{ padding: "var(--s-6) 0", textAlign: "center", fontSize: "var(--t-sm)", color: "#6E6A62" }}>Calculating preview…</div>
          ) : runPreview ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
              <div className="staff-kpi-grid">
                <div className="staff-kpi-card">
                  <div className="label">Eligible Staff</div>
                  <div style={{ fontSize: "var(--t-lg)", fontWeight: 700, marginTop: "2px" }}>{runPreview.staff_count}</div>
                </div>
                <div className="staff-kpi-card">
                  <div className="label">Gross Salaries</div>
                  <div className="mono" style={{ fontSize: "var(--t-md)", fontWeight: 700, marginTop: "2px" }}>
                    <Amount value={runPreview.gross_bdt} />
                  </div>
                </div>
                <div className="staff-kpi-card">
                  <div className="label">Deductions</div>
                  <div className="mono" style={{ fontSize: "var(--t-md)", fontWeight: 700, color: "#6E6A62", marginTop: "2px" }}>
                    <Amount value={runPreview.deductions_bdt} />
                  </div>
                </div>
                <div className="staff-kpi-card">
                  <div className="label">Net Payable</div>
                  <div className="mono" style={{ fontSize: "var(--t-md)", fontWeight: 700, color: "#D8543D", marginTop: "2px" }}>
                    <Amount value={runPreview.net_bdt} />
                  </div>
                </div>
              </div>

              <div className="panel panel--flush" style={{ maxHeight: "200px", overflowY: "auto" }}>
                <div className="ledger-scroll">
                  <table className="ledger">
                    <thead>
                      <tr>
                        <th scope="col">Employee</th>
                        <th scope="col" className="num">Gross</th>
                        <th scope="col" className="num">Loan / Adv Rec.</th>
                        <th scope="col" className="num">Net Payable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runPreview.payslips.map((p, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{p.staff_name}</td>
                          <td className="num mono"><Amount value={p.gross_bdt} /></td>
                          <td className="num mono" style={{ color: "#6E6A62" }}>
                            <Amount
                              value={(
                                parseFloat(p.loan_principal_bdt) + parseFloat(p.advance_bdt)
                              ).toFixed(2)}
                            />
                          </td>
                          <td className="num mono" style={{ fontWeight: 700, color: "#141514" }}>
                            <Amount value={p.net_bdt} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--s-2)", paddingTop: "var(--s-3)", borderTop: "1px solid var(--line)" }}>
            <button
              type="button"
              onClick={() => {
                setShowRunModal(false);
                setRunPreview(null);
              }}
              className="btn btn--quiet btn--sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePostRun}
              disabled={busy || !runPreview || runPreview.staff_count === 0}
              className="btn btn--primary btn--sm"
            >
              {busy ? "Posting…" : `Post Payroll Run for ${runPeriod}`}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Pay Payroll Run */}
      <Modal
        isOpen={payRunModal !== null}
        onClose={() => setPayRunModal(null)}
        eyebrow="Treasury Settlement"
        title="Disburse Payroll Payment"
        description={`Settles Salaries Payable (2300) and credits cash or bank: DR 2300 ৳${payRunModal?.net_bdt ?? "0.00"} / CR Treasury.`}
        maxWidth="32rem"
      >
        {payRunModal && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
            <div className="field">
              <label className="label">Pay From Treasury Account</label>
              <select
                value={payAccountCode}
                onChange={(e) => setPayAccountCode(e.target.value)}
                className="mono"
              >
                {accounts
                  .filter((a) => a.code === "1000" || a.code === "1010" || a.type === "ASSET")
                  .map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} - {a.name}
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ padding: "var(--s-3)", backgroundColor: "var(--surface-2)", borderRadius: "8px", border: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "var(--t-xs)" }}>
                <span style={{ color: "#6E6A62" }}>Run Period:</span>
                <span className="mono" style={{ fontWeight: 600 }}>{payRunModal.period_key}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--t-xs)" }}>
                <span style={{ color: "#6E6A62" }}>Total Net Disbursed:</span>
                <span className="mono" style={{ fontWeight: 700, color: "#2E7D32", fontSize: "var(--t-sm)" }}>
                  <Amount value={payRunModal.net_bdt} />
                </span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--s-2)", paddingTop: "var(--s-3)", borderTop: "1px solid var(--line)" }}>
              <button
                type="button"
                onClick={() => setPayRunModal(null)}
                className="btn btn--quiet btn--sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePayRun}
                disabled={busy}
                className="btn btn--primary btn--sm"
              >
                {busy ? "Processing…" : "Confirm & Pay Run"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: Reverse Run */}
      <Modal
        isOpen={reverseRunModal !== null}
        onClose={() => setReverseRunModal(null)}
        eyebrow="Audit Rollback"
        title={`Reverse Payroll Run (${reverseRunModal?.period_key})`}
        description="This voids the accrual entry (and payment if paid), restores all claimed loan installments back to DUE, and marks all payslips REVERSED."
        maxWidth="32rem"
      >
        {reverseRunModal && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
            <div className="field">
              <label className="label">Reason for Reversal *</label>
              <textarea
                required
                rows={3}
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                placeholder="State the audit reason for reversing this payroll run…"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--s-2)", paddingTop: "var(--s-3)", borderTop: "1px solid var(--line)" }}>
              <button
                type="button"
                onClick={() => setReverseRunModal(null)}
                className="btn btn--quiet btn--sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReverseRun}
                disabled={busy || !reverseReason.trim()}
                className="btn btn--danger btn--sm"
              >
                {busy ? "Reversing…" : "Confirm Reversal"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: Disburse Loan / Advance */}
      <Modal
        isOpen={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        eyebrow="Staff Financing"
        title="Disburse Staff Loan / Advance"
        description="Issue structured employee loans with amortization schedule or salary advances against treasury accounts."
        maxWidth="36rem"
      >
        <form onSubmit={handleCreateLoan} style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
          <div className="field">
            <label className="label">Employee</label>
            <select
              required
              value={loanDraft.staff_id}
              onChange={(e) => setLoanDraft({ ...loanDraft, staff_id: e.target.value })}
            >
              <option value="">Select Employee</option>
              {staffList
                .filter((s) => s.status === "ACTIVE")
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s-3)" }}>
            <div className="field">
              <label className="label">Instrument Kind</label>
              <select
                value={loanDraft.kind}
                onChange={(e) =>
                  setLoanDraft({
                    ...loanDraft,
                    kind: e.target.value as "LOAN" | "ADVANCE",
                  })
                }
              >
                <option value="LOAN">Loan (with schedule & interest)</option>
                <option value="ADVANCE">Salary Advance (0% interest)</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Disbursed From</label>
              <select
                value={loanDraft.account_code}
                onChange={(e) => setLoanDraft({ ...loanDraft, account_code: e.target.value })}
                className="mono"
              >
                <option value="1010">1010 - Bank Account</option>
                <option value="1000">1000 - Cash on Hand</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s-3)" }}>
            <div className="field">
              <label className="label">Principal Amount (BDT)</label>
              <input
                type="number"
                step="0.01"
                required
                value={loanDraft.principal_bdt}
                onChange={(e) => setLoanDraft({ ...loanDraft, principal_bdt: e.target.value })}
                className="mono"
              />
            </div>
            <div className="field">
              <label className="label">Disbursement Date</label>
              <input
                type="date"
                required
                value={loanDraft.disbursed_on}
                onChange={(e) => setLoanDraft({ ...loanDraft, disbursed_on: e.target.value })}
              />
            </div>
          </div>

          {loanDraft.kind === "LOAN" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s-3)", padding: "var(--s-3)", backgroundColor: "var(--surface-2)", borderRadius: "8px", border: "1px solid var(--line)" }}>
              <div className="field">
                <label className="label">Annual Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={loanDraft.interest_rate_percent}
                  onChange={(e) =>
                    setLoanDraft({ ...loanDraft, interest_rate_percent: e.target.value })
                  }
                  className="mono"
                />
              </div>
              <div className="field">
                <label className="label">Term (Months)</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  required
                  value={loanDraft.term_months}
                  onChange={(e) =>
                    setLoanDraft({ ...loanDraft, term_months: Number(e.target.value) })
                  }
                  className="mono"
                />
              </div>
            </div>
          )}

          <div className="field">
            <label className="label">Notes <span className="faint">optional</span></label>
            <input
              type="text"
              value={loanDraft.notes}
              onChange={(e) => setLoanDraft({ ...loanDraft, notes: e.target.value })}
              placeholder="Reference memo or instrument notes"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--s-2)", paddingTop: "var(--s-3)", borderTop: "1px solid var(--line)" }}>
            <button
              type="button"
              onClick={() => setShowLoanModal(false)}
              className="btn btn--quiet btn--sm"
            >
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn btn--primary btn--sm">
              {busy ? "Disbursing…" : "Disburse Instrument"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Cash Repayment on Loan */}
      <Modal
        isOpen={collectLoanModal !== null}
        onClose={() => setCollectLoanModal(null)}
        eyebrow="Cash Collection"
        title="Collect Cash Repayment"
        description="Record cash received directly outside of payroll deduction: DR Cash / CR 1600 (Principal) + CR 4100 (Interest)."
        maxWidth="32rem"
      >
        {collectLoanModal && (
          <form onSubmit={handleCollectLoan} style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
            <div className="field">
              <label className="label">Repayment Amount (BDT)</label>
              <input
                type="number"
                step="0.01"
                required
                value={collectDraft.amount_bdt}
                onChange={(e) => setCollectDraft({ ...collectDraft, amount_bdt: e.target.value })}
                className="mono"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s-3)" }}>
              <div className="field">
                <label className="label">Date Received</label>
                <input
                  type="date"
                  required
                  value={collectDraft.date}
                  onChange={(e) => setCollectDraft({ ...collectDraft, date: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="label">Deposit Account</label>
                <select
                  value={collectDraft.account_code}
                  onChange={(e) =>
                    setCollectDraft({ ...collectDraft, account_code: e.target.value })
                  }
                  className="mono"
                >
                  <option value="1000">1000 - Cash</option>
                  <option value="1010">1010 - Bank</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label className="label">Memo / Reference</label>
              <input
                type="text"
                value={collectDraft.memo}
                onChange={(e) => setCollectDraft({ ...collectDraft, memo: e.target.value })}
                placeholder="e.g. Counter cash deposit"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--s-2)", paddingTop: "var(--s-3)", borderTop: "1px solid var(--line)" }}>
              <button
                type="button"
                onClick={() => setCollectLoanModal(null)}
                className="btn btn--quiet btn--sm"
              >
                Cancel
              </button>
              <button type="submit" disabled={busy} className="btn btn--primary btn--sm">
                {busy ? "Recording…" : "Record Repayment"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: Full Payslip Document Viewer */}
      <Modal
        isOpen={inspectPayslip !== null}
        onClose={() => setInspectPayslip(null)}
        eyebrow="Payslip Document"
        title={inspectPayslip?.doc_no || "Draft Payslip"}
        description={`Formal statutory payslip statement for ${inspectPayslip?.staff_name || "Employee"}.`}
        maxWidth="36rem"
      >
        {inspectPayslip && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s-3)", padding: "var(--s-3)", backgroundColor: "var(--surface-2)", borderRadius: "8px", border: "1px solid var(--line)" }}>
              <div>
                <span className="label">Employee</span>
                <div style={{ fontWeight: 600, fontSize: "var(--t-sm)", marginTop: "2px" }}>{inspectPayslip.staff_name}</div>
                <div className="mono" style={{ fontSize: "var(--t-xs)", color: "#6E6A62" }}>{inspectPayslip.staff_code}</div>
              </div>
              <div>
                <span className="label">Period & Status</span>
                <div className="mono" style={{ fontWeight: 600, fontSize: "var(--t-sm)", marginTop: "2px" }}>{inspectPayslip.period_key}</div>
                <div style={{ marginTop: "4px" }}>
                  <span className="chip chip--ok">{inspectPayslip.status}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid var(--line)", fontSize: "var(--t-xs)" }}>
                <span style={{ color: "#6E6A62" }}>Basic Salary:</span>
                <span className="mono" style={{ fontWeight: 600 }}><Amount value={inspectPayslip.basic_bdt} /></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid var(--line)", fontSize: "var(--t-xs)" }}>
                <span style={{ color: "#6E6A62" }}>Allowances & Bonuses:</span>
                <span className="mono" style={{ fontWeight: 600 }}><Amount value={inspectPayslip.allowances_bdt} /></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "var(--surface-2)", borderRadius: "6px", fontWeight: 700, fontSize: "var(--t-xs)" }}>
                <span>Gross Earnings:</span>
                <span className="mono"><Amount value={inspectPayslip.gross_bdt} /></span>
              </div>

              <div className="label" style={{ marginTop: "var(--s-2)", color: "#D8543D" }}>Deductions</div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid var(--line)", fontSize: "var(--t-xs)" }}>
                <span style={{ color: "#6E6A62" }}>Loan Principal Recovery:</span>
                <span className="mono" style={{ color: "#D8543D" }}><Amount value={inspectPayslip.loan_principal_bdt} /></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid var(--line)", fontSize: "var(--t-xs)" }}>
                <span style={{ color: "#6E6A62" }}>Salary Advance Recovery:</span>
                <span className="mono" style={{ color: "#D8543D" }}><Amount value={inspectPayslip.advance_bdt} /></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid var(--line)", fontSize: "var(--t-xs)" }}>
                <span style={{ color: "#6E6A62" }}>Loan Interest:</span>
                <span className="mono" style={{ color: "#6E6A62" }}><Amount value={inspectPayslip.loan_interest_bdt} /></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid var(--line)", fontSize: "var(--t-xs)" }}>
                <span style={{ color: "#6E6A62" }}>Withheld Tax:</span>
                <span className="mono" style={{ color: "#6E6A62" }}><Amount value={inspectPayslip.tax_bdt} /></span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", backgroundColor: "#F4EFE6", border: "1px solid #D8D2C5", borderRadius: "8px", fontWeight: 700 }}>
                <span>Net Salary Payable:</span>
                <span className="mono" style={{ fontSize: "var(--t-md)", color: "#141514" }}>
                  <Amount value={inspectPayslip.net_bdt} />
                </span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--s-2)", paddingTop: "var(--s-3)", borderTop: "1px solid var(--line)" }}>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn--quiet btn--sm"
              >
                Print Payslip
              </button>
              <button
                type="button"
                onClick={() => setInspectPayslip(null)}
                className="btn btn--primary btn--sm"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
