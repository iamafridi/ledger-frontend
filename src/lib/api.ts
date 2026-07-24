/**
 * The one place this app talks to the API.
 *
 * Every call attaches a fresh Firebase ID token. Tokens expire hourly, so
 * `getIdToken()` is called per request rather than cached — the SDK returns the
 * cached token until it is close to expiry and refreshes transparently, which is
 * exactly the behaviour we want and exactly what caching it ourselves would
 * break.
 */
import { firebaseAuth, isAuthConfigured } from "./firebase";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function authHeader(): Promise<Record<string, string>> {
  if (!isAuthConfigured) return {};
  const user = firebaseAuth().currentUser;
  if (!user) return {};
  return { authorization: `Bearer ${await user.getIdToken()}` };
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Multipart payload. Set instead of `body`; the content-type is left to the
   *  browser so it can add the multipart boundary. */
  form?: FormData;
  signal?: AbortSignal;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { ...(await authHeader()) };
  if (options.body !== undefined) headers["content-type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.form ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
      signal: options.signal ?? null,
    });
  } catch {
    // A network failure and an API error are different problems with different
    // fixes, so they get different messages rather than one generic one.
    throw new ApiError(0, "NETWORK", "Could not reach the ledger service. Check your connection.");
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (payload as { error?: { code?: string; message?: string; details?: unknown } } | null)
      ?.error;
    throw new ApiError(
      response.status,
      error?.code ?? "UNKNOWN",
      error?.message ?? "That did not work. Please try again.",
      error?.details as Record<string, string[]> | undefined,
    );
  }

  return (payload as { data: T }).data;
}

/**
 * Download a file from the API — the CSV export path.
 *
 * This deliberately does not go through `api()`: an export returns bytes with a
 * Content-Disposition, not the JSON envelope, and parsing it as JSON would
 * corrupt the download. The token still has to travel, so the header logic is
 * shared shape if not code — one place to change if auth ever moves.
 *
 * The blob is handed to the browser as an object URL and revoked once the
 * anchor click has landed, which is the standard SPA download without a page
 * navigation.
 */
export async function apiDownload(path: string, filename: string): Promise<void> {
  const headers: Record<string, string> = await authHeader();

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, { headers });
  } catch {
    throw new ApiError(0, "NETWORK", "Could not reach the ledger service. Check your connection.");
  }

  if (!response.ok) {
    // The error envelope is JSON even when the success path is not.
    const payload = (await response.json().catch(() => null)) as {
      error?: { code?: string; message?: string };
    } | null;
    throw new ApiError(
      response.status,
      payload?.error?.code ?? "UNKNOWN",
      payload?.error?.message ?? "That did not work. Please try again.",
    );
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
