/**
 * The paisa typography, as a component.
 *
 * Taka at full size, paisa at 0.62em, tabular figures, decimal-aligned. This is
 * the signature detail of the interface and it is also functional: it puts the
 * digits that matter at full size and keeps a column of amounts scannable.
 *
 * The rendered value is split into spans, so an assistive technology would read
 * it in fragments. Every instance therefore carries a plain-text `aria-label`
 * and hides the decorative markup from the accessibility tree.
 */
import { formatMoney, isNegative, splitMoney, type Money } from "@/lib/money";

interface AmountProps {
  value: Money;
  /** "display" is the one hero figure on a screen. */
  size?: "sm" | "base" | "lg" | "display";
  /**
   * Colour by meaning.
   *
   * "auto" reads the sign, which is right for a delta but wrong wherever the
   * caller has already stripped the sign for display — a shortfall rendered as
   * an absolute value would come out in the positive colour and say the exact
   * opposite of what it means. "short" and "surplus" state it outright for those
   * cases, so the colour follows the meaning rather than the characters.
   */
  tone?: "auto" | "short" | "surplus" | "none";
  /** Render a leading + on positive values, for deltas. */
  signed?: boolean;
  className?: string;
}

export function Amount({
  value,
  size = "base",
  tone = "none",
  signed = false,
  className = "",
}: AmountProps) {
  const { sign, taka, paisa } = splitMoney(value);
  const negative = isNegative(value);

  const sizeClass =
    size === "display" ? "money--display" : size === "lg" ? "money--lg" : size === "sm" ? "" : "";
  const toneClass =
    tone === "short"
      ? "is-short"
      : tone === "surplus"
        ? "is-surplus"
        : tone === "auto"
          ? negative
            ? "is-short"
            : "is-surplus"
          : "";
  const prefix = signed && !negative && value !== "0.00" ? "+" : sign;

  return (
    <span
      className={`money ${sizeClass} ${toneClass} ${className}`.trim()}
      aria-label={`${signed && !negative ? "plus " : ""}${formatMoney(value)}`}
    >
      <span aria-hidden="true">
        {prefix}
        <span className="taka-sign">৳</span>
        {taka}
        <span className="paisa">.{paisa}</span>
      </span>
    </span>
  );
}
