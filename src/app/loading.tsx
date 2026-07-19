import { PageLoader } from "@/components/ui/loader";

export default function Loading() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        backgroundColor: "var(--bg)",
      }}
    >
      <PageLoader
        message="Verifying Ledger State…"
        subtext="Loading verified double-entry balances and active vouchers"
      />
    </div>
  );
}
