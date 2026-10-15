"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { inr } from "@/lib/format";
import { ORDER_FLOW, STATUS_LABEL, DEMO_PAYMENT_NOTE } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";
import { timeAgo } from "@/lib/format";

interface OrderItem {
  name: string;
  pricePaise: number;
  qty: number;
}
interface Order {
  orderNo: string;
  customerName: string;
  type: string;
  status: string;
  totalPaise: number;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  table: { number: number } | null;
  items: OrderItem[];
}

function TrackInner() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState(searchParams.get("order") ?? "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [mine, setMine] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async (orderNo: string) => {
    const id = orderNo.trim().toUpperCase();
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order not found");
      setOrder(data.order);
      window.history.replaceState(null, "", `/track?order=${encodeURIComponent(id)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-lookup from ?order= and live polling while the order is active.
  useEffect(() => {
    const preset = searchParams.get("order");
    if (preset) lookup(preset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!order || ["SERVED", "CANCELLED"].includes(order.status)) return;
    const t = setInterval(() => lookup(order.orderNo), 5000);
    return () => clearInterval(t);
  }, [order, lookup]);

  async function lookupMine() {
    if (!phone.trim()) return;
    setError("");
    try {
      const res = await fetch(`/api/my-orders?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed");
      setMine(data.orders);
      if (data.orders.length === 0) setError("No orders found for that phone number.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    }
  }

  const stepIdx = order ? ORDER_FLOW.indexOf(order.status as (typeof ORDER_FLOW)[number]) : -1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ember">Order tracking</p>
      <h1 className="mt-2 font-serif text-4xl font-black text-espresso">Where&apos;s my food?</h1>

      <div className="mt-6 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lookup(input)}
          placeholder="Order number, e.g. DD-AB12CD"
          className="flex-1 rounded-full border border-espresso/20 bg-white/60 px-5 py-2.5 font-mono text-sm uppercase outline-none placeholder:normal-case placeholder:text-espresso/40 focus:border-ember"
        />
        <button
          onClick={() => lookup(input)}
          disabled={loading}
          className="rounded-full bg-espresso px-6 py-2.5 text-sm font-semibold text-cream hover:bg-ember disabled:opacity-60"
        >
          {loading ? "…" : "Track"}
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lookupMine()}
          placeholder="Or find my orders by phone"
          className="flex-1 rounded-full border border-espresso/20 bg-white/60 px-5 py-2 text-sm outline-none placeholder:text-espresso/40 focus:border-ember"
        />
        <button
          onClick={lookupMine}
          className="rounded-full border border-espresso/20 px-5 py-2 text-sm font-semibold text-espresso/70 hover:border-ember hover:text-ember"
        >
          My orders
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {mine.length > 0 && !order && (
        <div className="mt-6 space-y-2">
          {mine.map((o) => (
            <button
              key={o.orderNo}
              onClick={() => {
                setInput(o.orderNo);
                lookup(o.orderNo);
                setMine([]);
              }}
              className="flex w-full items-center justify-between rounded-xl border border-espresso/12 bg-white/70 px-4 py-3 text-left hover:border-ember/50"
            >
              <span className="font-mono font-bold text-espresso">{o.orderNo}</span>
              <span className="text-sm text-espresso/60">{timeAgo(o.createdAt)}</span>
              <StatusBadge status={o.status} />
            </button>
          ))}
        </div>
      )}

      {order && (
        <div className="mt-8 rounded-2xl border border-espresso/12 bg-white/70 p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-2xl font-bold tracking-wider text-espresso">{order.orderNo}</p>
              <p className="mt-1 text-sm text-espresso/60">
                {order.customerName} · {order.type.replace("_", "-").toLowerCase()}
                {order.table ? ` · Table ${order.table.number}` : ""} · placed {timeAgo(order.createdAt)}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Progress timeline — refreshes every 5s while active */}
          {stepIdx >= 0 && (
            <div className="mt-8">
              <div className="flex items-center">
                {ORDER_FLOW.map((s, i) => (
                  <div key={s} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${
                          i <= stepIdx
                            ? "border-ember bg-ember text-white"
                            : "border-espresso/20 text-espresso/40"
                        }`}
                      >
                        {i < stepIdx ? "✓" : i + 1}
                      </div>
                      <span
                        className={`mt-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                          i <= stepIdx ? "text-ember" : "text-espresso/40"
                        }`}
                      >
                        {STATUS_LABEL[s]}
                      </span>
                    </div>
                    {i < ORDER_FLOW.length - 1 && (
                      <div className={`mx-1 mb-6 h-0.5 flex-1 ${i < stepIdx ? "bg-ember" : "bg-espresso/15"}`} />
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-espresso/50">
                Live — refreshing every 5 seconds{order.status === "READY" ? ". Your food is ready! 🍽" : "…"}
              </p>
            </div>
          )}
          {order.status === "CANCELLED" && (
            <p className="mt-6 rounded-xl bg-red-50 p-4 text-center text-sm text-red-800">
              This order was cancelled. Call us if you need help.
            </p>
          )}

          <div className="mt-8 border-t border-espresso/10 pt-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-espresso/50">Items</p>
            <ul className="mt-2 space-y-1.5">
              {order.items.map((it, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-espresso/80">
                    {it.qty} × {it.name}
                  </span>
                  <span className="font-medium text-espresso">{inr(it.qty * it.pricePaise)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-espresso/10 pt-3 font-serif text-lg font-bold">
              <span>Total paid (demo)</span>
              <span>{inr(order.totalPaise)}</span>
            </div>
            <p className="mt-2 text-xs text-espresso/50">{DEMO_PAYMENT_NOTE}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-3xl px-4 py-10">Loading…</p>}>
      <TrackInner />
    </Suspense>
  );
}
