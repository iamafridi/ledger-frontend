"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { api, ApiError } from "@/lib/api";
import type { SessionInfo } from "@/lib/types";
import { useAuth } from "./auth-provider";

interface SessionValue {
  /** Null before the first `/auth/me` reply, and whenever signed out. */
  session: SessionInfo | null;
  loading: boolean;
  /** Set when `/auth/me` itself failed — a network or API problem, not a denial. */
  error: string | null;
  can(permission: string): boolean;
}

const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}

/**
 * Loads the caller's organisation, role and permission codes once per
 * signed-in session.
 *
 * `can()` fails **open** while the session is unknown, and this is deliberate.
 * The server enforces permissions on every request regardless, so a wrong
 * answer here can never grant anything — but a wrong answer the other way
 * would hide the whole application because a single request failed, and an API
 * blip must not look like a permissions change. Once the real permission list
 * arrives it is used exactly.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setSession(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    api<SessionInfo>("/auth/me")
      .then((value) => {
        if (!cancelled) setSession(value);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof ApiError ? cause.message : "Could not load your session.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  const value = useMemo<SessionValue>(
    () => ({
      session,
      loading,
      error,
      can: (permission: string) =>
        session ? session.permissions.includes(permission) : true,
    }),
    [session, loading, error],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
