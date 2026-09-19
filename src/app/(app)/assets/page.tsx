"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Amount } from "@/components/money";
import { useSession } from "@/components/session-provider";
import { toast } from "@/components/toast-provider";
import { api, ApiError } from "@/lib/api";
import type {
  Account,
  AssetSchedule,
  AssetSummary,
  DepreciationBatch,
  DepreciationPreview,
  DepreciationRun,
  FixedAsset,
} from "@/lib/types";
import { SKIP_REASON_LABEL } from "@/lib/types";

/**
 * Assets (plan §6, Phase 9).
 *
 * Two questions, one screen: what do we own and what is it worth on the books,
 * and what does this month's write-down come to.
 *
 * **Nothing here computes a valuation.** The book value, the monthly charge, the
 * accumulated write-down and every projected month arrive from the server, which
 * derives them all from `core/depreciation.ts` — the same functions the run posts
 * from. A client that divided a cost by a life would be a second implementation
 * of the schedule, and the two would agree only until somebody edited one.
 *
 * The preview is deliberately the post's own plan: it is drawn up by the same
 * eligibility test the run uses, so a line shown as due is a line that will post,
 * and a refusal (a closed month, nothing due) is stated before the button rather
 * than after it.
 */

type Tab = "register" | "depreciation";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "register", label: "Register" },
  { key: "depreciation", label: "Depreciation" },
];

const today = (): string => new Date().toISOString().slice(0, 10);
const currentPeriod = (): string => new Date().toISOString().slice(0, 7);

function monthLabel(periodKey: string): string {
  const [year, month] = periodKey.split("-");
  const names = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const index = Number(month) - 1;
  return `${names[index] ?? month} ${year}`;
}

export default function AssetsPage() {
  const { can } = useSession();
  const canWrite = can("assets.write");

  const [tab, setTab] = useState<Tab>("register");

  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [batches, setBatches] = useState<DepreciationBatch[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [selected, setSelected] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<AssetSchedule | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const [openBatch, setOpenBatch] = useState<string | null>(null);
  const [batchRuns, setBatchRuns] = useState<DepreciationRun[]>([]);
  const [reverseDraft, setReverseDraft] = useState({ batch_id: "", reason: "" });

  const [period, setPeriod] = useState(currentPeriod());
  const [preview, setPreview] = useState<DepreciationPreview | null>(null);

  const [assetDraft, setAssetDraft] = useState({
    code: "",
    name: "",
    category: "",
    purchase_date: today(),
    cost_bdt: "",
    salvage_bdt: "",
    useful_life_months: "60",
    source_doc_no: "",
    postAcquisition: true,
    credit_account_code: "1010",
  });

  const [disposeDraft, setDisposeDraft] = useState({
    date: today(),
    proceeds_bdt: "",
    proceeds_account_code: "1000",
    reason: "",
  });
  const [voidReason, setVoidReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [register, batchData, accountData] = await Promise.all([
        api<{ assets: FixedAsset[]; summary: AssetSummary }>("/assets"),
        api<{ batches: DepreciationBatch[] }>("/assets/depreciation/batches?limit=24"),
        api<{ accounts: Account[] }>("/coa"),
      ]);
      setAssets(register.assets);
      setSummary(register.summary);
      setBatches(batchData.batches);
      setAccounts(accountData.accounts);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load the asset register.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSchedule = useCallback(async (id: string) => {
    setScheduleLoading(true);
    try {
      setSchedule(await api<AssetSchedule>(`/assets/${id}/schedule`));
    } catch (caught) {
      setSchedule(null);
      setError(caught instanceof ApiError ? caught.message : "Could not load that asset's schedule.");
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // The preview is re-read whenever the month changes, so the number on the
  // button is always the number that would post.
  useEffect(() => {
    if (tab !== "depreciation") return;
    let cancelled = false;
    void (async () => {
      try {
        const { preview: next } = await api<{ preview: DepreciationPreview }>(
          `/assets/depreciation/preview?period=${period}`,
        );
        if (!cancelled) setPreview(next);
      } catch (caught) {
        if (!cancelled) {
          setPreview(null);
          setError(caught instanceof ApiError ? caught.message : "Could not preview that month.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, period]);

  useEffect(() => {
    if (selected) void loadSchedule(selected);
    else setSchedule(null);
  }, [selected, loadSchedule]);

  const selectedAsset = useMemo(
    () => assets.find((row) => row.id === selected) ?? null,
    [assets, selected],
  );

  // Offers only the accounts a disposal can sensibly land in or be paid from —
  // an asset account. The server refuses the rest with the reason named, but a
  // list that cannot be got wrong is better than a good error message.
  const cashLike = useMemo(() => accounts.filter((row) => row.type === "ASSET"), [accounts]);
  const fundingAccounts = useMemo(
    () => accounts.filter((row) => row.type === "ASSET" || row.type === "LIABILITY"),
    [accounts],
  );

  function reset(): void {
    setNotice(null);
    setError(null);
  }

  async function createAsset(event: React.FormEvent) {
    event.preventDefault();
    reset();
    const life = Number(assetDraft.useful_life_months);
    if (
      assetDraft.code.trim() === "" ||
      assetDraft.name.trim().length < 2 ||
      assetDraft.cost_bdt.trim() === "" ||
      !Number.isFinite(life) ||
      life < 1
    ) {
      return;
    }

    setBusy(true);
    try {
      const { asset } = await api<{ asset: FixedAsset }>("/assets", {
        method: "POST",
        body: {
          code: assetDraft.code.trim(),
          name: assetDraft.name.trim(),
          category: assetDraft.category.trim(),
          purchase_date: assetDraft.purchase_date,
          cost_bdt: assetDraft.cost_bdt.trim(),
          ...(assetDraft.salvage_bdt.trim() !== "" ? { salvage_bdt: assetDraft.salvage_bdt.trim() } : {}),
          useful_life_months: life,
          source_doc_no: assetDraft.source_doc_no.trim(),
          ...(assetDraft.postAcquisition
            ? { acquisition: { credit_account_code: assetDraft.credit_account_code } }
            : {}),
        },
      });
      const msg = `${asset.code} registered — ${asset.cost_bdt} taka, written down over ${asset.useful_life_label} at ` +
        `${asset.monthly_charge_bdt} a month.` +
        (asset.acquired_via === "POSTED"
          ? " The cost is posted to the fixed-asset account."
          : " No posting: the cost was already on the fixed-asset account.");
      setNotice(msg);
      toast.success(msg);
      setAssetDraft({ ...assetDraft, code: "", name: "", category: "", cost_bdt: "", salvage_bdt: "", source_doc_no: "" });
      await load();
    } catch (caught) {
      const err = caught instanceof ApiError ? caught.message : "Could not register that asset.";
      setError(err);
      toast.error(err);
    } finally {
      setBusy(false);
    }
  }

  async function runDepreciation() {
    reset();
    setBusy(true);
    try {
      const { run } = await api<{ run: { total_bdt: string; asset_count: number; period_key: string } }>(
        "/assets/depreciation/run",
        { method: "POST", body: { period } },
      );
      const msg = `Posted ${run.total_bdt} taka of depreciation for ${monthLabel(run.period_key)} across ${run.asset_count} assets.`;
      setNotice(msg);
      toast.success(msg);
      await load();
      setSelected(null);
    } catch (caught) {
      const err = caught instanceof ApiError ? caught.message : "Could not post that month.";
      setError(err);
      toast.error(err);
    } finally {
      setBusy(false);
    }
  }

  async function reverseBatch(id: string, reason: string) {
    if (reason.trim().length < 3) return;
    reset();
    setBusy(true);
    try {
      const { reversal } = await api<{ reversal: { total_bdt: string; period_key: string } }>(
        `/assets/depreciation/batches/${id}/reverse`,
        { method: "POST", body: { reason: reason.trim() } },
      );
      const msg = `Reversed ${reversal.total_bdt} taka of depreciation for ${monthLabel(reversal.period_key)}. ` +
        "The month can be run again now.";
      setNotice(msg);
      toast.success(msg);
      setReverseDraft({ batch_id: "", reason: "" });
      await load();
      if (selected) await loadSchedule(selected);
    } catch (caught) {
      const err = caught instanceof ApiError ? caught.message : "Could not reverse that run.";
      setError(err);
      toast.error(err);
    } finally {
      setBusy(false);
    }
  }

  async function toggleBatch(id: string) {
    if (openBatch === id) {
      setOpenBatch(null);
      return;
    }
    setOpenBatch(id);
    setBatchRuns([]);
    try {
      const { runs } = await api<{ runs: DepreciationRun[] }>(`/assets/depreciation/batches/${id}`);
      setBatchRuns(runs);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not open that run.");
    }
  }

  async function dispose(event: React.FormEvent) {
    event.preventDefault();
    reset();
    if (!selectedAsset || disposeDraft.reason.trim().length < 3) return;

    setBusy(true);
    try {
      const { disposal } = await api<{
        disposal: {
          stub_period: string | null;
          stub_amount_bdt: string;
          gain_bdt: string;
          loss_bdt: string;
          journal_entry_id: string;
        };
      }>(`/assets/${selectedAsset.id}/dispose`, {
        method: "POST",
        body: {
          date: disposeDraft.date,
          ...(disposeDraft.proceeds_bdt.trim() !== "" ? { proceeds_bdt: disposeDraft.proceeds_bdt.trim() } : {}),
          proceeds_account_code: disposeDraft.proceeds_account_code,
          reason: disposeDraft.reason.trim(),
        },
      });

      const charge = Number(disposal.stub_amount_bdt) > 0
        ? `It was charged ${disposal.stub_amount_bdt} taka for ${disposal.stub_period ? monthLabel(disposal.stub_period) : "the month"} up to the day it left. `
        : "";
      const result =
        Number(disposal.gain_bdt) > 0
          ? `a gain of ${disposal.gain_bdt} taka`
          : Number(disposal.loss_bdt) > 0
            ? `a loss of ${disposal.loss_bdt} taka`
            : "no gain and no loss — the proceeds were the book value";

      setNotice(`${selectedAsset.code} left the books: ${result}. ${charge}Posted.`);
      setDisposeDraft({ ...disposeDraft, proceeds_bdt: "", reason: "" });
      await load();
      await loadSchedule(selectedAsset.id);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not dispose of that asset.");
    } finally {
      setBusy(false);
    }
  }

  async function voidDisposal() {
    if (!selectedAsset || voidReason.trim().length < 3) return;
    reset();
    setBusy(true);
    try {
      await api<{ asset: FixedAsset }>(`/assets/${selectedAsset.id}/disposal/void`, {
        method: "POST",
        body: { reason: voidReason.trim() },
      });
      setNotice(
        `${selectedAsset.code} is back on the books with its written-down value intact. ` +
          "The disposal entry is voided, not deleted.",
      );
      setVoidReason("");
      await load();
      await loadSchedule(selectedAsset.id);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not undo that disposal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="section">
        <div className="row-between">
          <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
            01 &nbsp; Assets
          </p>
          {summary ? (
            <div className="row" style={{ gap: "var(--s-4)", flexWrap: "wrap" }}>
              <Stat label="Assets" value={String(summary.asset_count)} />
              <Stat label="Cost" value={summary.total_cost_bdt} money />
              <Stat label="Written off" value={summary.total_accumulated_bdt} money />
              <Stat label="Book value" value={summary.total_net_book_value_bdt} money />
              <Stat label="One month" value={summary.monthly_charge_bdt} money />
            </div>
          ) : null}
        </div>

        <p className="muted" style={{ marginTop: "var(--s-3)", maxWidth: "70ch" }}>
          What the organisation owns, what it cost, and how much of it is left. The register&rsquo;s total cost and its
          total write-down are the balances of the fixed-asset and accumulated-depreciation accounts — the integrity run
          asserts they agree to the paisa, so a purchase that never reached the register, or a write-down nobody posted,
          is reported rather than tolerated.
        </p>

        {error ? (
          <p className="alert alert--error" role="alert" style={{ marginTop: "var(--s-4)" }}>
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="alert alert--ok" role="status" style={{ marginTop: "var(--s-4)" }}>
            {notice}
          </p>
        ) : null}

        <div className="row" style={{ gap: "var(--s-2)", marginTop: "var(--s-5)" }}>
          {TABS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              className={`btn btn--sm ${tab === entry.key ? "" : "btn--quiet"}`}
              aria-pressed={tab === entry.key}
              onClick={() => {
                setTab(entry.key);
                setError(null);
                setNotice(null);
              }}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <section className="section">
          <div className="stack">
            {[0, 1, 2].map((row) => (
              <div className="skeleton" key={row} style={{ height: "2rem" }} />
            ))}
          </div>
        </section>
      ) : tab === "register" ? (
        <RegisterSection
          assets={assets}
          canWrite={canWrite}
          busy={busy}
          draft={assetDraft}
          fundingAccounts={fundingAccounts}
          onChange={setAssetDraft}
          onSubmit={createAsset}
          selectedId={selected}
          onSelect={setSelected}
          schedule={schedule}
          scheduleLoading={scheduleLoading}
          selectedAsset={selectedAsset}
          cashLike={cashLike}
          disposeDraft={disposeDraft}
          onDisposeChange={setDisposeDraft}
          onDispose={dispose}
          voidReason={voidReason}
          onVoidReason={setVoidReason}
          onVoidDisposal={voidDisposal}
        />
      ) : (
        <DepreciationSection
          period={period}
          onPeriod={setPeriod}
          preview={preview}
          canWrite={canWrite}
          busy={busy}
          onRun={runDepreciation}
          batches={batches}
          openBatch={openBatch}
          batchRuns={batchRuns}
          onToggleBatch={toggleBatch}
          reverseDraft={reverseDraft}
          onReverseDraft={setReverseDraft}
          onReverse={reverseBatch}
        />
      )}
    </>
  );
}

function Stat({ label, value, money }: { label: string; value: string; money?: boolean }) {
  return (
    <div className="stack" style={{ gap: 0 }}>
      <span className="label" style={{ margin: 0 }}>
        {label}
      </span>
      {money ? (
        <Amount value={value} size="sm" />
      ) : (
        <span className="mono" style={{ fontSize: "var(--t-md)" }}>
          {value}
        </span>
      )}
    </div>
  );
}

/* ── Register ────────────────────────────────────────────────────────────── */

type AssetDraft = {
  code: string;
  name: string;
  category: string;
  purchase_date: string;
  cost_bdt: string;
  salvage_bdt: string;
  useful_life_months: string;
  source_doc_no: string;
  postAcquisition: boolean;
  credit_account_code: string;
};

function RegisterSection({
  assets,
  canWrite,
  busy,
  draft,
  fundingAccounts,
  onChange,
  onSubmit,
  selectedId,
  onSelect,
  schedule,
  scheduleLoading,
  selectedAsset,
  cashLike,
  disposeDraft,
  onDisposeChange,
  onDispose,
  voidReason,
  onVoidReason,
  onVoidDisposal,
}: {
  assets: FixedAsset[];
  canWrite: boolean;
  busy: boolean;
  draft: AssetDraft;
  fundingAccounts: Account[];
  onChange: (next: AssetDraft) => void;
  onSubmit: (event: React.FormEvent) => Promise<void>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  schedule: AssetSchedule | null;
  scheduleLoading: boolean;
  selectedAsset: FixedAsset | null;
  cashLike: Account[];
  disposeDraft: { date: string; proceeds_bdt: string; proceeds_account_code: string; reason: string };
  onDisposeChange: (next: {
    date: string;
    proceeds_bdt: string;
    proceeds_account_code: string;
    reason: string;
  }) => void;
  onDispose: (event: React.FormEvent) => Promise<void>;
  voidReason: string;
  onVoidReason: (next: string) => void;
  onVoidDisposal: () => Promise<void>;
}) {
  const ready =
    draft.code.trim() !== "" &&
    draft.name.trim().length >= 2 &&
    draft.cost_bdt.trim() !== "" &&
    Number(draft.useful_life_months) >= 1 &&
    (!draft.postAcquisition || draft.credit_account_code !== "");

  return (
    <section className="section">
      {canWrite ? (
        <div className="panel">
          <div className="panel-head">
            <h2 style={{ fontSize: "var(--t-lg)" }}>Register an asset</h2>
            <span className="muted" style={{ fontSize: "var(--t-sm)" }}>
              the day it was bought is the day it starts being written down
            </span>
          </div>
          <form className="stack" onSubmit={onSubmit} noValidate>
            <div className="grid grid-3">
              <div className="field">
                <label className="label" htmlFor="asset-code">
                  Tag
                </label>
                <input
                  id="asset-code"
                  className="mono"
                  value={draft.code}
                  onChange={(event) => onChange({ ...draft, code: event.target.value })}
                  placeholder="MACHINE-01"
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="asset-name">
                  Name
                </label>
                <input
                  id="asset-name"
                  value={draft.name}
                  onChange={(event) => onChange({ ...draft, name: event.target.value })}
                  placeholder="Rice milling machine"
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="asset-category">
                  Category <span className="faint">optional</span>
                </label>
                <input
                  id="asset-category"
                  value={draft.category}
                  onChange={(event) => onChange({ ...draft, category: event.target.value })}
                  placeholder="Plant"
                />
              </div>
            </div>

            <div className="grid grid-3">
              <div className="field">
                <label className="label" htmlFor="asset-date">
                  Bought
                </label>
                <input
                  id="asset-date"
                  type="date"
                  className="mono"
                  value={draft.purchase_date}
                  onChange={(event) => onChange({ ...draft, purchase_date: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="asset-cost">
                  Cost
                </label>
                <input
                  id="asset-cost"
                  inputMode="decimal"
                  className="mono"
                  value={draft.cost_bdt}
                  onChange={(event) => onChange({ ...draft, cost_bdt: event.target.value })}
                  placeholder="120000.00"
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="asset-salvage">
                  Salvage <span className="faint">optional</span>
                </label>
                <input
                  id="asset-salvage"
                  inputMode="decimal"
                  className="mono"
                  value={draft.salvage_bdt}
                  onChange={(event) => onChange({ ...draft, salvage_bdt: event.target.value })}
                  placeholder="what it is worth at the end"
                />
              </div>
            </div>

            <div className="grid grid-3">
              <div className="field">
                <label className="label" htmlFor="asset-life">
                  Useful life (months)
                </label>
                <input
                  id="asset-life"
                  inputMode="numeric"
                  className="mono"
                  value={draft.useful_life_months}
                  onChange={(event) => onChange({ ...draft, useful_life_months: event.target.value })}
                  placeholder="60"
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="asset-doc">
                  Bought on <span className="faint">optional</span>
                </label>
                <input
                  id="asset-doc"
                  value={draft.source_doc_no}
                  onChange={(event) => onChange({ ...draft, source_doc_no: event.target.value })}
                  placeholder="bill number, or a note"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="asset-credit">
                  Paid from
                </label>
                <select
                  id="asset-credit"
                  value={draft.credit_account_code}
                  disabled={!draft.postAcquisition}
                  onChange={(event) => onChange({ ...draft, credit_account_code: event.target.value })}
                >
                  {fundingAccounts.map((row) => (
                    <option key={row.id} value={row.code}>
                      {row.code} — {row.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="label row" style={{ gap: "var(--s-2)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={draft.postAcquisition}
                onChange={(event) => onChange({ ...draft, postAcquisition: event.target.checked })}
              />
              Post the cost now
            </label>

            <p className="note" style={{ margin: 0 }}>
              {draft.postAcquisition ? (
                <>
                  Posts <span className="mono">DR 1500 / CR the account above</span>. Turn this off when a bill already
                  put the cost in 1500 — a purchase line coded to 1500 capitalises, and registering it here records what
                  the bill bought without posting it twice.
                </>
              ) : (
                <>
                  No posting. This is for an asset whose cost is already on 1500 — a bill line coded to 1500, say. The
                  integrity run compares the register against 1500 and names any difference, so a missing registration
                  is a reported finding rather than a quiet omission.
                </>
              )}
            </p>

            <div className="row">
              <button className="btn" type="submit" disabled={busy || !ready}>
                {busy ? "Registering…" : "Register asset"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="panel panel--flush" style={{ marginTop: "var(--s-5)" }}>
        <div className="panel-head">
          <h2 style={{ fontSize: "var(--t-lg)" }}>The register</h2>
          <span className="muted" style={{ fontSize: "var(--t-sm)" }}>
            {assets.length} rows
          </span>
        </div>
        <div className="ledger-scroll">
          <table className="ledger">
            <caption className="sr-only">Fixed asset register</caption>
            <thead>
              <tr>
                <th scope="col">Tag</th>
                <th scope="col">Asset</th>
                <th scope="col">Bought</th>
                <th scope="col" className="num">
                  Cost
                </th>
                <th scope="col">Life</th>
                <th scope="col" className="num">
                  Written off
                </th>
                <th scope="col" className="num">
                  Book value
                </th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="muted">
                    Nothing registered yet. An asset bought through a bill coded to 1500 still has to be registered here
                    — that is the row the depreciation schedule hangs off.
                  </td>
                </tr>
              ) : (
                assets.map((row) => (
                  <tr
                    key={row.id}
                    className={selectedId === row.id ? "is-selected" : undefined}
                    onClick={() => onSelect(selectedId === row.id ? null : row.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="mono nowrap">{row.code}</td>
                    <td>
                      {row.name}
                      {row.category ? <span className="muted"> — {row.category}</span> : null}
                    </td>
                    <td className="mono nowrap">{row.purchase_date}</td>
                    <td className="num">
                      <Amount value={row.cost_bdt} size="sm" />
                    </td>
                    <td className="muted nowrap">{row.useful_life_label}</td>
                    <td className="num">
                      <Amount value={row.accumulated_depreciation_bdt} size="sm" />
                    </td>
                    <td className="num">
                      <Amount value={row.net_book_value_bdt} size="sm" />
                    </td>
                    <td className="nowrap">
                      {row.status === "DISPOSED" ? (
                        <span className="chip chip--short">disposed</span>
                      ) : row.fully_depreciated ? (
                        <span className="chip chip--short">fully written down</span>
                      ) : (
                        <span className="chip">in use</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="note" style={{ padding: "var(--s-4)", margin: 0 }}>
          Click a row for its schedule: what has been charged, and what is left.
        </p>
      </div>

      {selectedAsset ? (
        <AssetDetail
          asset={selectedAsset}
          schedule={schedule}
          loading={scheduleLoading}
          canWrite={canWrite}
          busy={busy}
          cashLike={cashLike}
          disposeDraft={disposeDraft}
          onDisposeChange={onDisposeChange}
          onDispose={onDispose}
          voidReason={voidReason}
          onVoidReason={onVoidReason}
          onVoidDisposal={onVoidDisposal}
        />
      ) : null}
    </section>
  );
}

/* ── One asset ───────────────────────────────────────────────────────────── */

function AssetDetail({
  asset,
  schedule,
  loading,
  canWrite,
  busy,
  cashLike,
  disposeDraft,
  onDisposeChange,
  onDispose,
  voidReason,
  onVoidReason,
  onVoidDisposal,
}: {
  asset: FixedAsset;
  schedule: AssetSchedule | null;
  loading: boolean;
  canWrite: boolean;
  busy: boolean;
  cashLike: Account[];
  disposeDraft: { date: string; proceeds_bdt: string; proceeds_account_code: string; reason: string };
  onDisposeChange: (next: {
    date: string;
    proceeds_bdt: string;
    proceeds_account_code: string;
    reason: string;
  }) => void;
  onDispose: (event: React.FormEvent) => Promise<void>;
  voidReason: string;
  onVoidReason: (next: string) => void;
  onVoidDisposal: () => Promise<void>;
}) {
  const disposal = asset.disposal;

  return (
    <div className="panel panel--flush" style={{ marginTop: "var(--s-5)" }}>
      <div className="panel-head">
        <h2 style={{ fontSize: "var(--t-lg)" }}>
          <span className="mono">{asset.code}</span> {asset.name}
        </h2>
        <span className="muted" style={{ fontSize: "var(--t-sm)" }}>
          {asset.useful_life_label} · {asset.method === "STRAIGHT_LINE" ? "straight line" : asset.method}
        </span>
      </div>

      <div className="row" style={{ padding: "var(--s-4)", gap: "var(--s-6)", flexWrap: "wrap" }}>
        <Stat label="Cost" value={asset.cost_bdt} money />
        <Stat label="Salvage" value={asset.salvage_bdt} money />
        <Stat label="Written off" value={asset.accumulated_depreciation_bdt} money />
        <Stat label="Book value" value={asset.net_book_value_bdt} money />
      </div>

      <div className="row" style={{ padding: "0 var(--s-4) var(--s-4)", gap: "var(--s-6)", flexWrap: "wrap" }}>
        <Stat label="Depreciable" value={asset.depreciable_base_bdt} money />
        <Stat label="Monthly charge" value={asset.monthly_charge_bdt} money />
        <Stat label="Still to write off" value={asset.remaining_bdt} money />
        <Stat
          label="Last charged"
          value={asset.last_depreciated_period === "" ? "never" : monthLabel(asset.last_depreciated_period)}
        />
      </div>

      <p className="note" style={{ padding: "0 var(--s-4) var(--s-4)", margin: 0 }}>
        {asset.acquired_via === "POSTED" ? (
          <>
            The register posted the cost: <span className="mono">DR {asset.asset_account_code}</span> against whatever
            paid for it.
          </>
        ) : (
          <>
            Registered against a cost that was already in{" "}
            <span className="mono">{asset.asset_account_code}</span>
            {asset.source_doc_no ? <> — <span className="mono">{asset.source_doc_no}</span></> : null}. Nothing was posted
            here, so the register and the ledger cannot double-count it.
          </>
        )}{" "}
        Write-downs post <span className="mono">DR {asset.dep_expense_account_code} / CR {asset.accum_account_code}</span>
        ; a disposal clears both against the proceeds and posts the difference to{" "}
        <span className="mono">{asset.gain_account_code}</span> or{" "}
        <span className="mono">{asset.loss_account_code}</span>.
      </p>

      {disposal ? (
        <div style={{ padding: "0 var(--s-4) var(--s-4)" }}>
          <h3 className="label">Disposal</h3>
          <p style={{ margin: "var(--s-2) 0 0" }}>
            Left the books on <span className="mono">{disposal.date}</span> — {disposal.reason}. It was worth{" "}
            <Amount value={disposal.nbv_bdt} size="sm" /> and fetched{" "}
            <Amount value={disposal.proceeds_bdt} size="sm" />
            {Number(disposal.gain_bdt) > 0 ? (
              <>
                , a gain of <Amount value={disposal.gain_bdt} size="sm" tone="surplus" />
              </>
            ) : Number(disposal.loss_bdt) > 0 ? (
              <>
                , a loss of <Amount value={disposal.loss_bdt} size="sm" tone="short" />
              </>
            ) : (
              ", exactly its book value"
            )}
            .
          </p>
          {disposal.voided_by_entry_id ? (
            <p className="muted" style={{ margin: "var(--s-2) 0 0" }}>
              That disposal was undone{disposal.void_reason ? ` — ${disposal.void_reason}` : ""}, so this asset is back
              on the books. The entry is voided, not deleted.
            </p>
          ) : null}
        </div>
      ) : null}

      {canWrite && asset.status === "ACTIVE" ? (
        <div className="grid grid-2" style={{ padding: "0 var(--s-4) var(--s-5)", alignItems: "start" }}>
          <form className="stack" onSubmit={onDispose} noValidate>
            <h3 className="label">Dispose of it</h3>
            <div className="grid grid-2">
              <div className="field">
                <label className="label" htmlFor="dispose-date">
                  Date it left
                </label>
                <input
                  id="dispose-date"
                  type="date"
                  className="mono"
                  value={disposeDraft.date}
                  onChange={(event) => onDisposeChange({ ...disposeDraft, date: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="dispose-proceeds">
                  Proceeds <span className="faint">optional</span>
                </label>
                <input
                  id="dispose-proceeds"
                  inputMode="decimal"
                  className="mono"
                  value={disposeDraft.proceeds_bdt}
                  onChange={(event) => onDisposeChange({ ...disposeDraft, proceeds_bdt: event.target.value })}
                  placeholder="0.00 when scrapped"
                />
              </div>
            </div>
            <div className="grid grid-2">
              <div className="field">
                <label className="label" htmlFor="dispose-account">
                  Proceeds land in
                </label>
                <select
                  id="dispose-account"
                  value={disposeDraft.proceeds_account_code}
                  onChange={(event) => onDisposeChange({ ...disposeDraft, proceeds_account_code: event.target.value })}
                >
                  {cashLike.map((row) => (
                    <option key={row.id} value={row.code}>
                      {row.code} — {row.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="dispose-reason">
                  Reason
                </label>
                <input
                  id="dispose-reason"
                  value={disposeDraft.reason}
                  onChange={(event) => onDisposeChange({ ...disposeDraft, reason: event.target.value })}
                  placeholder="Sold to a neighbouring shop"
                  required
                />
              </div>
            </div>
            <p className="note" style={{ margin: 0 }}>
              The month it left in is charged up to that day first, then the cost and the write-down are cleared against
              the proceeds, and the difference posts as a gain or a loss. Nothing more is charged in a month that has
              already been run in full.
            </p>
            <div className="row">
              <button className="btn" type="submit" disabled={busy || disposeDraft.reason.trim().length < 3}>
                {busy ? "Disposing…" : "Record disposal"}
              </button>
            </div>
          </form>

          {disposal && !disposal.voided_by_entry_id ? (
            <div className="stack">
              <h3 className="label">Undo that disposal</h3>
              <div className="field">
                <label className="label" htmlFor="void-reason">
                  Why
                </label>
                <input
                  id="void-reason"
                  value={voidReason}
                  onChange={(event) => onVoidReason(event.target.value)}
                  placeholder="The sale fell through"
                />
              </div>
              <p className="note" style={{ margin: 0 }}>
                Voids the disposal entry by writing its mirror and puts the asset back with its written-down value
                intact. The stub charge for the month it left stays: those days happened.
              </p>
              <div className="row">
                <button
                  className="btn btn--quiet"
                  type="button"
                  disabled={busy || voidReason.trim().length < 3}
                  onClick={() => void onVoidDisposal()}
                >
                  Undo the disposal
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-2" style={{ alignItems: "start", padding: "0 var(--s-4) var(--s-5)" }}>
        <div>
          <h3 className="label">Charged so far</h3>
          {loading ? (
            <div className="skeleton" style={{ height: "4rem", marginTop: "var(--s-2)" }} />
          ) : (
            <div className="ledger-scroll">
              <table className="ledger">
                <thead>
                  <tr>
                    <th scope="col">Month</th>
                    <th scope="col" className="num">
                      Charge
                    </th>
                    <th scope="col" className="num">
                      Days
                    </th>
                    <th scope="col" className="num">
                      Book value after
                    </th>
                    <th scope="col">State</th>
                  </tr>
                </thead>
                <tbody>
                  {(schedule?.history ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="muted">
                        Nothing charged yet — run a month on the Depreciation tab.
                      </td>
                    </tr>
                  ) : (
                    (schedule?.history ?? []).map((row) => (
                      <tr key={row.id}>
                        <td className="mono nowrap">{row.period_key}</td>
                        <td className="num">
                          <Amount value={row.amount_bdt} size="sm" />
                        </td>
                        <td className="num mono muted">
                          {row.days_charged}/{row.days_in_month}
                          {row.prorated ? <span className="chip chip--short" style={{ marginLeft: "var(--s-2)" }}>part month</span> : null}
                        </td>
                        <td className="num">
                          <Amount value={row.nbv_after_bdt} size="sm" />
                        </td>
                        <td>
                          {row.status === "REVERSED" ? (
                            <span className="chip chip--short">reversed</span>
                          ) : (
                            <span className="muted">posted</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h3 className="label">Still to come</h3>
          {loading ? (
            <div className="skeleton" style={{ height: "4rem", marginTop: "var(--s-2)" }} />
          ) : asset.status === "DISPOSED" ? (
            <p className="note" style={{ margin: 0 }}>
              This asset has left the books, so there is nothing left to write down.
            </p>
          ) : (
            <div className="ledger-scroll">
              <table className="ledger">
                <thead>
                  <tr>
                    <th scope="col">Month</th>
                    <th scope="col" className="num">
                      Charge
                    </th>
                    <th scope="col" className="num">
                      Book value after
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(schedule?.projected ?? []).map((row) => (
                    <tr key={row.period_key}>
                      <td className="mono nowrap">{row.period_key}</td>
                      <td className="num">
                        <Amount value={row.amount_bdt} size="sm" />
                      </td>
                      <td className="num muted">
                        <Amount value={row.nbv_after_bdt} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {schedule?.projected_truncated ? (
            <p className="note" style={{ marginTop: "var(--s-2)" }}>
              That is as far ahead as the screen shows. The life is longer than the list.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ── Depreciation ────────────────────────────────────────────────────────── */

function DepreciationSection({
  period,
  onPeriod,
  preview,
  canWrite,
  busy,
  onRun,
  batches,
  openBatch,
  batchRuns,
  onToggleBatch,
  reverseDraft,
  onReverseDraft,
  onReverse,
}: {
  period: string;
  onPeriod: (next: string) => void;
  preview: DepreciationPreview | null;
  canWrite: boolean;
  busy: boolean;
  onRun: () => Promise<void>;
  batches: DepreciationBatch[];
  openBatch: string | null;
  batchRuns: DepreciationRun[];
  onToggleBatch: (id: string) => Promise<void>;
  reverseDraft: { batch_id: string; reason: string };
  onReverseDraft: (next: { batch_id: string; reason: string }) => void;
  onReverse: (id: string, reason: string) => Promise<void>;
}) {
  return (
    <section className="section">
      <div className="panel">
        <div className="panel-head">
          <h2 style={{ fontSize: "var(--t-lg)" }}>This month&rsquo;s write-down</h2>
          <div className="row" style={{ gap: "var(--s-3)", alignItems: "flex-end" }}>
            <div className="field" style={{ margin: 0 }}>
              <label className="label" htmlFor="dep-period">
                Month
              </label>
              <input
                id="dep-period"
                type="month"
                className="mono"
                value={period}
                onChange={(event) => onPeriod(event.target.value)}
              />
            </div>
            {canWrite ? (
              <button
                className="btn"
                type="button"
                disabled={busy || !preview?.postable}
                onClick={() => void onRun()}
              >
                {busy
                  ? "Posting…"
                  : preview?.lines.length
                    ? `Post ${preview.total_bdt} taka`
                    : "Post this month"}
              </button>
            ) : null}
          </div>
        </div>

        {preview ? (
          <>
            <p className="note" style={{ padding: "0 var(--s-4)", margin: "var(--s-2) 0 0" }}>
              {preview.postable ? (
                <>
                  {preview.eligible_count} {preview.eligible_count === 1 ? "asset is" : "assets are"} due for{" "}
                  {preview.period_label}. The charges are dated {preview.date}, the last day of the month, and they post
                  as one entry.
                </>
              ) : (
                preview.blocked_reason
              )}
            </p>

            <div className="ledger-scroll">
              <table className="ledger">
                <caption className="sr-only">Depreciation due for the selected month</caption>
                <thead>
                  <tr>
                    <th scope="col">Tag</th>
                    <th scope="col">Asset</th>
                    <th scope="col" className="num">
                      Charge
                    </th>
                    <th scope="col" className="num">
                      Full month
                    </th>
                    <th scope="col" className="num">
                      Days
                    </th>
                    <th scope="col" className="num">
                      Written off after
                    </th>
                    <th scope="col" className="num">
                      Book value after
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {preview.lines.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="muted">
                        Nothing due. Every asset is either already charged for {preview.period_label} or fully written
                        down.
                      </td>
                    </tr>
                  ) : (
                    preview.lines.map((row) => (
                      <tr key={row.asset_id}>
                        <td className="mono nowrap">{row.code}</td>
                        <td>
                          {row.name}
                          {row.final ? (
                            <span className="chip chip--short" style={{ marginLeft: "var(--s-2)" }}>
                              last charge
                            </span>
                          ) : null}
                        </td>
                        <td className="num">
                          <Amount value={row.amount_bdt} size="sm" />
                        </td>
                        <td className="num muted">
                          <Amount value={row.monthly_charge_bdt} size="sm" />
                        </td>
                        <td className="num mono muted">
                          {row.days_charged}/{row.days_in_month}
                        </td>
                        <td className="num">
                          <Amount value={row.accum_after_bdt} size="sm" />
                        </td>
                        <td className="num">
                          <Amount value={row.nbv_after_bdt} size="sm" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {preview.skipped.length > 0 ? (
              <p className="note" style={{ padding: "0 var(--s-4) var(--s-4)", margin: 0 }}>
                Not charged:{" "}
                {preview.skipped.map((row, index) => (
                  <span key={row.asset_id}>
                    {index > 0 ? ", " : ""}
                    <span className="mono">{row.code}</span> ({SKIP_REASON_LABEL[row.reason]})
                  </span>
                ))}
                .
              </p>
            ) : null}
          </>
        ) : (
          <div className="skeleton" style={{ height: "6rem", margin: "var(--s-4)" }} />
        )}
      </div>

      <div className="panel panel--flush" style={{ marginTop: "var(--s-5)" }}>
        <div className="panel-head">
          <h2 style={{ fontSize: "var(--t-lg)" }}>Runs</h2>
          <span className="muted" style={{ fontSize: "var(--t-sm)" }}>
            newest first · one entry per run
          </span>
        </div>
        <div className="ledger-scroll">
          <table className="ledger">
            <caption className="sr-only">Depreciation runs</caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Posted</th>
                <th scope="col" className="num">
                  Assets
                </th>
                <th scope="col" className="num">
                  Total
                </th>
                <th scope="col">State</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
                    No depreciation has been run yet.
                  </td>
                </tr>
              ) : (
                batches.map((row) => (
                  <tr key={row.batch_id}>
                    <td className="mono nowrap">{row.period_key}</td>
                    <td className="muted nowrap">{row.date}</td>
                    <td className="num mono">{row.asset_count}</td>
                    <td className="num">
                      <Amount value={row.total_bdt} size="sm" />
                    </td>
                    <td>
                      {row.status === "POSTED" ? (
                        <span className="muted">posted</span>
                      ) : row.status === "REVERSED" ? (
                        <span className="chip chip--short">reversed</span>
                      ) : (
                        <span className="chip chip--short">partly reversed</span>
                      )}
                      {row.reason ? <span className="muted"> — {row.reason}</span> : null}
                    </td>
                    <td className="nowrap">
                      <div className="row" style={{ gap: "var(--s-2)" }}>
                        <button
                          className="btn btn--quiet btn--sm"
                          type="button"
                          onClick={() => void onToggleBatch(row.batch_id)}
                        >
                          {openBatch === row.batch_id ? "Hide" : "What it charged"}
                        </button>
                        {canWrite && row.status !== "REVERSED" ? (
                          <button
                            className="btn btn--quiet btn--sm"
                            type="button"
                            onClick={() => onReverseDraft({ batch_id: row.batch_id, reason: "" })}
                          >
                            Reverse
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {openBatch ? (
          <div style={{ padding: "0 var(--s-4) var(--s-4)" }}>
            <table className="ledger">
              <thead>
                <tr>
                  <th scope="col">Tag</th>
                  <th scope="col">Asset</th>
                  <th scope="col" className="num">
                    Charge
                  </th>
                  <th scope="col" className="num">
                    Written off before
                  </th>
                  <th scope="col" className="num">
                    After
                  </th>
                </tr>
              </thead>
              <tbody>
                {batchRuns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">
                      Loading…
                    </td>
                  </tr>
                ) : (
                  batchRuns.map((row) => (
                    <tr key={row.id}>
                      <td className="mono nowrap">{row.code}</td>
                      <td>{row.name}</td>
                      <td className="num">
                        <Amount value={row.amount_bdt} size="sm" />
                      </td>
                      <td className="num muted">
                        <Amount value={row.accum_before_bdt} size="sm" />
                      </td>
                      <td className="num">
                        <Amount value={row.accum_after_bdt} size="sm" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {reverseDraft.batch_id !== "" ? (
          <form
            className="stack"
            style={{ padding: "0 var(--s-4) var(--s-5)" }}
            onSubmit={(event) => {
              event.preventDefault();
              void onReverse(reverseDraft.batch_id, reverseDraft.reason);
            }}
            noValidate
          >
            <h3 className="label">Reverse that run</h3>
            <div className="field">
              <label className="label" htmlFor="reverse-reason">
                Why
              </label>
              <input
                id="reverse-reason"
                value={reverseDraft.reason}
                onChange={(event) => onReverseDraft({ ...reverseDraft, reason: event.target.value })}
                placeholder="Wrong month — correcting the schedule"
                required
              />
            </div>
            <p className="note" style={{ margin: 0 }}>
              Voids the run&rsquo;s journal entry by writing its mirror and rolls the assets back to where they stood
              before it. The run stays in the history, marked reversed, and the month can be run again afterwards.
            </p>
            <div className="row" style={{ gap: "var(--s-2)" }}>
              <button className="btn" type="submit" disabled={busy || reverseDraft.reason.trim().length < 3}>
                {busy ? "Reversing…" : "Reverse the run"}
              </button>
              <button
                className="btn btn--quiet"
                type="button"
                onClick={() => onReverseDraft({ batch_id: "", reason: "" })}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </section>
  );
}
