/**
 * The shared demo account.
 *
 * Not a secret and not privileged: an ordinary account holding one published
 * case, so a reviewer can see every screen populated with real, checkable data
 * without registering or typing in a month of expenses first. Anything done in
 * it is visible to everyone else using it, which is the intended trade.
 *
 * It lives here rather than in the page because a Next.js route file may only
 * export the handful of names the framework recognises.
 */
export const DEMO_EMAIL = "demo@ledgerfinancial.com";
export const DEMO_PASSWORD = "Ledger2026!";

/** The case seeded into it, quoted in the interface so the figures can be
 *  checked against the published dataset. */
export const DEMO_CASE = "PUB-01";
