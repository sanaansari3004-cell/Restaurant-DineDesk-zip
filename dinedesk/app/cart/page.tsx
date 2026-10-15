"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { inr, inrShort } from "@/lib/format";
import { DEMO_PAYMENT_NOTE } from "@/lib/constants";
import DishArt from "@/components/DishArt";

type Step = "cart" | "details" | "payment" | "done";

interface TableOpt {
  id: string;
  number: number;
  seats: number;
  zone: string;
}

export default function CartPage() {
  const { lines, setQty, remove, clear, subtotalPaise } = useCart();
  const [step, setStep] = useState<Step>("cart");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<"DINE_IN" | "TAKEAWAY" | "DELIVERY">("DINE_IN");
  const [tableId, setTableId] = useState("");
  const [tables, setTables] = useState<TableOpt[]>([]);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [paidTotal, setPaidTotal] = useState(0);

  useEffect(() => {
    fetch("/api/tables")
      .then((r) => (r.ok ? r.json() : { tables: [] }))
      .then((d) => setTables(d.tables ?? []))
      .catch(() => {});
  }, []);

  const tax = Math.round(subtotalPaise * 0.05);
  const total = subtotalPaise + tax;

  async function placeOrder() {
    setError("");
    setPaying(true);
    // Simulated gateway latency — the "payment" always succeeds in demo mode.
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          phone: phone || undefined,
          type,
          tableId: type === "DINE_IN" && tableId ? tableId : undefined,
          items: lines.map((l) => ({ id: l.id, qty: l.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      setOrderNo(data.orderNo);
      setPaidTotal(data.totalPaise);
      clear();
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setPaying(false);
    }
  }

  if (step === "done") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="font-serif text-6xl">🎉</p>
        <h1 className="mt-4 font-serif text-4xl font-black text-espresso">Order fired!</h1>
        <p className="mt-3 text-espresso/70">
          The kitchen has your ticket. Track it live with this number:
        </p>
        <p className="mx-auto mt-5 inline-block rounded-xl border-2 border-dashed border-ember/50 bg-parchment px-8 py-4 font-mono text-3xl font-bold tracking-widest text-ember">
          {orderNo}
        </p>
        <p className="mt-4 text-sm text-espresso/60">
          Paid (demo): <strong>{inr(paidTotal)}</strong> · {DEMO_PAYMENT_NOTE}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href={`/track?order=${orderNo}`}
            className="rounded-full bg-espresso px-6 py-3 text-sm font-semibold text-cream hover:bg-ember"
          >
            Track my order
          </Link>
          <Link
            href="/menu"
            className="rounded-full border border-espresso/20 px-6 py-3 text-sm font-semibold text-espresso hover:border-ember hover:text-ember"
          >
            Back to menu
          </Link>
        </div>
      </div>
    );
  }

  if (lines.length === 0 && step === "cart") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-serif text-4xl font-black text-espresso">Your thali is empty.</h1>
        <p className="mt-3 text-espresso/60">The tandoor is hot and waiting.</p>
        <Link
          href="/menu"
          className="mt-8 inline-block rounded-full bg-espresso px-7 py-3 text-sm font-semibold text-cream hover:bg-ember"
        >
          Browse the menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ember">Checkout</p>
      <h1 className="mt-2 font-serif text-4xl font-black text-espresso">
        {step === "cart" && "Your order"}
        {step === "details" && "Who's eating?"}
        {step === "payment" && "Payment"}
      </h1>

      {error && (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {step === "cart" && (
        <>
          <div className="mt-6 space-y-3">
            {lines.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-4 rounded-2xl border border-espresso/12 bg-white/70 p-3"
              >
                <DishArt name={l.name} veg={l.veg} className="h-16 w-20 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif font-bold text-espresso">{l.name}</p>
                  <p className="text-sm text-espresso/60">{inrShort(l.pricePaise)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty(l.id, l.qty - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-espresso/20 text-lg hover:border-ember hover:text-ember"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-semibold">{l.qty}</span>
                  <button
                    onClick={() => setQty(l.id, l.qty + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-espresso/20 text-lg hover:border-ember hover:text-ember"
                  >
                    +
                  </button>
                </div>
                <p className="w-20 text-right font-serif font-bold">{inrShort(l.qty * l.pricePaise)}</p>
                <button
                  onClick={() => remove(l.id)}
                  className="text-sm text-espresso/40 hover:text-red-700"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-parchment p-6">
            <div className="flex justify-between text-sm text-espresso/70">
              <span>Subtotal</span>
              <span>{inr(subtotalPaise)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm text-espresso/70">
              <span>GST (5%)</span>
              <span>{inr(tax)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-espresso/15 pt-2 font-serif text-xl font-bold">
              <span>Total</span>
              <span>{inr(total)}</span>
            </div>
            <button
              onClick={() => setStep("details")}
              className="mt-5 w-full rounded-full bg-ember py-3 text-sm font-bold text-white transition-colors hover:bg-tomato"
            >
              Continue →
            </button>
          </div>
        </>
      )}

      {step === "details" && (
        <div className="mt-6 max-w-xl rounded-2xl border border-espresso/12 bg-white/70 p-6">
          <div className="grid gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-espresso">Your name *</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Mehta"
                className="mt-1 w-full rounded-xl border border-espresso/20 px-4 py-2.5 text-sm outline-none focus:border-ember"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-espresso">Phone (for order updates &amp; &ldquo;my orders&rdquo;)</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98110 22334"
                className="mt-1 w-full rounded-xl border border-espresso/20 px-4 py-2.5 text-sm outline-none focus:border-ember"
              />
            </label>
            <div>
              <span className="text-sm font-semibold text-espresso">Order type</span>
              <div className="mt-2 flex gap-2">
                {(
                  [
                    ["DINE_IN", "Dine-in"],
                    ["TAKEAWAY", "Takeaway"],
                    ["DELIVERY", "Delivery"],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setType(v)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      type === v ? "bg-espresso text-cream" : "border border-espresso/20 text-espresso/70"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {type === "DINE_IN" && tables.length > 0 && (
              <label className="block">
                <span className="text-sm font-semibold text-espresso">Table (optional)</span>
                <select
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-espresso/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-ember"
                >
                  <option value="">No table — I&apos;ll take a token</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Table {t.number} · {t.seats} seats · {t.zone}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setStep("cart")}
              className="rounded-full border border-espresso/20 px-6 py-2.5 text-sm font-semibold text-espresso hover:border-ember hover:text-ember"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                if (!name.trim()) {
                  setError("Please tell us your name so the kitchen can call it out.");
                  return;
                }
                setError("");
                setStep("payment");
              }}
              className="flex-1 rounded-full bg-espresso py-2.5 text-sm font-semibold text-cream hover:bg-ember"
            >
              Continue to payment →
            </button>
          </div>
        </div>
      )}

      {step === "payment" && (
        <div className="mt-6 max-w-xl">
          {/* DEMO banner — never imply real payment */}
          <div className="rounded-2xl border-2 border-dashed border-ember/60 bg-ember/5 p-5">
            <p className="font-serif text-lg font-bold text-ember">{DEMO_PAYMENT_NOTE}</p>
            <p className="mt-1 text-sm text-espresso/70">
              This is a simulated checkout for demonstration. No card is charged, no gateway is
              contacted — pressing &ldquo;Pay&rdquo; just marks the order as paid in the demo
              database.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-espresso/12 bg-white/70 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-espresso">Amount due</p>
              <p className="font-serif text-2xl font-bold text-espresso">{inr(total)}</p>
            </div>
            <div className="mt-4 grid gap-3 opacity-70">
              <input
                disabled
                placeholder="Card number — disabled in demo"
                className="w-full rounded-xl border border-espresso/20 bg-espresso/5 px-4 py-2.5 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  disabled
                  placeholder="MM / YY"
                  className="rounded-xl border border-espresso/20 bg-espresso/5 px-4 py-2.5 text-sm"
                />
                <input
                  disabled
                  placeholder="CVV"
                  className="rounded-xl border border-espresso/20 bg-espresso/5 px-4 py-2.5 text-sm"
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-espresso/50">
              Card fields are disabled because no real payment is processed in this demo.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setStep("details")}
                disabled={paying}
                className="rounded-full border border-espresso/20 px-6 py-3 text-sm font-semibold text-espresso disabled:opacity-50"
              >
                ← Back
              </button>
              <button
                onClick={placeOrder}
                disabled={paying}
                className="flex-1 rounded-full bg-ember py-3 text-sm font-bold text-white transition-colors hover:bg-tomato disabled:opacity-60"
              >
                {paying ? "Processing demo payment…" : `Pay ${inr(total)} (demo)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
