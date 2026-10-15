"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { inrShort } from "@/lib/format";
import DishArt from "@/components/DishArt";

interface Item {
  id: string;
  name: string;
  description: string;
  pricePaise: number;
  veg: boolean;
  spicy: number;
  isSpecial: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  items: Item[];
}

type Diet = "all" | "veg" | "nonveg";

const SPICE = ["", "mild", "medium", "hot"];

export default function MenuPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [diet, setDiet] = useState<Diet>("all");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [detail, setDetail] = useState<Item | null>(null);
  const { add } = useCart();

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((d) => setCats(d.categories ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return cats
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (i) =>
            (diet === "all" || (diet === "veg" ? i.veg : !i.veg)) &&
            (!needle ||
              i.name.toLowerCase().includes(needle) ||
              i.description.toLowerCase().includes(needle))
        ),
      }))
      .filter(
        (c) =>
          c.items.length > 0 && (activeCat === "all" || c.slug === activeCat)
      );
  }, [cats, q, diet, activeCat]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ember">The menu</p>
      <h1 className="mt-2 font-serif text-4xl font-black text-espresso md:text-5xl">
        Eat with your eyes first.
      </h1>

      {/* Controls */}
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search butter chicken, biryani, kulfi…"
          className="w-full max-w-md rounded-full border border-espresso/20 bg-white/60 px-5 py-2.5 text-sm outline-none placeholder:text-espresso/40 focus:border-ember"
        />
        <div className="flex gap-2">
          {(
            [
              ["all", "All"],
              ["veg", "Veg"],
              ["nonveg", "Non-veg"],
            ] as [Diet, string][]
          ).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setDiet(v)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                diet === v
                  ? "bg-espresso text-cream"
                  : "border border-espresso/20 text-espresso/70 hover:border-ember hover:text-ember"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Category rail */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveCat("all")}
          className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ${
            activeCat === "all"
              ? "bg-ember text-white"
              : "bg-espresso/5 text-espresso/70 hover:bg-espresso/10"
          }`}
        >
          Everything
        </button>
        {cats.map((c) => (
          <button
            key={c.slug}
            onClick={() => setActiveCat(c.slug)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ${
              activeCat === c.slug
                ? "bg-ember text-white"
                : "bg-espresso/5 text-espresso/70 hover:bg-espresso/10"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading && <p className="mt-10 text-espresso/60">Setting the tables…</p>}

      {!loading && filtered.length === 0 && (
        <p className="mt-10 rounded-xl border border-dashed border-espresso/25 p-8 text-center text-espresso/60">
          Nothing on the pass matches that. Try another craving.
        </p>
      )}

      {filtered.map((c) => (
        <section key={c.slug} className="mt-10">
          <div className="flex items-baseline gap-3">
            <h2 className="font-serif text-3xl font-bold text-espresso">{c.name}</h2>
            <span className="text-sm text-espresso/50">{c.items.length} dishes</span>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {c.items.map((item) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-espresso/12 bg-white/70 transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <button onClick={() => setDetail(item)} className="block w-full text-left">
                  <DishArt name={item.name} veg={item.veg} className="h-40 w-full object-cover" />
                </button>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-lg font-bold leading-snug text-espresso">
                      <button onClick={() => setDetail(item)} className="hover:text-ember">
                        {item.name}
                      </button>
                    </h3>
                    {item.isSpecial && (
                      <span className="shrink-0 rounded-full bg-ember/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ember">
                        House special
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm text-espresso/60">{item.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-espresso/50">
                    {item.spicy > 0 && <span>🌶 {SPICE[item.spicy]}</span>}
                    <span>{item.veg ? "Vegetarian" : "Non-vegetarian"}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-serif text-xl font-bold text-espresso">
                      {inrShort(item.pricePaise)}
                    </span>
                    <button
                      onClick={() =>
                        add({ id: item.id, name: item.name, pricePaise: item.pricePaise, veg: item.veg })
                      }
                      className="rounded-full bg-espresso px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-ember"
                    >
                      Add +
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {/* Item detail modal */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-espresso/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setDetail(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-cream shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <DishArt name={detail.name} veg={detail.veg} className="h-52 w-full" />
            <div className="p-6">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-2xl font-bold text-espresso">{detail.name}</h3>
                <button
                  onClick={() => setDetail(null)}
                  className="rounded-full border border-espresso/20 px-3 py-1 text-sm text-espresso/60 hover:border-ember hover:text-ember"
                >
                  ✕
                </button>
              </div>
              <p className="mt-3 leading-relaxed text-espresso/70">{detail.description}</p>
              <div className="mt-4 flex items-center gap-3 text-sm text-espresso/60">
                <span>{detail.veg ? "Vegetarian" : "Non-vegetarian"}</span>
                {detail.spicy > 0 && <span>· 🌶 {SPICE[detail.spicy]}</span>}
                {detail.isSpecial && <span>· House special</span>}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-espresso/10 pt-4">
                <span className="font-serif text-2xl font-bold text-espresso">
                  {inrShort(detail.pricePaise)}
                </span>
                <button
                  onClick={() => {
                    add({
                      id: detail.id,
                      name: detail.name,
                      pricePaise: detail.pricePaise,
                      veg: detail.veg,
                    });
                    setDetail(null);
                  }}
                  className="rounded-full bg-ember px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-tomato"
                >
                  Add to cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
