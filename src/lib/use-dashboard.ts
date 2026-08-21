"use client";

import { useCallback, useEffect, useState } from "react";

import { api, ApiError } from "./api";
import type { Dashboard } from "./types";

/** The current month as YYYY-MM, in the ledger's timezone rather than the
 *  browser's, so the client and the API agree about which month it is. */
export function currentMonth(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .slice(0, 7);
}

/**
 * The month the account's data is anchored to, as YYYY-MM.
 *
 * Loading a sample case sets the account's as-of date, and the case's figures
 * live in *that* month — not the real current one. Opening on the as-of month
 * is the difference between signing in to a populated ledger and signing in to
 * an empty screen with the data hiding one month-picker click away.
 *
 * Returns null until the account's settings have loaded; callers fall back to
 * `currentMonth()` in the meantime.
 */
export function useDefaultMonth(): string | null {
  const [month, setMonth] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api<{ settings: { as_of_date?: string } }>("/settings")
      .then((result) => {
        if (!alive) return;
        const asOf = result.settings?.as_of_date;
        setMonth(asOf ? asOf.slice(0, 7) : currentMonth());
      })
      .catch(() => {
        if (alive) setMonth(currentMonth());
      });
    return () => {
      alive = false;
    };
  }, []);

  return month;
}

export function monthLabel(month: string): string {
  const [year, index] = month.split("-");
  const names = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${names[Number(index) - 1] ?? month} ${year}`;
}

export function useDashboard(month: string) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // An empty month means the caller is still resolving which month to open
    // on (see useDefaultMonth) — hold the skeleton rather than fetching.
    if (!month) return;
    setLoading(true);
    setError(null);
    try {
      setData(await api<Dashboard>(`/dashboard?month=${month}`));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load your ledger.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    if (!month) return;
    void load();
  }, [load, month]);

  return { data, error, loading, reload: load };
}
