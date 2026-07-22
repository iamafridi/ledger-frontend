export const CATEGORIES = [
  "Clothing",
  "Education",
  "Entertainment",
  "Food",
  "Groceries",
  "Health",
  "Mobile",
  "Rent",
  "Transport",
  "Utilities",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** The four roles the API seeds. Mirrors `core/permissions.ts` on the server. */
export type Role = "OWNER" | "ADMIN" | "ACCOUNTANT" | "VIEWER";

/**
 * `GET /auth/me`, once per signed-in session.
 *
 * `permissions` is the authority the *server* holds for this caller. The client
 * renders navigation from it rather than guessing from the role, so what is
 * shown is exactly what is enforceable — a screen that would 403 is never
 * offered in the first place.
 */
export interface SessionInfo {
  uid: string;
  email: string | null;
  name: string | null;
  org: string;
  role: Role;
  permissions: string[];
  settings: {
    dps_annual_rate_percent: string;
    currency: string;
    /** Present only when a sample case has been loaded. */
    as_of_date?: string;
  };
}

export interface Expense {
  id: string;
  date: string;
  month: string;
  category: Category;
  shop: string;
  amount_bdt: string;
  source: "manual" | "receipt";
  note: string;
  /**
   * The journal entry this expense posted, or null when it is not in the books.
   *
   * Null is a repairable state rather than an error: the books are the single
   * source of truth (plan §4, D3), so an expense outside them is shown as such
   * and can be posted from the expenses screen.
   */
  journal_entry_id: string | null;
}

/** `GET /expenses/ledger-status` — how much of this account is in the books. */
export interface ExpenseLedgerStatus {
  total: number;
  unposted: number;
}

export interface Pocket {
  id: string;
  name: string;
  item: string;
  target_bdt: string;
  monthly_contribution_bdt: string;
  saved_bdt: string;
}

export interface CategoryLine {
  category: string;
  total_bdt: string;
  share_percent: string;
  count: number;
}

export interface MonthSummary {
  month: string;
  total_spent_bdt: string;
  expense_count: number;
  by_category: CategoryLine[];
  largest_expenses: Array<{
    id: string;
    date: string;
    category: string;
    shop: string;
    amount_bdt: string;
  }>;
}

export interface MonthComparison {
  this_month: MonthSummary;
  last_month: MonthSummary;
  delta_bdt: string;
  delta_percent: string | null;
  category_deltas: Array<{
    category: string;
    this_bdt: string;
    last_bdt: string;
    delta_bdt: string;
    delta_percent: string | null;
  }>;
}

export interface Forecast {
  today: string;
  days_elapsed: number;
  days_in_month: number;
  days_remaining: number;
  spent_to_date_bdt: string;
  daily_burn_bdt: string;
  projected_remaining_bdt: string;
  projected_month_total_bdt: string;
  salary_bdt: string;
  projected_end_position_bdt: string;
  projected_short: boolean;
  projected_end_position_after_pockets_bdt: string;
  total_pocket_contribution_bdt: string;
}

export interface Insight {
  id: string;
  severity: "critical" | "warning" | "info";
  text: string;
  evidence: {
    category?: string;
    amount_bdt?: string;
    percent?: string;
    comparison_bdt?: string;
  };
}

export interface DpsMonth {
  month_index: number;
  opening_balance_bdt: string;
  deposit_bdt: string;
  balance_after_deposit_bdt: string;
  interest_bdt: string;
  closing_balance_bdt: string;
}

export interface DpsResult {
  annual_rate_percent: string;
  monthly_deposit_bdt: string;
  months: number;
  schedule: DpsMonth[];
  total_deposited_bdt: string;
  total_interest_bdt: string;
  maturity_value_bdt: string;
}

export interface PocketProjection {
  pocket: { id: string; name: string; item: string; target_bdt: string; monthly_contribution_bdt: string };
  months_to_target: number | null;
  expected_completion_date: string;
  expected_completion_month: string;
  plain_total_bdt: string;
  dps: DpsResult;
  dps_gain_bdt: string;
  months_to_target_with_dps: number | null;
  affordable_this_month: boolean;
  affordable_monthly_bdt: string;
  forecast_months_to_target: number | null;
  forecast_completion_date: string;
  on_track: boolean;
}

export interface LedgerReport {
  case_id: string;
  comparison: MonthComparison;
  forecast: Forecast;
  insights: Insight[];
  pockets: PocketProjection[];
}

export interface Dashboard {
  month: string;
  last_month: string;
  today: string;
  dps_annual_rate_percent: string;
  dps_rule: string;
  report: LedgerReport;
}

export type FieldConfidence = "high" | "medium" | "low";

export interface ExtractedField<T> {
  value: T | null;
  confidence: FieldConfidence;
  raw: string | null;
}

export interface ReceiptExtraction {
  amount: ExtractedField<string>;
  date: ExtractedField<string>;
  shop: ExtractedField<string>;
  category: ExtractedField<string>;
  error: string | null;
}

export interface ScanResult {
  provider: string;
  extraction: ReceiptExtraction;
  review_required?: boolean;
}

/* ── Accounting core (Phase 1) ──────────────────────────────────────────────
 *
 * The ledger's own shapes. Everything here is read from `/coa`, `/periods`,
 * `/journals` and `/reports`, and every amount is the API's canonical 2dp
 * string — the client renders these figures, it never computes them.
 */

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
export type NormalBalance = "DEBIT" | "CREDIT";

/** The five-way split, in the order a trial balance reads. */
export const ACCOUNT_TYPES: AccountType[] = [
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "REVENUE",
  "EXPENSE",
];

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  subtype: string;
  parent_id: string | null;
  normal_balance: NormalBalance;
  /** Part of the chart's own structure. Renameable, never re-coded or removed. */
  is_system: boolean;
  is_active: boolean;
}

export interface AccountingPeriod {
  id: string;
  key: string;
  fiscal_year_id: string;
  status: "OPEN" | "CLOSED";
  closed_at: string | null;
  closed_by: string;
  close_note: string;
}

export interface FiscalYear {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  status: "OPEN" | "CLOSED";
  periods: AccountingPeriod[];
}

export interface JournalLine {
  id: string;
  account_id: string;
  account_code: string;
  account_name: string;
  debit_bdt: string;
  credit_bdt: string;
  memo: string;
  party_id: string;
}

export interface JournalEntry {
  id: string;
  /** Null for a draft — numbers are claimed at post, never before. */
  entry_no: string | null;
  date: string;
  period_key: string;
  description: string;
  source: string;
  source_id: string;
  status: "DRAFT" | "POSTED" | "VOID";
  reverses_entry_id: string | null;
  reversed_by_entry_id: string | null;
  void_reason: string;
  created_by: string;
  posted_by: string;
  posted_at: string | null;
  total_bdt: string;
  lines: JournalLine[];
}

/** A register row: the entry's header without its lines. */
export interface JournalSummary {
  id: string;
  entry_no: string | null;
  date: string;
  period_key: string;
  description: string;
  source: string;
  status: "DRAFT" | "POSTED" | "VOID";
  total_bdt: string;
  line_count: number;
  void_reason: string;
}

/** Heterogeneous report cell. Money arrives as a canonical 2dp string. */
export type ReportCell = string | number | boolean | null;
export type ReportRow = Record<string, ReportCell>;

export interface ReportColumn {
  key: string;
  label: string;
  type: "text" | "money" | "date" | "number" | "code";
}

/** One parameter a report declares it accepts — the server owns this, not the
 *  client, so a new report needs no runner change. */
export interface ReportParam {
  key: string;
  label: string;
  kind: "date" | "account" | "party" | "choice" | "month";
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

/** A catalog entry: the report's definition without its rows. */
export interface ReportDefinitionSummary {
  code: string;
  name: string;
  group: string;
  description: string;
  columns: ReportColumn[];
  params: ReportParam[];
  /** The money columns a footer total means something for. */
  additive: string[];
}

/* ── Master data (Phase 2) ────────────────────────────────────────────────
 *
 * The vocabulary documents are written in: who you buy from and sell to, what
 * is being traded, and the catalogs (units, tax rates, categories) their lines
 * snapshot from. Mirrors `modules/masterdata` on the server.
 */

export type PartyKind = "CUSTOMER" | "SUPPLIER" | "BOTH";

export const PARTY_KINDS: PartyKind[] = ["CUSTOMER", "SUPPLIER", "BOTH"];

export const PARTY_KIND_LABEL: Record<PartyKind, string> = {
  CUSTOMER: "Customer",
  SUPPLIER: "Supplier",
  BOTH: "Both",
};

export interface Party {
  id: string;
  /** Short, human-typed identity. Unique per org, fixed after creation. */
  code: string;
  name: string;
  kind: PartyKind;
  email: string;
  phone: string;
  address: string;
  /** The chart account this party's balance posts to (1100 AR / 2000 AP). */
  control_account_code: string;
  control_account_name: string;
  /** How much credit this customer may run up. "0.00" means no limit is set. */
  credit_limit_bdt: string;
  is_active: boolean;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  description: string;
  track_stock: boolean;
  unit_id: string | null;
  unit_name: string;
  /** At or below this many on hand the stock screen calls the item low. 0
   *  means "only out of stock counts" — a threshold somebody chose, or none. */
  reorder_level: number;
  /** Default tax rate by code; "" means no tax. */
  tax_code: string;
  tax_name: string;
  tax_rate_percent: string;
  income_account_code: string;
  income_account_name: string;
  cogs_account_code: string;
  cogs_account_name: string;
  expense_account_code: string;
  expense_account_name: string;
  is_active: boolean;
}

export interface CatalogUnit {
  id: string;
  name: string;
  symbol: string;
  is_active: boolean;
}

/**
 * How a rate is used. VAT is added to a document line; WITHHOLDING is deducted
 * from a supplier payment and owed to the tax office instead (P7).
 */
export type TaxKind = "VAT" | "WITHHOLDING";

export const TAX_KIND_LABEL: Record<TaxKind, string> = {
  VAT: "VAT",
  WITHHOLDING: "Withholding",
};

export interface CatalogTaxRate {
  id: string;
  code: string;
  name: string;
  kind: TaxKind;
  /** Canonical 2dp string — never a number; it feeds money arithmetic. */
  rate_percent: string;
  is_active: boolean;
}

export interface CatalogCategory {
  id: string;
  name: string;
  kind: "EXPENSE" | "INCOME";
  account_code: string;
  account_name: string;
  is_active: boolean;
}

export type VatMode = "NONE" | "EXCLUSIVE" | "INCLUSIVE";

export const VAT_MODE_LABEL: Record<VatMode, string> = {
  NONE: "No tax charged",
  EXCLUSIVE: "Tax added on top of line amounts",
  INCLUSIVE: "Line amounts include tax",
};

/** The org's claim on the sequence format: "" keeps the plain `2026-01`. */
export interface NumberingPrefixes {
  journal: string;
  invoice: string;
  bill: string;
  receipt: string;
  credit_note: string;
  payment: string;
  debit_note: string;
  transfer: string;
  challan: string;
  tax_certificate: string;
}

/** `GET /settings/org` — the profile every document prints. */
export interface OrgProfile {
  name: string;
  base_currency: string;
  address: string;
  logo_url: string;
  bin: string;
  vat_mode: VatMode;
  numbering_prefixes: NumberingPrefixes;
}

/* ── Sales & Accounts Receivable (P3) ─────────────────────────────────────── */

/**
 * The invoice lifecycle, in the order a document moves through it.
 *
 * `PARTIALLY_PAID` and `PAID` are not states anybody sets: the API derives them
 * from the receipts and credit notes pointed at the invoice, which is why there is
 * no endpoint here that could put an invoice in one of them by hand.
 */
export const INVOICE_STATUSES = ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "VOID"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  PARTIALLY_PAID: "Part paid",
  PAID: "Paid",
  VOID: "Void",
};

/** One line of a document. Amounts are canonical 2dp strings from §5.4. */
export interface InvoiceLine {
  id: string;
  sort_order: number;
  label_snapshot: string;
  description: string;
  /** A physical quantity, not money — 1.5 kg is a legitimate line. */
  qty: number;
  unit_price_bdt: string;
  discount_bdt: string;
  net_bdt: string;
  tax_code: string;
  tax_rate_snapshot: string;
  tax_bdt: string;
  line_total_bdt: string;
  account_code: string;
  account_name: string;
  item_id: string | null;
  /** A line that subtracts. Its stored amounts are positive. */
  is_deduction: boolean;
}

export interface Invoice {
  id: string;
  /** Null until the invoice is issued — a draft claims no number. */
  doc_no: string | null;
  party_id: string;
  party_code: string;
  party_name: string;
  date: string;
  due_date: string;
  memo: string;
  status: InvoiceStatus;
  subtotal_bdt: string;
  discount_total_bdt: string;
  tax_total_bdt: string;
  total_bdt: string;
  paid_bdt: string;
  credited_bdt: string;
  outstanding_bdt: string;
  days_overdue: number;
  is_overdue: boolean;
  journal_entry_id: string | null;
  void_reason: string;
  lines: InvoiceLine[];
}

/** Non-blocking advice returned alongside a write. */
export interface DocumentWarning {
  code: string;
  message: string;
}

export interface ReceiptAllocation {
  id: string;
  invoice_id: string;
  invoice_no: string | null;
  amount_bdt: string;
}

export interface Receipt {
  id: string;
  doc_no: string;
  party_id: string;
  party_code: string;
  party_name: string;
  date: string;
  method: "CASH" | "BANK";
  account_code: string;
  account_name: string;
  amount_bdt: string;
  allocated_bdt: string;
  /** The customer's advance: paid, not yet claimed by an invoice. */
  unallocated_bdt: string;
  memo: string;
  journal_entry_id: string | null;
  allocations: ReceiptAllocation[];
}

export interface CreditNote {
  id: string;
  doc_no: string;
  invoice_id: string;
  invoice_no: string | null;
  party_id: string;
  party_code: string;
  party_name: string;
  date: string;
  reason: string;
  status: "ISSUED" | "VOID";
  subtotal_bdt: string;
  tax_total_bdt: string;
  total_bdt: string;
  journal_entry_id: string | null;
  void_reason: string;
  lines: InvoiceLine[];
}

export const AGING_BUCKET_KEYS = ["current", "d1_30", "d31_60", "d61_90", "d90_plus"] as const;
export type AgingBucketKey = (typeof AGING_BUCKET_KEYS)[number];

/** The column each bucket's total is read from, so a header cannot be wired to
 *  the wrong column. The bucket columns have the same names on both sides of the
 *  ledger, so one table serves the AR and AP aging rows alike. */
export interface AgingBucketColumns {
  current_bdt: string;
  d1_30_bdt: string;
  d31_60_bdt: string;
  d61_90_bdt: string;
  d90_plus_bdt: string;
}

export const AGING_BUCKET_FIELD: Record<AgingBucketKey, keyof AgingBucketColumns> = {
  current: "current_bdt",
  d1_30: "d1_30_bdt",
  d31_60: "d31_60_bdt",
  d61_90: "d61_90_bdt",
  d90_plus: "d90_plus_bdt",
};

export interface OutstandingInvoice {
  id: string;
  doc_no: string | null;
  party_id: string;
  party_code: string;
  party_name: string;
  date: string;
  due_date: string;
  total_bdt: string;
  outstanding_bdt: string;
  days_overdue: number;
  bucket: AgingBucketKey;
}

export interface AgingPartyRow extends AgingBucketColumns {
  party_id: string;
  party_code: string;
  party_name: string;
  total_bdt: string;
  invoice_count: number;
}

export interface AgingReport {
  as_of: string;
  buckets: { key: string; label: string }[];
  parties: AgingPartyRow[];
  totals: AgingPartyRow;
  /** The invoice detail the party rows are summed from. */
  invoices: OutstandingInvoice[];
}

export interface StatementMovement {
  date: string;
  type: "INVOICE" | "RECEIPT" | "CREDIT_NOTE";
  doc_no: string | null;
  description: string;
  debit_bdt: string;
  credit_bdt: string;
  /** The balance after this movement, so the statement reads down the page. */
  balance_bdt: string;
}

export interface Statement {
  party_id: string;
  party_code: string;
  party_name: string;
  from: string | null;
  to: string | null;
  opening_bdt: string;
  closing_bdt: string;
  movements: StatementMovement[];
  advance_bdt: string;
}

export interface CreditStatus {
  party_id: string;
  party_code: string;
  party_name: string;
  balance_bdt: string;
  credit_limit_bdt: string;
  /** Limit minus balance; negative when the customer is over it. */
  available_bdt: string;
  over_limit: boolean;
  overdue_bdt: string;
  oldest_overdue_days: number;
  open_invoice_count: number;
  advance_bdt: string;
}

/* ── Purchases & Accounts Payable (P4) ───────────────────────────────────────
 *
 * The mirror of the sales shapes one desk over. A bill is an invoice seen from
 * the paying side: the same lifecycle, the same line arithmetic, the settlement
 * fields renamed for the direction (`debited_bdt` where a receivable says
 * `credited_bdt`), and the statement columns flipped — a bill credits what we
 * owe, a payment and a debit note debit it.
 */

export const BILL_STATUSES = ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "VOID"] as const;
export type BillStatus = (typeof BILL_STATUSES)[number];

export const BILL_STATUS_LABEL: Record<BillStatus, string> = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  PARTIALLY_PAID: "Part paid",
  PAID: "Paid",
  VOID: "Void",
};

export interface Bill {
  id: string;
  /** Null until the bill is issued — a draft claims no number. */
  doc_no: string | null;
  party_id: string;
  party_code: string;
  party_name: string;
  date: string;
  due_date: string;
  memo: string;
  status: BillStatus;
  subtotal_bdt: string;
  discount_total_bdt: string;
  tax_total_bdt: string;
  total_bdt: string;
  paid_bdt: string;
  debited_bdt: string;
  outstanding_bdt: string;
  days_overdue: number;
  is_overdue: boolean;
  journal_entry_id: string | null;
  void_reason: string;
  lines: InvoiceLine[];
}

export interface PaymentAllocation {
  id: string;
  bill_id: string;
  bill_no: string | null;
  amount_bdt: string;
}

export interface PaymentWithholding {
  tax_code: string;
  tax_rate_snapshot: string;
  amount_bdt: string;
}

export interface Payment {
  id: string;
  doc_no: string;
  party_id: string;
  party_code: string;
  party_name: string;
  date: string;
  method: "CASH" | "BANK";
  account_code: string;
  account_name: string;
  /** What the payment settles on the supplier's account, before withholding. */
  amount_bdt: string;
  allocated_bdt: string;
  /** The prepayment: paid, not yet claimed by a bill. */
  unallocated_bdt: string;
  /** Withheld and owed to the tax office instead of the supplier (P7). */
  withheld_bdt: string;
  /** What actually left the bank: `amount − withheld`. */
  cash_bdt: string;
  withholdings: PaymentWithholding[];
  memo: string;
  journal_entry_id: string | null;
  allocations: PaymentAllocation[];
}

export interface DebitNote {
  id: string;
  doc_no: string;
  bill_id: string;
  bill_no: string | null;
  party_id: string;
  party_code: string;
  party_name: string;
  date: string;
  reason: string;
  status: "ISSUED" | "VOID";
  subtotal_bdt: string;
  tax_total_bdt: string;
  total_bdt: string;
  journal_entry_id: string | null;
  void_reason: string;
  lines: InvoiceLine[];
}

export interface OutstandingBill {
  id: string;
  doc_no: string | null;
  party_id: string;
  party_code: string;
  party_name: string;
  date: string;
  due_date: string;
  total_bdt: string;
  outstanding_bdt: string;
  days_overdue: number;
  bucket: AgingBucketKey;
}

export interface ApAgingPartyRow extends AgingBucketColumns {
  party_id: string;
  party_code: string;
  party_name: string;
  total_bdt: string;
  bill_count: number;
}

export interface ApAgingReport {
  as_of: string;
  buckets: { key: string; label: string }[];
  parties: ApAgingPartyRow[];
  totals: ApAgingPartyRow;
  /** The bill detail the party rows are summed from. */
  bills: OutstandingBill[];
}

export interface SupplierMovement {
  date: string;
  type: "BILL" | "PAYMENT" | "DEBIT_NOTE";
  doc_no: string | null;
  description: string;
  debit_bdt: string;
  credit_bdt: string;
  /** What we owe after this movement, running down the page. */
  balance_bdt: string;
}

export interface SupplierStatement {
  party_id: string;
  party_code: string;
  party_name: string;
  from: string | null;
  to: string | null;
  opening_bdt: string;
  closing_bdt: string;
  movements: SupplierMovement[];
  prepaid_bdt: string;
}

export interface SupplierPosition {
  party_id: string;
  party_code: string;
  party_name: string;
  balance_bdt: string;
  overdue_bdt: string;
  oldest_overdue_days: number;
  open_bill_count: number;
  prepaid_bdt: string;
}

/* ── Expense register (P4) ───────────────────────────────────────────────── */

/** Where a scanned document lives — a URL into object storage, never bytes. */
export interface ExpenseRegisterRow {
  id: string;
  date: string;
  month: string;
  category: Category;
  shop: string;
  amount_bdt: string;
  source: "manual" | "receipt";
  note: string;
  attachment_url: string;
  journal_entry_id: string | null;
}

export interface ExpenseCategoryTotal {
  category: string;
  total_bdt: string;
  count: number;
}

export interface ExpenseRegister {
  from: string | null;
  to: string | null;
  expenses: ExpenseRegisterRow[];
  category_totals: ExpenseCategoryTotal[];
  total_bdt: string;
}

/* ── Banking & cash (P6) ─────────────────────────────────────────────────── */

/** A bank account and a cash account are the same row; the kind is the label
 *  and the chart account it maps onto is the substance. */
export type BankAccountKind = "BANK" | "CASH";

export const BANK_ACCOUNT_KIND_LABEL: Record<BankAccountKind, string> = {
  BANK: "Bank",
  CASH: "Cash",
};

export interface BankAccount {
  id: string;
  kind: BankAccountKind;
  name: string;
  account_code: string;
  account_name: string;
  bank_name: string;
  branch: string;
  account_number: string;
  routing_number: string;
  swift_code: string;
  /** Read from the ledger every time. Nothing on this screen stores a balance. */
  book_balance_bdt: string;
  /** The closing balance of the last imported statement, and its date. Blank
   *  until a statement has been imported. */
  last_statement_balance_bdt: string;
  last_statement_date: string;
  /** book − last statement: the gap reconciliation explains. */
  difference_bdt: string;
  unreconciled_count: number;
  is_active: boolean;
  memo: string;
}

export interface CashPosition {
  as_of: string;
  accounts: BankAccount[];
  total_bdt: string;
  /** The same position read from the chart's own cash/bank accounts. The two
   *  differ only when an account exists in the chart with no treasury row. */
  ledger_total_bdt: string;
}

export type TransferStatus = "POSTED" | "VOID";

export interface Transfer {
  id: string;
  doc_no: string;
  date: string;
  from_account_id: string;
  from_account_code: string;
  from_name: string;
  to_account_id: string;
  to_account_code: string;
  to_name: string;
  amount_bdt: string;
  fee_bdt: string;
  fee_account_code: string;
  memo: string;
  status: TransferStatus;
  journal_entry_id: string | null;
  void_reason: string;
}

export type StatementLineStatus = "UNMATCHED" | "MATCHED" | "CORRECTED" | "IGNORED";

export const STATEMENT_LINE_STATUS_LABEL: Record<StatementLineStatus, string> = {
  UNMATCHED: "Not yet decided",
  MATCHED: "Matched",
  CORRECTED: "Corrected",
  IGNORED: "Ignored",
};

/** `IN` is money into the account, `OUT` money out — the bank's own vocabulary,
 *  and the same one the API uses for a journal line's side. */
export type MoneyDirection = "IN" | "OUT";

export interface StatementLine {
  id: string;
  bank_account_id: string;
  batch_id: string;
  seq: number;
  date: string;
  description: string;
  reference: string;
  direction: MoneyDirection;
  amount_bdt: string;
  balance_bdt: string;
  status: StatementLineStatus;
  matched_line_id: string | null;
  matched_entry_no: string;
  matched_amount_bdt: string;
  adjustment_entry_id: string | null;
  counter_account_code: string;
  note: string;
}

export interface StatementSuggestion {
  journal_line_id: string;
  entry_no: string | null;
  date: string;
  description: string;
  amount_bdt: string;
  amount_matches: boolean;
  reasons: string[];
  score: number;
}

export interface StatementLineWithSuggestions extends StatementLine {
  suggestions: StatementSuggestion[];
}

export interface StatementImportSummary {
  id: string;
  filename: string;
  imported_at: string;
  line_count: number;
  imported_count: number;
  duplicate_count: number;
  period_from: string;
  period_to: string;
  opening_balance_bdt: string;
  closing_balance_bdt: string;
  open_count: number;
}

export interface BookMovementRow {
  line_id: string;
  entry_id: string;
  entry_no: string | null;
  date: string;
  description: string;
  memo: string;
  direction: MoneyDirection;
  amount_bdt: string;
  balance_bdt: string;
  effect_bdt: string;
  matched: boolean;
  statement_line_id: string | null;
}

/** The reconciliation walk, term by term. `unexplained_bdt` is the figure that
 *  must reach 0.00 for a period to be reconciled. */
export interface ReconciliationSummary {
  bank_account_id: string;
  account_code: string;
  account_name: string;
  from: string;
  to: string;
  book_opening_bdt: string;
  book_movement_bdt: string;
  book_closing_bdt: string;
  bank_opening_bdt: string;
  statement_movement_bdt: string;
  bank_closing_bdt: string;
  difference_bdt: string;
  outstanding_book_bdt: string;
  outstanding_book_count: number;
  unrecorded_bank_bdt: string;
  unrecorded_bank_count: number;
  opening_difference_bdt: string;
  matched_count: number;
  matched_book_bdt: string;
  matched_statement_bdt: string;
  corrected_count: number;
  corrected_bdt: string;
  ignored_count: number;
  unexplained_bdt: string;
  open_items: number;
  reconciled: boolean;
  opening_basis: "statement" | "books";
}

export interface ReconciliationWorkspace {
  summary: ReconciliationSummary;
  statement_lines: StatementLineWithSuggestions[];
  book_movements: BookMovementRow[];
}

/* ── Tax & VAT (P7) ────────────────────────────────────────────────────────
 *
 * A return is a *view*, built from the tax snapshotted on document lines, so the
 * shapes here are readings rather than records: the bands a month produced, what
 * each controls account holds, and what is still withheld and undeposited.
 */

/** One rate band on the return. `tax_bdt` is what the lines recorded to the
 *  paisa; `declared_bdt` is that figure truncated to whole taka, as a return is
 *  filed. */
export interface TaxBand {
  tax_code: string;
  rate_percent: string;
  net_bdt: string;
  tax_bdt: string;
  declared_bdt: string;
}

/** One side of the return — output or input. */
export interface VatSideReturn {
  bands: TaxBand[];
  net_bdt: string;
  tax_bdt: string;
  declared_bdt: string;
}

export interface VatReturn {
  month: string;
  month_label: string;
  from: string;
  to: string;
  output: VatSideReturn;
  input: VatSideReturn;
  /** Books: output tax − input tax, to the paisa. */
  net_payable_bdt: string;
  /** The return: truncated output − truncated input, in whole taka. */
  net_payable_declared_bdt: string;
  rounding_difference_bdt: string;
  rounding_note: string;
  controls: {
    output_account_code: string;
    output_balance_bdt: string;
    input_account_code: string;
    input_balance_bdt: string;
    withholding_account_code: string;
    withholding_balance_bdt: string;
    withheld_to_date_bdt: string;
    deposited_to_date_bdt: string;
    withholding_outstanding_bdt: string;
  };
  documents: { invoices: number; credit_notes: number; bills: number; debit_notes: number };
}

export interface WithholdingRow {
  payment_id: string;
  doc_no: string;
  date: string;
  party_id: string;
  party_code: string;
  party_name: string;
  tax_code: string;
  tax_rate_snapshot: string;
  amount_bdt: string;
  payment_amount_bdt: string;
  certified: boolean;
}

export interface WithholdingRegister {
  rows: WithholdingRow[];
  totals: { tax_code: string; amount_bdt: string }[];
  total_bdt: string;
  deposited_bdt: string;
  outstanding_bdt: string;
}

export interface Challan {
  id: string;
  doc_no: string;
  date: string;
  amount_bdt: string;
  account_code: string;
  account_name: string;
  /** The tax office's own reference, as printed on their receipt. */
  challan_ref: string;
  memo: string;
  journal_entry_id: string | null;
}

export interface TaxCertificate {
  id: string;
  doc_no: string;
  party_id: string;
  party_code: string;
  party_name: string;
  date: string;
  period_key: string;
  amount_bdt: string;
  withholdings: PaymentWithholding[];
  status: "ISSUED" | "VOID";
}

/* ── Inventory & stock (P8) ────────────────────────────────────────────────
 *
 * What is on the shelf and how it got there. The stock ledger is a *movement*
 * journal — every row says something arrived or left, and this many, worth this
 * much, because of that document — so the screen reads movements and balances
 * rather than a number anybody increments.
 */

/** A place stock sits. Every business that holds stock has at least one. */
export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
  is_default: boolean;
  is_active: boolean;
  /** Read from this warehouse's balances, never stored on the row. */
  total_value_bdt: string;
  total_qty: number;
  item_count: number;
}

/** What is on hand, for one item in one warehouse. */
export interface StockBalance {
  item_id: string;
  sku: string;
  item_name: string;
  warehouse_id: string;
  warehouse_code: string;
  warehouse_name: string;
  qty: number;
  value_bdt: string;
  /** What the next unit out is costed at — the moving average. */
  avg_cost_bdt: string;
  reorder_level: number;
  low_stock: boolean;
}

/** One item's position across every warehouse — what a low-stock list is about:
 *  the item is short, not one shelf of it. */
export interface LowStockRow {
  item_id: string;
  sku: string;
  item_name: string;
  on_hand: number;
  value_bdt: string;
  avg_cost_bdt: string;
  reorder_level: number;
}

export interface StockSummary {
  item_count: number;
  tracked_item_count: number;
  warehouse_count: number;
  total_qty: number;
  /** The figure the integrity run ties to the inventory control account. */
  total_value_bdt: string;
  low_stock_count: number;
}

export type MovementDirection = "IN" | "OUT";

export type MovementSource =
  | "BILL"
  | "INVOICE"
  | "ADJUSTMENT"
  | "TRANSFER"
  | "STOCKTAKE"
  | "OPENING"
  | "REVERSAL";

export const MOVEMENT_SOURCE_LABEL: Record<MovementSource, string> = {
  BILL: "Bill",
  INVOICE: "Invoice",
  ADJUSTMENT: "Adjustment",
  TRANSFER: "Transfer",
  STOCKTAKE: "Stocktake",
  OPENING: "Opening",
  REVERSAL: "Reversal",
};

/** One change to what is on a shelf. `qty` and `value_bdt` are always positive;
 *  `direction` says which way the movement went. */
export interface StockMovement {
  id: string;
  date: string;
  direction: MovementDirection;
  item_id: string;
  sku: string;
  item_name: string;
  warehouse_id: string;
  warehouse_name: string;
  qty: number;
  value_bdt: string;
  unit_cost_bdt: string;
  source: MovementSource;
  source_id: string;
  doc_no: string;
  reason: string;
  memo: string;
  /** True on a movement a document void has already undone. It is kept, not
   *  removed, and its own reversal carries the opposite side. */
  reversed: boolean;
  reverses_movement_id: string | null;
}

export interface StockAdjustment {
  id: string;
  date: string;
  item_id: string;
  sku: string;
  item_name: string;
  warehouse_id: string;
  warehouse_name: string;
  direction: MovementDirection;
  qty: number;
  unit_cost_bdt: string;
  value_bdt: string;
  reason: string;
  /** Null when the movement was worth nothing — a movement of free goods still
   *  happened, but there is no amount for an entry to carry. */
  journal_entry_id: string | null;
}

export interface StockTransfer {
  date: string;
  item_id: string;
  sku: string;
  item_name: string;
  from_warehouse_id: string;
  from_warehouse_name: string;
  to_warehouse_id: string;
  to_warehouse_name: string;
  qty: number;
  value_bdt: string;
  out_movement_id: string;
  in_movement_id: string;
}

/** One counted line of a worksheet. The expectation and the cost are the ones
 *  that were true when the count was taken, not when it was posted. */
export interface StocktakeLine {
  item_id: string;
  sku_snapshot: string;
  label_snapshot: string;
  expected_qty: number;
  counted_qty: number;
  variance_qty: number;
  unit_cost_bdt: string;
  variance_value_bdt: string;
}

export const STOCKTAKE_STATUS_LABEL: Record<"DRAFT" | "POSTED", string> = {
  DRAFT: "Draft",
  POSTED: "Posted",
};

export interface Stocktake {
  id: string;
  warehouse_id: string;
  warehouse_name: string;
  date: string;
  status: "DRAFT" | "POSTED";
  memo: string;
  lines: StocktakeLine[];
  variance_qty_total: number;
  /** The absolute value the worksheet moves, whichever way it moves it. */
  variance_value_bdt: string;
  journal_entry_id: string | null;
  posted_by: string;
  posted_at: string | null;
}

/* ── Fixed assets (P9) ─────────────────────────────────────────────────────
 *
 * What the organisation owns and how it is written down. Every figure on this
 * screen — the book value, the monthly charge, the accumulated write-down, the
 * remaining life — is computed by the server from `core/depreciation.ts`, the
 * same functions the run posts from. Nothing here divides anything.
 */

export interface AssetDisposal {
  date: string;
  proceeds_bdt: string;
  proceeds_account_code: string;
  reason: string;
  cost_bdt: string;
  accumulated_bdt: string;
  nbv_bdt: string;
  /** Exactly one of these is non-zero, and both are zero when the proceeds
   *  equalled the book value. */
  gain_bdt: string;
  loss_bdt: string;
  gain_account_code: string;
  loss_account_code: string;
  journal_entry_id: string | null;
  /** Set once the disposal has been undone; the asset is then back on the books. */
  voided_by_entry_id: string | null;
  void_reason: string;
  disposed_by: string;
}

export interface FixedAsset {
  id: string;
  code: string;
  name: string;
  category: string;
  purchase_date: string;

  cost_bdt: string;
  salvage_bdt: string;
  useful_life_months: number;
  /** "5 years" — a label, never something a client computes from. */
  useful_life_label: string;
  method: string;

  asset_account_code: string;
  accum_account_code: string;
  dep_expense_account_code: string;
  gain_account_code: string;
  loss_account_code: string;

  /** The acquisition posting, when the register made it. Null when the cost
   *  arrived through a bill that named the fixed-asset account. */
  journal_entry_id: string | null;
  acquired_via: "POSTED" | "REGISTERED";
  source_doc_no: string;

  depreciable_base_bdt: string;
  accumulated_depreciation_bdt: string;
  net_book_value_bdt: string;
  monthly_charge_bdt: string;
  remaining_bdt: string;
  fully_depreciated: boolean;

  last_depreciated_period: string;
  status: "ACTIVE" | "DISPOSED";
  disposal: AssetDisposal | null;
  notes: string;
  created_at: string;
}

export interface AssetSummary {
  asset_count: number;
  disposed_count: number;
  total_cost_bdt: string;
  total_accumulated_bdt: string;
  total_net_book_value_bdt: string;
  monthly_charge_bdt: string;
  fully_depreciated_count: number;
}

/** Why a month charges nothing for an asset. The order the server checks them in
 *  is fixed, so the first true reason is the one reported. */
export type DepreciationSkipReason =
  | "DISPOSED"
  | "NOT_YET_IN_SERVICE"
  | "ALREADY_RUN"
  | "FULLY_DEPRECIATED";

export const SKIP_REASON_LABEL: Record<DepreciationSkipReason, string> = {
  DISPOSED: "already left the books",
  NOT_YET_IN_SERVICE: "bought after this month",
  ALREADY_RUN: "already charged for this month",
  FULLY_DEPRECIATED: "fully written down",
};

/** One asset's charge for one period, as the run will post it. */
export interface DepreciationLine {
  asset_id: string;
  code: string;
  name: string;
  category: string;
  cost_bdt: string;
  salvage_bdt: string;
  monthly_charge_bdt: string;
  accum_before_bdt: string;
  amount_bdt: string;
  accum_after_bdt: string;
  nbv_after_bdt: string;
  days_charged: number;
  days_in_month: number;
  /** Short of a full month — the first month, or a month a disposal cut off. */
  prorated: boolean;
  /** The charge that finished the asset off. */
  final: boolean;
  expense_account_code: string;
  accum_account_code: string;
}

export interface SkippedAsset {
  asset_id: string;
  code: string;
  name: string;
  reason: DepreciationSkipReason;
  reason_label: string;
}

export interface DepreciationPreview {
  period_key: string;
  /** The day the charges are dated: the last day of the period. */
  date: string;
  period_label: string;
  period_status: "OPEN" | "CLOSED" | "MISSING";
  postable: boolean;
  /** Why not, in words, when `postable` is false. */
  blocked_reason: string;
  lines: DepreciationLine[];
  skipped: SkippedAsset[];
  total_bdt: string;
  eligible_count: number;
  already_run_count: number;
}

export interface DepreciationRun {
  id: string;
  batch_id: string;
  period_key: string;
  date: string;
  asset_id: string;
  code: string;
  name: string;
  amount_bdt: string;
  cost_bdt: string;
  accum_before_bdt: string;
  accum_after_bdt: string;
  nbv_after_bdt: string;
  expense_account_code: string;
  accum_account_code: string;
  days_charged: number;
  days_in_month: number;
  prorated: boolean;
  final: boolean;
  status: "POSTED" | "REVERSED";
  journal_entry_id: string;
  reversed_by_entry_id: string | null;
  reason: string;
  created_by: string;
  created_at: string;
}

/** A run as a reader thinks of it: one batch, one month, one journal entry. */
export interface DepreciationBatch {
  batch_id: string;
  period_key: string;
  date: string;
  journal_entry_id: string;
  asset_count: number;
  total_bdt: string;
  status: "POSTED" | "REVERSED" | "MIXED";
  reason: string;
  created_by: string;
  created_at: string;
}

/** A month still to come for an asset, forecast by the server from the same
 *  functions the run posts from. */
export interface AssetScheduleRow {
  period_key: string;
  date: string;
  amount_bdt: string;
  accum_after_bdt: string;
  nbv_after_bdt: string;
  days_charged: number;
  days_in_month: number;
  prorated: boolean;
  final: boolean;
}

export interface AssetSchedule {
  asset: FixedAsset;
  history: DepreciationRun[];
  projected: AssetScheduleRow[];
  /** True when the projection hit the server's row cap and is not the whole
   *  remaining life. */
  projected_truncated: boolean;
}
/* ── Advances (P10) ──────────────────────────────────────────────────────── */

/** Derived on the server from the adjustment rows, never supplied: OPEN until
 *  something claims the advance, FULLY_ADJUSTED once all of it is claimed. */
export type AdvanceStatus = "OPEN" | "PARTIALLY_ADJUSTED" | "FULLY_ADJUSTED";

/** Where the advance's money came from: recorded by hand, or the unclaimed
 *  remainder of a receipt / payment that is already in the ledger. */
export type AdvanceSource = "MANUAL" | "RECEIPT_REMAINDER" | "PAYMENT_PREPAYMENT";

export interface Advance {
  id: string;
  party_id: string;
  party_code: string;
  party_name: string;
  date: string;
  amount_bdt: string;
  /** Sum of the claims against this advance, and what is left of it. */
  adjusted_bdt: string;
  outstanding_bdt: string;
  account_code: string;
  account_name: string;
  reference: string;
  notes: string;
  status: AdvanceStatus;
  source: AdvanceSource;
  source_doc_no: string;
  journal_entry_id: string | null;
}

/** One claim: a document that has taken part of an advance. */
export interface AdvanceAdjustment {
  id: string;
  advance_id: string;
  document_type: "INVOICE" | "BILL";
  document_id: string;
  document_no: string;
  amount_bdt: string;
  adjusted_on: string;
}

/** One advance with the claims against it — the allocation inspector's data. */
export interface AdvanceDetail extends Advance {
  adjustments: AdvanceAdjustment[];
}

export interface AdvanceOutstanding {
  party_id: string;
  party_code: string;
  party_name: string;
  advances_bdt: string;
  adjusted_bdt: string;
  outstanding_bdt: string;
  open_count: number;
}

export interface AdvanceLedgerEntry {
  date: string;
  kind: "ADVANCE" | "ADJUSTMENT";
  reference: string;
  party_id: string;
  party_name: string;
  advance_bdt: string;
  adjustment_bdt: string;
  running_balance_bdt: string;
  document_type: string;
  document_id: string;
  document_no: string;
  /** Days the advance has been open, for rows that add to the balance. */
  age_days: number;
}

export interface AdvanceLedger {
  entries: AdvanceLedgerEntry[];
  /** Must equal the per-party outstanding at the same date — the same formula
   *  read two ways (ADR 0004 §5). */
  closing_bdt: string;
  as_of: string | null;
}

/* ── Staff & Payroll (P11) ────────────────────────────────────────────────── */

export type StaffStatus = "ACTIVE" | "INACTIVE";

export interface Staff {
  id: string;
  code: string;
  name: string;
  designation: string;
  joining_date: string;
  branch: string;
  monthly_salary_bdt: string;
  status: StaffStatus;
  advances_outstanding_bdt: string;
  loans_outstanding_bdt: string;
  total_owed_bdt: string;
  last_paid_period: string | null;
  active_loans_count: number;
}

export type PayrollRunStatus = "POSTED" | "REVERSED";

export interface PayrollRun {
  id: string;
  period_key: string;
  date: string;
  status: PayrollRunStatus;
  expense_account_code: string;
  staff_count: number;
  gross_bdt: string;
  deductions_bdt: string;
  net_bdt: string;
  loan_principal_bdt: string;
  advance_bdt: string;
  loan_interest_bdt: string;
  tax_bdt: string;
  journal_entry_id: string | null;
  paid_on: string | null;
  payment_account_code: string;
  payment_journal_entry_id: string | null;
  reversed_reason: string;
}

export interface PayslipDeduction {
  type: "LOAN" | "ADVANCE" | "TAX";
  loan_id?: string | null;
  amount_bdt: string;
  principal_bdt: string;
  interest_bdt: string;
  reason: string;
}

export type PayslipStatus = "POSTED" | "PAID" | "REVERSED";

export interface Payslip {
  id: string;
  run_id: string;
  staff_id: string;
  staff_code: string;
  staff_name: string;
  period_key: string;
  doc_no: string | null;
  basic_bdt: string;
  allowances_bdt: string;
  gross_bdt: string;
  deductions: PayslipDeduction[];
  deductions_bdt: string;
  loan_principal_bdt: string;
  advance_bdt: string;
  loan_interest_bdt: string;
  tax_bdt: string;
  net_bdt: string;
  status: PayslipStatus;
}

export interface RunDetail extends PayrollRun {
  payslips: Payslip[];
}

export interface RunPreview {
  period_key: string;
  date: string;
  expense_account_code: string;
  staff_count: number;
  gross_bdt: string;
  deductions_bdt: string;
  net_bdt: string;
  loan_principal_bdt: string;
  advance_bdt: string;
  loan_interest_bdt: string;
  tax_bdt: string;
  payslips: Payslip[];
}

export type StaffLoanKind = "LOAN" | "ADVANCE";
export type StaffLoanStatus = "ACTIVE" | "CLOSED";

export interface LoanInstallment {
  id: string;
  seq: number;
  due_date: string;
  amount_bdt: string;
  principal_bdt: string;
  interest_bdt: string;
  paid_bdt: string;
  status: "DUE" | "PAID";
  paid_on: string;
  run_id: string | null;
  payslip_id: string | null;
}

export interface StaffLoan {
  id: string;
  staff_id: string;
  staff_code: string;
  staff_name: string;
  doc_no: string | null;
  kind: StaffLoanKind;
  principal_bdt: string;
  disbursed_on: string;
  account_code: string;
  interest_rate_percent: string;
  term_months: number;
  total_interest_bdt: string;
  installment_bdt: string;
  status: StaffLoanStatus;
  outstanding_bdt: string;
  outstanding_principal_bdt: string;
  repaid_bdt: string;
  journal_entry_id: string | null;
  notes: string;
  schedule?: LoanInstallment[];
}

export interface StaffLedgerRow {
  date: string;
  kind: "SALARY" | "LOAN" | "ADVANCE" | "REPAYMENT";
  ref: string;
  memo: string;
  amount_bdt: string;
  direction: "IN" | "OUT";
  settled: boolean;
}

export interface StaffLedgerResult {
  staff: Staff;
  rows: StaffLedgerRow[];
  totals: {
    gross_bdt: string;
    deductions_bdt: string;
    net_bdt: string;
    net_paid_bdt: string;
    net_payable_bdt: string;
    advances_outstanding_bdt: string;
    loans_outstanding_bdt: string;
    recovered_bdt: string;
  };
}

/* ── Phase 12: Segments, Budgets & Recurring ──────────────────────────────── */

export const SEGMENT_TYPES = ["BRANCH", "DEPARTMENT", "PROJECT", "COST_CENTER"] as const;
export type SegmentType = (typeof SEGMENT_TYPES)[number];

export const SEGMENT_TYPE_LABEL: Record<SegmentType, string> = {
  BRANCH: "Branch Location",
  DEPARTMENT: "Operating Department",
  PROJECT: "Capital / Client Project",
  COST_CENTER: "Cost Center Allocation",
};

export interface Segment {
  id: string;
  code: string;
  name: string;
  type: SegmentType;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  period_key: string;
  account_code: string;
  account_name: string;
  segment_id: string;
  budget_bdt: string;
  notes: string;
}

export interface BudgetVarianceRow {
  account_code: string;
  account_name: string;
  account_type: string;
  period_key: string;
  segment_id: string;
  budget_bdt: string;
  actual_bdt: string;
  variance_bdt: string;
  variance_pct: string;
  is_favorable: boolean;
}

export interface BudgetVarianceResult {
  period_key: string;
  rows: BudgetVarianceRow[];
  totals: {
    budget_bdt: string;
    actual_bdt: string;
    variance_bdt: string;
  };
}

export type RecurringFrequency = "MONTHLY" | "QUARTERLY" | "ANNUAL" | "WEEKLY";
export type RecurringStatus = "ACTIVE" | "PAUSED" | "COMPLETED";

export interface RecurringLine {
  account_id: string;
  account_code: string;
  account_name: string;
  debit_bdt: string;
  credit_bdt: string;
  memo: string;
  party_id: string;
  segment_id: string;
}

export interface RecurringTemplate {
  id: string;
  template_name: string;
  description: string;
  frequency: RecurringFrequency;
  next_run_date: string;
  end_date: string | null;
  is_accrual: boolean;
  auto_post: boolean;
  status: RecurringStatus;
  total_debit_bdt: string;
  total_credit_bdt: string;
  lines: RecurringLine[];
  runs_count: number;
  last_run_date: string | null;
  last_entry_id: string | null;
  created_at: string;
  updated_at: string;
}

