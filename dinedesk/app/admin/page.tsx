"use client";

import { useCallback, useEffect, useState } from "react";
import { inr } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

type Tab = "items" | "categories" | "tables" | "reservations" | "orders";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { items: number };
}
interface Item {
  id: string;
  name: string;
  description: string;
  pricePaise: number;
  veg: boolean;
  spicy: number;
  available: boolean;
  isSpecial: boolean;
  categoryId: string;
  category: { name: string };
}
interface Table {
  id: string;
  number: number;
  seats: number;
  zone: string;
  active: boolean;
}
interface Reservation {
  id: string;
  name: string;
  phone: string;
  date: string;
  slot: string;
  partySize: number;
  status: string;
  table: { number: number };
}
interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  type: string;
  status: string;
  totalPaise: number;
  createdAt: string;
  table: { number: number } | null;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "items", label: "Menu items" },
  { id: "categories", label: "Categories" },
  { id: "tables", label: "Tables" },
  { id: "reservations", label: "Reservations" },
  { id: "orders", label: "Orders" },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("items");
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ember">Admin</p>
      <h1 className="mt-1 font-serif text-4xl font-black text-espresso">Front of house, managed.</h1>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-espresso/15 pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id ? "bg-espresso text-cream" : "text-espresso/60 hover:bg-espresso/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "items" && <ItemsTab />}
        {tab === "categories" && <CategoriesTab />}
        {tab === "tables" && <TablesTab />}
        {tab === "reservations" && <ReservationsTab />}
        {tab === "orders" && <OrdersTab />}
      </div>
    </div>
  );
}

/* ---------------- Menu items ---------------- */

function ItemsTab() {
  const [items, setItems] = useState<Item[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Item | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [ir, cr] = await Promise.all([fetch("/api/admin/items"), fetch("/api/admin/categories")]);
    const [idata, cdata] = await Promise.all([ir.json(), cr.json()]);
    setItems(idata.items ?? []);
    setCats(cdata.categories ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleAvailable(item: Item) {
    const res = await fetch(`/api/admin/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !item.available }),
    });
    if (res.ok) load();
  }

  async function remove(item: Item) {
    if (!confirm(`Delete "${item.name}"?`)) return;
    const res = await fetch(`/api/admin/items/${item.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) alert(data.error || "Delete failed");
    else load();
  }

  if (loading) return <p className="text-espresso/60">Loading menu…</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-espresso/60">{items.length} items</p>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-full bg-ember px-5 py-2 text-sm font-bold text-white hover:bg-tomato"
        >
          + Add item
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-espresso/12">
        <table className="w-full min-w-[720px] bg-white/70 text-sm">
          <thead>
            <tr className="border-b border-espresso/12 text-left text-xs uppercase tracking-wide text-espresso/50">
              <th className="px-4 py-3">Dish</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Diet</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-espresso/8 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-semibold text-espresso">
                    {it.name}
                    {it.isSpecial && <span className="ml-2 text-xs font-bold text-ember">★ special</span>}
                  </p>
                </td>
                <td className="px-4 py-3 text-espresso/60">{it.category.name}</td>
                <td className="px-4 py-3 font-medium">{inr(it.pricePaise)}</td>
                <td className="px-4 py-3 text-espresso/60">{it.veg ? "Veg" : "Non-veg"}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleAvailable(it)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${it.available ? "bg-leaf" : "bg-espresso/20"}`}
                    aria-label="Toggle availability"
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${it.available ? "left-[22px]" : "left-0.5"}`}
                    />
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(it)} className="mr-3 font-semibold text-ember hover:underline">
                    Edit
                  </button>
                  <button onClick={() => remove(it)} className="font-semibold text-red-700 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(showAdd || editing) && (
        <ItemForm
          categories={cats}
          initial={editing}
          onClose={() => {
            setShowAdd(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowAdd(false);
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ItemForm({
  categories,
  initial,
  onClose,
  onSaved,
}: {
  categories: Category[];
  initial: Item | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priceRs, setPriceRs] = useState(initial ? String(initial.pricePaise / 100) : "");
  const [veg, setVeg] = useState(initial?.veg ?? true);
  const [spicy, setSpicy] = useState(initial?.spicy ?? 0);
  const [available, setAvailable] = useState(initial?.available ?? true);
  const [isSpecial, setIsSpecial] = useState(initial?.isSpecial ?? false);
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setError("");
    const pricePaise = Math.round(Number(priceRs) * 100);
    if (!name.trim() || !description.trim() || !categoryId) {
      setError("Name, description and category are required.");
      return;
    }
    if (!Number.isFinite(pricePaise) || pricePaise < 0) {
      setError("Enter a valid price in ₹.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(initial ? `/api/admin/items/${initial.id}` : "/api/admin/items", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          pricePaise,
          veg,
          spicy,
          available,
          isSpecial,
          categoryId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={initial ? "Edit dish" : "Add dish"} onClose={onClose}>
      {error && <p className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-800">{error}</p>}
      <div className="grid gap-4">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="Paneer Tikka Angara" />
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inp} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (₹)">
            <input value={priceRs} onChange={(e) => setPriceRs(e.target.value)} inputMode="decimal" className={inp} placeholder="249" />
          </Field>
          <Field label="Category">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inp}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Diet">
            <select value={veg ? "veg" : "nonveg"} onChange={(e) => setVeg(e.target.value === "veg")} className={inp}>
              <option value="veg">Vegetarian</option>
              <option value="nonveg">Non-vegetarian</option>
            </select>
          </Field>
          <Field label="Spice level">
            <select value={spicy} onChange={(e) => setSpicy(Number(e.target.value))} className={inp}>
              <option value={0}>None</option>
              <option value={1}>Mild</option>
              <option value={2}>Medium</option>
              <option value={3}>Hot</option>
            </select>
          </Field>
        </div>
        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="h-4 w-4 accent-[#C2410C]" />
            Available on menu
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isSpecial} onChange={(e) => setIsSpecial(e.target.checked)} className="h-4 w-4 accent-[#C2410C]" />
            House special
          </label>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-ember py-3 text-sm font-bold text-white hover:bg-tomato disabled:opacity-60"
        >
          {saving ? "Saving…" : initial ? "Save changes" : "Add dish"}
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- Categories ---------------- */

function CategoriesTab() {
  const [cats, setCats] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [rename, setRename] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCats(data.categories ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!name.trim()) return;
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setName("");
      load();
    } else {
      const d = await res.json();
      alert(d.error || "Failed");
    }
  }

  async function saveRename() {
    if (!rename || !rename.name.trim()) return;
    const res = await fetch(`/api/admin/categories/${rename.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: rename.name }),
    });
    if (res.ok) {
      setRename(null);
      load();
    } else {
      const d = await res.json();
      alert(d.error || "Failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const d = await res.json();
    if (!res.ok) alert(d.error || "Delete failed");
    else load();
  }

  return (
    <div className="max-w-2xl">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New category, e.g. Combos"
          className={inp + " flex-1"}
        />
        <button onClick={add} className="rounded-full bg-ember px-5 py-2.5 text-sm font-bold text-white hover:bg-tomato">
          Add
        </button>
      </div>
      <ul className="mt-5 space-y-2">
        {cats.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-xl border border-espresso/12 bg-white/70 px-4 py-3"
          >
            {rename?.id === c.id ? (
              <div className="flex flex-1 gap-2">
                <input
                  value={rename.name}
                  onChange={(e) => setRename({ id: c.id, name: e.target.value })}
                  className={inp + " flex-1"}
                />
                <button onClick={saveRename} className="rounded-full bg-espresso px-4 py-1.5 text-sm font-semibold text-cream">
                  Save
                </button>
                <button onClick={() => setRename(null)} className="text-sm text-espresso/60">
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <span className="font-semibold text-espresso">
                  {c.name}
                  <span className="ml-2 text-xs font-normal text-espresso/50">
                    {c._count?.items ?? 0} items
                  </span>
                </span>
                <span>
                  <button onClick={() => setRename({ id: c.id, name: c.name })} className="mr-3 text-sm font-semibold text-ember hover:underline">
                    Rename
                  </button>
                  <button onClick={() => remove(c.id)} className="text-sm font-semibold text-red-700 hover:underline">
                    Delete
                  </button>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Tables ---------------- */

function TablesTab() {
  const [tables, setTables] = useState<Table[]>([]);
  const [form, setForm] = useState({ number: "", seats: "4", zone: "Main Hall" });
  const [editing, setEditing] = useState<Table | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/tables");
    const data = await res.json();
    setTables(data.tables ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    const res = await fetch("/api/admin/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: form.number, seats: form.seats, zone: form.zone }),
    });
    const d = await res.json();
    if (!res.ok) alert(d.error || "Failed");
    else {
      setForm({ number: "", seats: "4", zone: "Main Hall" });
      load();
    }
  }

  async function toggle(t: Table) {
    await fetch(`/api/admin/tables/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !t.active }),
    });
    load();
  }

  async function saveEdit() {
    if (!editing) return;
    const res = await fetch(`/api/admin/tables/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: editing.number, seats: editing.seats, zone: editing.zone }),
    });
    const d = await res.json();
    if (!res.ok) alert(d.error || "Failed");
    else {
      setEditing(null);
      load();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this table?")) return;
    const res = await fetch(`/api/admin/tables/${id}`, { method: "DELETE" });
    const d = await res.json();
    if (!res.ok) alert(d.error || "Delete failed");
    else load();
  }

  return (
    <div className="max-w-3xl">
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-espresso/12 bg-white/70 p-4 sm:grid-cols-4">
        <Field label="Table no.">
          <input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} inputMode="numeric" className={inp} placeholder="11" />
        </Field>
        <Field label="Seats">
          <input value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} inputMode="numeric" className={inp} />
        </Field>
        <Field label="Zone">
          <input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} className={inp} />
        </Field>
        <div className="flex items-end">
          <button onClick={add} className="w-full rounded-full bg-ember py-2.5 text-sm font-bold text-white hover:bg-tomato">
            + Add table
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((t) => (
          <div
            key={t.id}
            className={`rounded-2xl border p-4 ${t.active ? "border-espresso/12 bg-white/70" : "border-espresso/8 bg-espresso/5 opacity-70"}`}
          >
            {editing?.id === t.id ? (
              <div className="grid gap-2">
                <input
                  value={editing.number}
                  onChange={(e) => setEditing({ ...editing, number: Number(e.target.value) || 0 })}
                  className={inp}
                  inputMode="numeric"
                />
                <input
                  value={editing.seats}
                  onChange={(e) => setEditing({ ...editing, seats: Number(e.target.value) || 0 })}
                  className={inp}
                  inputMode="numeric"
                />
                <input value={editing.zone} onChange={(e) => setEditing({ ...editing, zone: e.target.value })} className={inp} />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="flex-1 rounded-full bg-espresso py-1.5 text-sm font-semibold text-cream">
                    Save
                  </button>
                  <button onClick={() => setEditing(null)} className="text-sm text-espresso/60">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="font-serif text-xl font-bold text-espresso">Table {t.number}</p>
                  <button
                    onClick={() => toggle(t)}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${t.active ? "bg-leaf/15 text-leaf" : "bg-espresso/10 text-espresso/60"}`}
                  >
                    {t.active ? "Active" : "Inactive"}
                  </button>
                </div>
                <p className="mt-1 text-sm text-espresso/60">
                  {t.seats} seats · {t.zone}
                </p>
                <div className="mt-3 flex gap-3">
                  <button onClick={() => setEditing(t)} className="text-sm font-semibold text-ember hover:underline">
                    Edit
                  </button>
                  <button onClick={() => remove(t.id)} className="text-sm font-semibold text-red-700 hover:underline">
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Reservations ---------------- */

function ReservationsTab() {
  const [rows, setRows] = useState<Reservation[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/reservations");
    const data = await res.json();
    setRows(data.reservations ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-espresso/12">
      <table className="w-full min-w-[760px] bg-white/70 text-sm">
        <thead>
          <tr className="border-b border-espresso/12 text-left text-xs uppercase tracking-wide text-espresso/50">
            <th className="px-4 py-3">Guest</th>
            <th className="px-4 py-3">When</th>
            <th className="px-4 py-3">Table</th>
            <th className="px-4 py-3">Party</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-espresso/8 last:border-0">
              <td className="px-4 py-3">
                <p className="font-semibold text-espresso">{r.name}</p>
                <p className="text-xs text-espresso/50">{r.phone}</p>
              </td>
              <td className="px-4 py-3 text-espresso/70">
                {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {r.slot}
              </td>
              <td className="px-4 py-3">No. {r.table.number}</td>
              <td className="px-4 py-3">{r.partySize}</td>
              <td className="px-4 py-3">
                <StatusBadge status={r.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <select
                  value={r.status}
                  onChange={(e) => setStatus(r.id, e.target.value)}
                  className="rounded-full border border-espresso/20 bg-white px-3 py-1 text-xs font-semibold"
                >
                  {["CONFIRMED", "SEATED", "COMPLETED", "CANCELLED"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-espresso/50">
                No reservations yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Orders ---------------- */

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders ?? []);
        setRevenue(d.revenuePaise ?? 0);
      });
  }, []);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Orders (recent 100)" value={String(orders.length)} />
        <Stat label="Revenue" value={inr(revenue)} />
        <Stat
          label="Active right now"
          value={String(orders.filter((o) => ["RECEIVED", "PREPARING", "READY"].includes(o.status)).length)}
        />
      </div>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-espresso/12">
        <table className="w-full min-w-[720px] bg-white/70 text-sm">
          <thead>
            <tr className="border-b border-espresso/12 text-left text-xs uppercase tracking-wide text-espresso/50">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-espresso/8 last:border-0">
                <td className="px-4 py-3 font-mono font-bold">{o.orderNo}</td>
                <td className="px-4 py-3 text-espresso/70">
                  {o.customerName}
                  {o.table ? ` · T${o.table.number}` : ""}
                </td>
                <td className="px-4 py-3 text-espresso/60">{o.type.replace("_", "-").toLowerCase()}</td>
                <td className="px-4 py-3 font-medium">{inr(o.totalPaise)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3 text-espresso/50">
                  {new Date(o.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-espresso/50">
        All payments in this demo are simulated — see the receipt note on every order.
      </p>
    </div>
  );
}

/* ---------------- shared bits ---------------- */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-espresso/12 bg-white/70 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-espresso/50">{label}</p>
      <p className="mt-1 font-serif text-3xl font-bold text-espresso">{value}</p>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-espresso/60 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-cream p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-2xl font-bold text-espresso">{title}</h3>
          <button onClick={onClose} className="rounded-full border border-espresso/20 px-3 py-1 text-sm text-espresso/60 hover:border-ember hover:text-ember">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-espresso">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inp =
  "w-full rounded-xl border border-espresso/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-ember";
