"use client";

import { useCallback, useEffect, useState } from "react";

import { Amount } from "@/components/money";
import { RatePreview, SalaryHistory } from "@/components/charts-extra";
import { MonthPicker } from "@/components/month-picker";
import { useAuth } from "@/components/auth-provider";
import { useSession } from "@/components/session-provider";
import { toast } from "@/components/toast-provider";
import { api, ApiError } from "@/lib/api";
import { toCanonical } from "@/lib/money";
import { currentMonth, monthLabel } from "@/lib/use-dashboard";
import { VAT_MODE_LABEL, type NumberingPrefixes, type OrgProfile, type VatMode } from "@/lib/types";

/**
 * Salary is set per month — required item 1's first half — and the DPS rate is
 * editable because required item 4 asks for a return "at a rate you state". A
 * rate the user cannot see or change is not a stated rate.
 *
 * Both settings are shown with a chart of their consequence: the salary history
 * makes the per-month decision visible as a step, and the rate preview shows
 * immediately what changing the figure does to a fixed contribution.
 */
export default function SettingsPage() {
  const { user } = useAuth();
  const { can } = useSession();
  const canManageOrg = can("settings.manage");
  const [month, setMonth] = useState(currentMonth());

  const [salary, setSalary] = useState("");
  const [storedSalary, setStoredSalary] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ month: string; amount_bdt: string }>>([]);
  const [rate, setRate] = useState("");
  const [savedRate, setSavedRate] = useState("8.00");
  const [status, setStatus] = useState<{ tone: "ok" | "error"; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<Record<string, string> | null>(null);

  // The organisation profile (P2): what its documents print, and how its
  // numbers are prefixed. Held as both a draft and the last saved copy, so the
  // save button can say whether anything actually changed.
  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [savedProfile, setSavedProfile] = useState<OrgProfile | null>(null);
  const [profileStatus, setProfileStatus] = useState<{
    tone: "ok" | "error";
    message: string;
  } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const load = useCallback(async () => {
    try {
      const [{ amount_bdt }, { settings }, { salaries }] = await Promise.all([
        api<{ month: string; amount_bdt: string }>(`/salaries/effective?month=${month}`),
        api<{ settings: { dps_annual_rate_percent: string } }>("/settings"),
        api<{ salaries: Array<{ month: string; amount_bdt: string }> }>("/salaries"),
      ]);
      setStoredSalary(amount_bdt);
      setSalary(amount_bdt === "0.00" ? "" : amount_bdt);
      setRate(settings.dps_annual_rate_percent);
      setSavedRate(settings.dps_annual_rate_percent);
      setHistory(salaries);
    } catch {
      setStatus({ tone: "error", message: "Could not load your settings." });
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    api<Record<string, string>>("/health")
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    api<{ profile: OrgProfile }>("/settings/org")
      .then(({ profile: loaded }) => {
        setProfile(loaded);
        setSavedProfile(loaded);
      })
      .catch(() =>
        setProfileStatus({
          tone: "error",
          message: "Could not load the organisation profile.",
        }),
      );
  }, []);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;

    setSavingProfile(true);
    setProfileStatus(null);
    try {
      const { profile: saved } = await api<{ profile: OrgProfile }>("/settings/org", {
        method: "PUT",
        body: {
          name: profile.name,
          address: profile.address,
          logo_url: profile.logo_url,
          bin: profile.bin,
          vat_mode: profile.vat_mode,
          numbering_prefixes: profile.numbering_prefixes,
        },
      });
      setProfile(saved);
      setSavedProfile(saved);
      setProfileStatus({ tone: "ok", message: "Organisation profile saved." });
      toast.success("Organisation profile saved");
    } catch (caught) {
      const msg = caught instanceof ApiError ? caught.message : "Could not save the profile.";
      setProfileStatus({ tone: "error", message: msg });
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  }

  function setProfileField<K extends keyof OrgProfile>(key: K, value: OrgProfile[K]) {
    setProfile((current) => (current ? { ...current, [key]: value } : current));
  }

  function setPrefix(kind: keyof NumberingPrefixes, value: string) {
    setProfile((current) =>
      current ? { ...current, numbering_prefixes: { ...current.numbering_prefixes, [kind]: value } } : current,
    );
  }

  async function saveSalary(event: React.FormEvent) {
    event.preventDefault();
    const amount = toCanonical(salary);
    if (!amount.ok) {
      setStatus({ tone: "error", message: amount.reason });
      toast.error(amount.reason);
      return;
    }

    setBusy(true);
    try {
      await api("/salaries", { method: "PUT", body: { month, amount_bdt: amount.value } });
      setStoredSalary(amount.value);
      const msg = `Salary for ${monthLabel(month)} saved.`;
      setStatus({ tone: "ok", message: msg });
      toast.success(msg);
      await load();
    } catch (caught) {
      const msg = caught instanceof ApiError ? caught.message : "Could not save the salary.";
      setStatus({ tone: "error", message: msg });
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function saveRate(event: React.FormEvent) {
    event.preventDefault();
    const parsed = toCanonical(rate);
    if (!parsed.ok) {
      setStatus({ tone: "error", message: parsed.reason });
      toast.error(parsed.reason);
      return;
    }

    setBusy(true);
    try {
      await api("/settings", { method: "PUT", body: { dps_annual_rate_percent: parsed.value } });
      setSavedRate(parsed.value);
      const msg = `DPS rate set to ${parsed.value}% a year.`;
      setStatus({ tone: "ok", message: msg });
      toast.success(msg);
    } catch (caught) {
      const msg = caught instanceof ApiError ? caught.message : "Could not save the rate.";
      setStatus({ tone: "error", message: msg });
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  // The preview follows what is typed, so the effect of a change is visible
  // before it is committed.
  const previewRate = /^\d+(\.\d{1,2})?$/.test(rate.trim()) ? rate.trim() : savedRate;

  return (
    <>
      {/* ---------------------------------------------------------------- 01 */}
      <section className="section">
        <p className="eyebrow">01 &nbsp; Salary</p>

        {status ? (
          <p
            className={`alert ${status.tone === "error" ? "alert--error" : "alert--ok"}`}
            role="status"
            style={{ marginTop: "var(--s-4)" }}
          >
            {status.message}
          </p>
        ) : null}

        <div className="grid grid-sidebar" style={{ marginTop: "var(--s-5)", alignItems: "start" }}>
          <div className="panel panel--hero">
            <div className="panel-head">
              <h2 style={{ fontSize: "var(--t-lg)" }}>Salary history</h2>
              <span className="chip">{history.length} recorded</span>
            </div>
            <SalaryHistory entries={history} />
          </div>

          <form className="panel stack" onSubmit={saveSalary} noValidate>
            <div className="panel-head">
              <h2 style={{ fontSize: "var(--t-lg)" }}>Set salary</h2>
              <MonthPicker month={month} onChange={setMonth} />
            </div>

            <div className="field">
              <label className="label" htmlFor="salary">
                Salary for {monthLabel(month)}
              </label>
              <input
                id="salary"
                inputMode="decimal"
                placeholder="0.00"
                value={salary}
                onChange={(event) => setSalary(event.target.value)}
              />
            </div>

            {storedSalary && storedSalary !== "0.00" ? (
              <p className="note" style={{ margin: 0 }}>
                Currently <Amount value={storedSalary} />
              </p>
            ) : null}

            <button className="btn" type="submit" disabled={busy}>
              Save salary
            </button>

            <p className="note" style={{ fontSize: "var(--t-xs)" }}>
              Salary is recorded against a month, not against your profile. A raise in June should
              not silently restate April&rsquo;s dashboard. A month you have not set inherits the
              most recent earlier one.
            </p>
          </form>
        </div>
      </section>

      <hr className="sep sep--marked" />

      {/* ---------------------------------------------------------------- 02 */}
      <section className="section">
        <p className="eyebrow">02 &nbsp; DPS rate</p>
        <div className="grid grid-sidebar" style={{ marginTop: "var(--s-5)", alignItems: "start" }}>
          <div className="panel">
            <div className="panel-head">
              <h2 style={{ fontSize: "var(--t-lg)" }}>What {previewRate}% does</h2>
              <span className="chip chip--ok">live preview</span>
            </div>
            <RatePreview ratePercent={previewRate} />
          </div>

          <form className="panel stack" onSubmit={saveRate} noValidate>
            <div className="field">
              <label className="label" htmlFor="rate">
                Annual rate, percent
              </label>
              <input
                id="rate"
                inputMode="decimal"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
              />
            </div>

            <div className="row" style={{ gap: "var(--s-2)" }}>
              {["6.00", "8.00", "9.00", "10.00", "12.00"].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  className={`btn btn--sm ${preset === rate ? "" : "btn--quiet"}`}
                  onClick={() => setRate(preset)}
                >
                  {preset}%
                </button>
              ))}
            </div>

            <button className="btn" type="submit" disabled={busy}>
              Save rate
            </button>

            <p className="note" style={{ fontSize: "var(--t-xs)" }}>
              Every DPS figure is computed at this rate, month by month: the deposit is added, then
              interest of balance × rate ÷ 12 ÷ 100 is rounded half-up to the paisa and joins the
              balance, so later months earn on it. The full schedule is on each pocket.
            </p>
          </form>
        </div>
      </section>

      <hr className="sep sep--marked" />

      {/* ---------------------------------------------------------------- 03 */}
      <section className="section">
        <p className="eyebrow">03 &nbsp; This deployment</p>
        <div className="grid grid-3" style={{ marginTop: "var(--s-5)" }}>
          {[
            { label: "Signed in as", value: user?.email ?? "—", ok: Boolean(user) },
            { label: "API", value: health ? "connected" : "unreachable", ok: Boolean(health) },
            {
              label: "Database",
              value: health?.database ?? "—",
              ok: health?.database === "connected",
            },
            {
              label: "Receipt reading",
              value: health?.receipt_ocr === "none" ? "not configured" : (health?.receipt_ocr ?? "—"),
              ok: Boolean(health?.receipt_ocr && health.receipt_ocr !== "none"),
            },
            { label: "Ledger date", value: health?.ledger_date ?? "—", ok: Boolean(health) },
            { label: "Timezone", value: "Asia/Dhaka", ok: true },
          ].map((item) => (
            <div className="panel status-tile" key={item.label}>
              <span className={`status-dot ${item.ok ? "is-ok" : "is-off"}`} aria-hidden="true" />
              <div style={{ minWidth: 0 }}>
                <p className="label">{item.label}</p>
                <p className="mono status-value">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="note" style={{ marginTop: "var(--s-4)", fontSize: "var(--t-xs)" }}>
          Receipt reading is optional. Without a configured provider the scan endpoint reports
          itself unavailable and expenses are entered by hand — a reduced feature, not a broken
          page.
        </p>
      </section>

      <hr className="sep sep--marked" />

      {/* ---------------------------------------------------------------- 04 */}
      <section className="section">
        <p className="eyebrow">04 &nbsp; Organisation</p>
        <p className="muted" style={{ marginTop: "var(--s-3)", maxWidth: "62ch" }}>
          What every document prints about the business, and how its numbers are prefixed. Changing a
          prefix affects numbers issued after it — a number already issued is never restated.
        </p>

        {profileStatus ? (
          <p
            className={`alert ${profileStatus.tone === "error" ? "alert--error" : "alert--ok"}`}
            role={profileStatus.tone === "error" ? "alert" : "status"}
            style={{ marginTop: "var(--s-4)" }}
          >
            {profileStatus.message}
          </p>
        ) : null}

        {profile ? (
          <form className="panel stack" style={{ marginTop: "var(--s-5)" }} onSubmit={saveProfile} noValidate>
            <div className="panel-head">
              <h2 style={{ fontSize: "var(--t-lg)" }}>Profile</h2>
              <span className="chip">{profile.base_currency}</span>
            </div>

            <div className="grid grid-3">
              <div className="field">
                <label className="label" htmlFor="org-name">
                  Name
                </label>
                <input
                  id="org-name"
                  value={profile.name}
                  disabled={!canManageOrg}
                  onChange={(event) => setProfileField("name", event.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="org-bin">
                  BIN / TIN <span className="faint">prints on VAT invoices</span>
                </label>
                <input
                  id="org-bin"
                  className="mono"
                  value={profile.bin}
                  disabled={!canManageOrg}
                  onChange={(event) => setProfileField("bin", event.target.value)}
                  placeholder="000000000000-0000"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="org-vat">
                  Tax treatment
                </label>
                <select
                  id="org-vat"
                  value={profile.vat_mode}
                  disabled={!canManageOrg}
                  onChange={(event) => setProfileField("vat_mode", event.target.value as VatMode)}
                >
                  {(["NONE", "EXCLUSIVE", "INCLUSIVE"] as const).map((mode) => (
                    <option key={mode} value={mode}>
                      {VAT_MODE_LABEL[mode]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label className="label" htmlFor="org-address">
                  Address
                </label>
                <input
                  id="org-address"
                  value={profile.address}
                  disabled={!canManageOrg}
                  onChange={(event) => setProfileField("address", event.target.value)}
                  placeholder="12 Motijheel, Dhaka 1000"
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label className="label" htmlFor="org-logo">
                  Logo URL <span className="faint">optional</span>
                </label>
                <input
                  id="org-logo"
                  value={profile.logo_url}
                  disabled={!canManageOrg}
                  onChange={(event) => setProfileField("logo_url", event.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            <div className="field">
              <span className="label">Numbering prefixes</span>
              <div className="grid grid-3" style={{ marginTop: "var(--s-2)" }}>
                {(Object.keys(profile.numbering_prefixes) as Array<keyof NumberingPrefixes>).map(
                  (kind) => (
                    <div className="field" key={kind}>
                      <label className="label" htmlFor={`prefix-${kind}`}>
                        {kind.replace("_", " ")}
                      </label>
                      <input
                        id={`prefix-${kind}`}
                        className="mono"
                        value={profile.numbering_prefixes[kind]}
                        disabled={!canManageOrg}
                        onChange={(event) => setPrefix(kind, event.target.value)}
                        placeholder="none"
                        maxLength={12}
                      />
                    </div>
                  ),
                )}
              </div>
              <p className="note" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
                Blank keeps the plain <span className="mono">2026-01</span> shape; “INV” gives{" "}
                <span className="mono">INV-2026-01</span>. Letters, digits and dashes only.
              </p>
            </div>

            {canManageOrg ? (
              <div className="row">
                <button
                  className="btn"
                  type="submit"
                  disabled={
                    savingProfile ||
                    JSON.stringify(profile) === JSON.stringify(savedProfile)
                  }
                >
                  {savingProfile ? "Saving…" : "Save profile"}
                </button>
              </div>
            ) : (
              <p className="note" style={{ margin: 0 }}>
                Your role can read the organisation profile but not change it.
              </p>
            )}
          </form>
        ) : (
          <div className="panel" style={{ marginTop: "var(--s-5)" }}>
            <div className="skeleton" style={{ height: "12rem" }} />
          </div>
        )}
      </section>
    </>
  );
}
