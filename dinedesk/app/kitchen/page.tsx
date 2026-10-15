"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import { timeAgo } from "@/lib/format";
import { ORDER_FLOW, STATUS_LABEL } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";

interface OrderItem {
  name: string;
  qty: number;
}
interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  type: string;
  status: string;
  createdAt: string;
  table: { number: number } | null;
  items: OrderItem[];
}

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error("fetch failed");
  return r.json();
});

const NEXT: Record<string, string> = {
  RECEIVED: "PREPARING",
  PREPARING: "READY",
  READY: "SERVED",
};

const NEXT_LABEL: Record<string, string> = {
  PREPARING: "Start preparing",
  READY: "Mark ready",
  SERVED: "Mark served",
};

export default function KitchenPage() {
  // Live board: SWR refreshInterval polls the API every 5 seconds.
  // (Documented choice: polling over WebSockets — see README "Architecture".)
  const { data, error, mutate, isLoading } = useSWR<{ orders: Order[] }>(
    "/api/kitchen/orders",
    fetcher,
    { refreshInterval: 5000, revalidateOnFocus: true }
  );
  const [acting, setActing] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  const advance = useCallback(
    async (order: Order) => {
      const next = NEXT[order.status];
      if (!next) return;
      setActing(order.id);
      try {
        const res = await fetch(`/api/kitchen/orders/${order.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Update failed");
        }
        mutate();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Update failed");
      } finally {
        setActing(null);
      }
    },
    [mutate]
  );

  const cancel = useCallback(
    async (order: Order) => {
      if (!confirm(`Cancel order ${order.orderNo}?`)) return;
      setActing(order.id);
      try {
        await fetch(`/api/kitchen/orders/${order.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "CANCELLED" }),
        });
        mutate();
      } finally {
        setActing(null);
      }
    },
    [mutate]
  );

  const orders = data?.orders ?? [];
  const visible = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);
  const counts = ORDER_FLOW.map((s) => ({
    s,
    n: orders.filter((o) => o.status === s).length,
  }));

  // Keyboard shortcut: j/k navigation is overkill here; keep the board simple.

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ember">
            Kitchen display
          </p>
          <h1 className="mt-1 font-serif text-4xl font-black text-espresso">The pass.</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-espresso/60">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${error ? "bg-red-500" : "bg-leaf"}`} />
          {error ? "Connection lost — retrying" : "Live · refreshing every 5s"}
          <button
            onClick={() => mutate()}
            className="ml-2 rounded-full border border-espresso/20 px-3 py-1 text-xs font-semibold hover:border-ember hover:text-ember"
          >
            Refresh now
          </button>
        </div>
      </div>

      {/* Status filter chips with counts */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Chip active={filter === "ALL"} onClick={() => setFilter("ALL")} label={`All (${orders.length})`} />
        {counts.map(({ s, n }) => (
          <Chip
            key={s}
            active={filter === s}
            onClick={() => setFilter(s)}
            label={`${STATUS_LABEL[s]} (${n})`}
          />
        ))}
      </div>

      {isLoading && <p className="mt-8 text-espresso/60">Firing up the pass…</p>}

      {!isLoading && visible.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-espresso/25 p-12 text-center">
          <p className="font-serif text-2xl text-espresso/70">All clear, chef.</p>
          <p className="mt-2 text-sm text-espresso/50">New orders will appear here automatically.</p>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((o) => (
          <article
            key={o.id}
            className={`rounded-2xl border-2 bg-white/80 p-5 ${
              o.status === "RECEIVED" ? "border-ember/50" : "border-espresso/10"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-lg font-bold text-espresso">{o.orderNo}</p>
                <p className="text-sm text-espresso/60">
                  {o.customerName}
                  {o.table ? ` · Table ${o.table.number}` : ""} ·{" "}
                  {o.type.replace("_", "-").toLowerCase()}
                </p>
              </div>
              <StatusBadge status={o.status} />
            </div>
            <p className="mt-1 text-xs text-espresso/45">fired {timeAgo(o.createdAt)}</p>

            <ul className="mt-3 space-y-1 border-t border-espresso/10 pt-3">
              {o.items.map((it, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="font-medium text-espresso">{it.name}</span>
                  <span className="rounded-full bg-espresso/8 px-2 py-0.5 text-xs font-bold text-espresso">
                    ×{it.qty}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex gap-2">
              {NEXT[o.status] && (
                <button
                  onClick={() => advance(o)}
                  disabled={acting === o.id}
                  className="flex-1 rounded-full bg-ember py-2.5 text-sm font-bold text-white transition-colors hover:bg-tomato disabled:opacity-60"
                >
                  {acting === o.id ? "…" : NEXT_LABEL[NEXT[o.status]] + " →"}
                </button>
              )}
              {o.status !== "SERVED" && (
                <button
                  onClick={() => cancel(o)}
                  disabled={acting === o.id}
                  className="rounded-full border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  Cancel
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
        active ? "bg-espresso text-cream" : "bg-espresso/5 text-espresso/70 hover:bg-espresso/10"
      }`}
    >
      {label}
    </button>
  );
}
