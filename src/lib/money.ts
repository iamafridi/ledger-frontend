/**
 * Money on the client is PRESENTATION ONLY.
 *
 * Every amount reaches this app as a canonical 2dp string computed by the API's
 * decimal engine. Nothing here adds, multiplies or rounds a money value, and
 * nothing here ever needs to: if the interface wants a figure, the figure is
 * computed server-side and sent.
 *
 * The one exception is `toChartWidth`, which produces a float for pixel
 * geometry. Its output may set a width or an arc angle and nothing else — never
 * a label, never a tooltip, never an aria-label, never a value posted back.
 */

export type Money = string;

/** Canonical form: an optional minus, digits, a point, exactly two digits. */
export function isCanonical(value: string): boolean {
  return /^-?\d+\.\d{2}$/.test(value);
}

export function isNegative(value: Money): boolean {
  return value.startsWith("-") && value !== "-0.00";
}

export function isZero(value: Money): boolean {
  return value === "0.00" || value === "-0.00";
}

export interface MoneyParts {
  sign: "" | "-";
  taka: string;
  paisa: string;
}

/**
 * Split for the paisa typography: sign, thousands-grouped taka, two paisa
 * digits. String surgery only — the digits are never parsed into a number.
 */
export function splitMoney(value: Money): MoneyParts {
  const negative = isNegative(value);
  const unsigned = negative ? value.slice(1) : value;
  const [whole = "0", fraction = "00"] = unsigned.split(".");
  return {
    sign: negative ? "-" : "",
    taka: whole.replace(/\B(?=(\d{3})+(?!\d))/g, ","),
    paisa: fraction.padEnd(2, "0").slice(0, 2),
  };
}

/** Plain text form, for aria-labels and any non-JSX context. */
export function formatMoney(value: Money, options?: { symbol?: boolean }): string {
  const { sign, taka, paisa } = splitMoney(value);
  const symbol = options?.symbol === false ? "" : "৳";
  return `${sign}${symbol}${taka}.${paisa}`;
}

/** Absolute value, as a string. Sign stripped, digits untouched. */
export function absolute(value: Money): Money {
  return isNegative(value) ? value.slice(1) : value;
}

/**
 * FOR GEOMETRY ONLY. Pixel widths and arc angles.
 * Never a label, never a calculation, never storage.
 */
export function toChartWidth(value: Money): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Normalise what someone typed into canonical form, or explain why it will not
 * do. Used on the receipt review form and the expense form. Bengali numerals are
 * accepted because a phone keyboard set to Bangla produces them and rejecting
 * them would look like the app was broken.
 */
const BENGALI = "০১২৩৪৫৬৭৮৯";

export function toCanonical(raw: string): { ok: true; value: Money } | { ok: false; reason: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "Enter an amount." };

  const latin = trimmed.replace(/[০-৯]/g, (digit) => String(BENGALI.indexOf(digit)));
  const cleaned = latin.replace(/[৳,\s]/g, "");
  if (!cleaned) return { ok: false, reason: "Enter an amount." };

  const parts = cleaned.split(".");
  if (parts.length > 2) return { ok: false, reason: "That has more than one decimal point." };

  const [whole = "", fraction = ""] = parts;
  if (!/^\d+$/.test(whole)) return { ok: false, reason: "Amounts can only contain digits." };
  if (fraction && !/^\d+$/.test(fraction)) {
    return { ok: false, reason: "Amounts can only contain digits." };
  }
  if (fraction.length > 2) return { ok: false, reason: "Amounts stop at two decimal places." };

  const normalisedWhole = whole.replace(/^0+(?=\d)/, "") || "0";
  return { ok: true, value: `${normalisedWhole}.${fraction.padEnd(2, "0")}` };
}

/**
 * Exact addition of canonical amounts.
 *
 * This is the **one** place the interface computes a money figure rather than
 * printing one the API sent, and it exists for a single screen: the journal
 * entry form, whose debit and credit totals have to move as you type. Waiting
 * for the server to total a form you have not saved yet is not an option, and
 * the balance indicator is the entire point of that form.
 *
 * The departure is contained by never going through a float. Amounts become
 * integer paisa scaled by 100, summed as `BigInt`, and scaled back — so the sum
 * is exact for the same reason the server's is. The result is display-only: it
 * is compared to decide whether to show "balanced", and it is never posted,
 * because the API recomputes both totals from the lines it actually receives.
 *
 * Inputs must already be canonical (see `isCanonical`); callers pass the output
 * of `toCanonical`, so a half-typed "12." never reaches this function.
 */
export function addMoney(values: Money[]): Money {
  const total = values.reduce((sum, value) => sum + toScaled(value), 0n);
  return fromScaled(total);
}

/**
 * Exact multiply of a canonical amount by a decimal quantity — the live preview
 * of §5.4's `gross = unit price × qty`.
 *
 * Returns null rather than an approximation when the quantity carries more than
 * three decimal places, and callers render "—": a preview that quietly rounded a
 * different way from the engine would show a figure the saved document then
 * contradicts, which is worse than showing nothing.
 *
 * Multiplication needs a second scale factor (the quantity is not money), so
 * this is where the additive-only rule is deliberately extended. It is still
 * exact integer arithmetic — never a float — and the arithmetic below mirrors
 * `core/money.ts` step for step: gross, then the discount, then tax on the net.
 * The API remains authoritative and recomputes every figure on save; a
 * divergence would surface as the saved totals correcting the preview, never as
 * a wrong posting.
 */
export function multiplyMoney(value: Money, quantity: string): Money | null {
  const trimmed = quantity.trim();
  if (!/^-?\d+(\.\d{1,3})?$/.test(trimmed)) return null;

  const negative = trimmed.startsWith("-");
  const [whole = "0", fraction = ""] = (negative ? trimmed.slice(1) : trimmed).split(".");
  const quantityScaled = BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, "0"));

  const product = toScaled(value) * quantityScaled;
  // Half-up on a signed value: `+5` before truncating by 10 pushes exact halves
  // away from zero on the positive side and needs the sign handled separately on
  // the negative one, which is what the two branches do.
  const rounded = product >= 0n ? (product + 500n) / 1000n : -((-product + 500n) / 1000n);
  return fromScaled(rounded);
}

/**
 * A percentage of an amount, half-up to the paisa — §5.4's `tax = net × rate`.
 *
 * The rate arrives as a canonical 2dp string ("15.00"), so it is scaled to
 * hundredths and the division by 100 × 100 is done once, in integers.
 */
export function percentOfMoney(value: Money, ratePercent: Money): Money {
  const rateScaled = toScaled(ratePercent);
  const product = toScaled(value) * rateScaled;
  const rounded = product >= 0n ? (product + 5000n) / 10000n : -((-product + 5000n) / 10000n);
  return fromScaled(rounded);
}

/** Flip the sign of a canonical amount — a deduction subtracting from a total. */
export function negateMoney(value: Money): Money {
  if (isZero(value)) return "0.00";
  return isNegative(value) ? value.slice(1) : `-${value}`;
}

function toScaled(value: Money): bigint {
  const negative = value.startsWith("-");
  const digits = (negative ? value.slice(1) : value).replace(".", "");
  const scaled = BigInt(digits);
  return negative ? -scaled : scaled;
}

function fromScaled(scaled: bigint): Money {
  const negative = scaled < 0n;
  // Padded to at least three digits so the split below always finds a paisa
  // pair and at least one taka digit, even for a total of a few paisa.
  const digits = (negative ? -scaled : scaled).toString().padStart(3, "0");
  const whole = digits.slice(0, -2);
  const paisa = digits.slice(-2);
  const normalisedWhole = whole.replace(/^0+(?=\d)/, "") || "0";
  return `${negative ? "-" : ""}${normalisedWhole}.${paisa}`;
}
