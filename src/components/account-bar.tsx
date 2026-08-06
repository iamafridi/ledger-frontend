"use client";

import { useState } from "react";

import { useAuth } from "./auth-provider";
import { useSession } from "./session-provider";
import { DEMO_EMAIL } from "@/lib/demo";

/**
 * Who you are signed in as, and how to become someone else.
 *
 * Not decoration. Every figure in this application is scoped to one account, and
 * a ledger showing someone else's salary looks exactly like a ledger showing
 * your own — there is no visual difference between "your April" and a
 * colleague's except the identity printed here. On a shared laptop, or during a
 * demo where several accounts get used in a row, that is the difference between
 * reading your own numbers and quietly reading someone else's.
 *
 * The shared demo account is called out explicitly, because anything typed into
 * it is visible to everyone else using it and that is worth knowing before you
 * enter a real salary.
 *
 * "Switch account" is a sign-out followed by the sign-in screen rather than an
 * in-place picker: Firebase holds one session at a time, so a list of accounts
 * would be a promise the auth model cannot keep.
 */
export function AccountBar() {
  const { user, signOut } = useAuth();
  const { session } = useSession();
  const [busy, setBusy] = useState<"switch" | "out" | null>(null);

  if (!user) return null;

  const email = user.email ?? null;
  const identity = email ?? user.displayName ?? "Signed in";
  const isDemo = email === DEMO_EMAIL;

  /** Initials for the avatar. Falls back to a single glyph rather than showing
   *  an empty circle when there is no name and no email. */
  const initials = (user.displayName ?? email ?? "?")
    .replace(/@.*$/, "")
    .split(/[.\-_\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

  async function leave(next: "switch" | "out") {
    setBusy(next);
    try {
      await signOut();
      const target = next === "switch" ? "/login?switch=true" : "/login?signedOut=true";
      window.location.href = target;
    } catch {
      window.location.href = "/login";
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="account-bar">
      <div className="app-content-wrap account-bar-inner">
        <div className="account-identity">
          <span className="account-avatar" aria-hidden="true">
            {initials}
          </span>

          <span className="account-text">
            <span className="label account-label">Signed in as</span>
            <span className="account-email" title={identity}>
              {identity}
            </span>
          </span>

          {session ? (
            <span className="chip account-tag" title="Your role in this organisation">
              {session.role.toLowerCase()}
            </span>
          ) : null}

          {isDemo ? (
            <span className="chip chip--ok account-tag">
              shared demo · case PUB-01
            </span>
          ) : (
            <span className="chip account-tag">
              <span className="account-dot" aria-hidden="true" />
              private ledger
            </span>
          )}
        </div>

        <div className="row account-actions">
          <button
            type="button"
            className="btn btn--quiet btn--sm"
            disabled={busy !== null}
            onClick={() => void leave("switch")}
          >
            {busy === "switch" ? "Switching…" : "Switch account"}
          </button>
          <button
            type="button"
            className="btn btn--quiet btn--sm"
            disabled={busy !== null}
            onClick={() => void leave("out")}
          >
            {busy === "out" ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}
