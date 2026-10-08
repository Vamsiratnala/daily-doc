const STYLES: Record<string, string> = {
  BOOKED: "bg-sky-50 text-sky-700",
  CONFIRMED: "bg-brand-50 text-brand-700",
  COMPLETED: "bg-black/5 text-ink/60",
  CANCELLED: "bg-red-50 text-red-600",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STYLES[status] ?? ""}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
}
