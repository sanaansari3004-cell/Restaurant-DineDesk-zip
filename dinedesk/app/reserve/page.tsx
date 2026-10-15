"use client";

import { useEffect, useState } from "react";

interface TableOpt {
  id: string;
  number: number;
  seats: number;
  zone: string;
}
interface Slot {
  slot: string;
  tables: TableOpt[];
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ReservePage() {
  const [date, setDate] = useState(todayStr());
  const [partySize, setPartySize] = useState(2);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [chosen, setChosen] = useState<{ slot: string; table: TableOpt } | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState<{
    slot: string;
    tableNo: number;
    date: string;
    partySize: number;
  } | null>(null);

  async function load() {
    setLoading(true);
    setChosen(null);
    setError("");
    try {
      const res = await fetch(
        `/api/reserve/slots?date=${date}&partySize=${partySize}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load slots");
      setSlots(data.slots);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load slots");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, partySize]);

  async function confirm() {
    if (!chosen) return;
    if (!name.trim() || !phone.trim()) {
      setError("Name and phone are required to hold the table.");
      return;
    }
    setBooking(true);
    setError("");
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          date,
          slot: chosen.slot,
          partySize,
          tableId: chosen.table.id,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reservation failed");
      setConfirmed({
        slot: data.reservation.slot,
        tableNo: data.reservation.table.number,
        date,
        partySize,
      });
      load(); // refresh availability
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reservation failed");
    } finally {
      setBooking(false);
    }
  }

  if (confirmed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="font-serif text-6xl">🕯</p>
        <h1 className="mt-4 font-serif text-4xl font-black text-espresso">Table reserved.</h1>
        <div className="mx-auto mt-6 max-w-md rounded-2xl border border-espresso/15 bg-parchment p-6 text-left">
          <Row k="Date" v={new Date(confirmed.date + "T00:00:00").toDateString()} />
          <Row k="Time" v={confirmed.slot} />
          <Row k="Table" v={`No. ${confirmed.tableNo}`} />
          <Row k="Party" v={`${confirmed.partySize} guests`} />
          <Row k="Name" v={name} />
        </div>
        <p className="mt-4 text-sm text-espresso/60">
          We hold tables for 15 minutes past the slot. Running late? Call the bistro.
        </p>
        <button
          onClick={() => {
            setConfirmed(null);
            setChosen(null);
          }}
          className="mt-6 rounded-full border border-espresso/20 px-6 py-2.5 text-sm font-semibold text-espresso hover:border-ember hover:text-ember"
        >
          Make another reservation
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ember">Reservations</p>
      <h1 className="mt-2 font-serif text-4xl font-black text-espresso md:text-5xl">
        Book your corner.
      </h1>

      <div className="mt-8 grid gap-4 rounded-2xl border border-espresso/12 bg-white/70 p-6 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-espresso">Date</span>
          <input
            type="date"
            value={date}
            min={todayStr()}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-espresso/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-ember"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-espresso">Party size</span>
          <div className="mt-1 flex items-center gap-3">
            <button
              onClick={() => setPartySize(Math.max(1, partySize - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-espresso/20 text-xl hover:border-ember hover:text-ember"
            >
              −
            </button>
            <span className="w-16 text-center font-serif text-2xl font-bold">{partySize}</span>
            <button
              onClick={() => setPartySize(Math.min(20, partySize + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-espresso/20 text-xl hover:border-ember hover:text-ember"
            >
              +
            </button>
            <span className="text-sm text-espresso/50">guests</span>
          </div>
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <h2 className="mt-10 font-serif text-2xl font-bold text-espresso">Available slots</h2>
      {loading && <p className="mt-4 text-espresso/60">Checking the floor plan…</p>}

      <div className="mt-4 space-y-4">
        {slots.map((s) => (
          <div key={s.slot} className="rounded-2xl border border-espresso/12 bg-white/60 p-5">
            <div className="flex items-center justify-between">
              <p className="font-serif text-xl font-bold text-espresso">{s.slot}</p>
              <p className="text-sm text-espresso/50">
                {s.tables.length === 0 ? "Fully booked" : `${s.tables.length} table${s.tables.length > 1 ? "s" : ""} free`}
              </p>
            </div>
            {s.tables.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {s.tables.map((t) => {
                  const active = chosen?.slot === s.slot && chosen.table.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setChosen({ slot: s.slot, table: t })}
                      className={`rounded-xl border px-4 py-2 text-sm transition-colors ${
                        active
                          ? "border-ember bg-ember text-white"
                          : "border-espresso/20 hover:border-ember hover:text-ember"
                      }`}
                    >
                      <span className="font-bold">Table {t.number}</span>
                      <span className={active ? "text-white/80" : "text-espresso/50"}>
                        {" "}
                        · {t.seats} seats · {t.zone}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {chosen && (
        <div className="mt-8 rounded-2xl bg-espresso p-6 text-cream md:p-8">
          <h2 className="font-serif text-2xl font-bold">
            Table {chosen.table.number} at {chosen.slot}
          </h2>
          <p className="mt-1 text-sm text-cream/70">
            {date} · {partySize} guests · {chosen.table.zone}
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name *"
              className="rounded-xl border border-cream/25 bg-cream/10 px-4 py-2.5 text-sm text-cream placeholder:text-cream/50 outline-none focus:border-ember"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone *"
              className="rounded-xl border border-cream/25 bg-cream/10 px-4 py-2.5 text-sm text-cream placeholder:text-cream/50 outline-none focus:border-ember"
            />
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Occasion, seating preference, allergies… (optional)"
            rows={2}
            className="mt-4 w-full rounded-xl border border-cream/25 bg-cream/10 px-4 py-2.5 text-sm text-cream placeholder:text-cream/50 outline-none focus:border-ember"
          />
          <button
            onClick={confirm}
            disabled={booking}
            className="mt-5 w-full rounded-full bg-ember py-3 text-sm font-bold text-white transition-colors hover:bg-tomato disabled:opacity-60 sm:w-auto sm:px-10"
          >
            {booking ? "Reserving…" : "Confirm reservation"}
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-espresso/10 py-2 text-sm last:border-0">
      <span className="text-espresso/55">{k}</span>
      <span className="font-semibold text-espresso">{v}</span>
    </div>
  );
}
