import { STATUS_LABEL } from "@/lib/constants";

const STYLES: Record<string, string> = {
  RECEIVED: "bg-amber-100 text-amber-900 border-amber-300",
  PREPARING: "bg-orange-100 text-orange-900 border-orange-300",
  READY: "bg-emerald-100 text-emerald-900 border-emerald-300",
  SERVED: "bg-stone-200 text-stone-700 border-stone-300",
  CANCELLED: "bg-red-100 text-red-900 border-red-300",
  CONFIRMED: "bg-emerald-100 text-emerald-900 border-emerald-300",
  SEATED: "bg-sky-100 text-sky-900 border-sky-300",
  COMPLETED: "bg-stone-200 text-stone-700 border-stone-300",
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = STYLES[status] ?? "bg-stone-100 text-stone-700 border-stone-300";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${cls}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
