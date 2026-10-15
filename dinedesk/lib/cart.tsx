"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface CartLine {
  id: string;
  name: string;
  pricePaise: number;
  veg: boolean;
  qty: number;
}

interface CartCtx {
  lines: CartLine[];
  add: (item: Omit<CartLine, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotalPaise: number;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "dinedesk-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines]);

  const value = useMemo<CartCtx>(() => {
    const add: CartCtx["add"] = (item, qty = 1) =>
      setLines((prev) => {
        const found = prev.find((l) => l.id === item.id);
        if (found)
          return prev.map((l) =>
            l.id === item.id ? { ...l, qty: Math.min(20, l.qty + qty) } : l
          );
        return [...prev, { ...item, qty: Math.min(20, qty) }];
      });
    const remove = (id: string) => setLines((prev) => prev.filter((l) => l.id !== id));
    const setQty = (id: string, qty: number) =>
      setLines((prev) =>
        qty <= 0
          ? prev.filter((l) => l.id !== id)
          : prev.map((l) => (l.id === id ? { ...l, qty: Math.min(20, qty) } : l))
      );
    const clear = () => setLines([]);
    return {
      lines,
      add,
      remove,
      setQty,
      clear,
      count: lines.reduce((a, l) => a + l.qty, 0),
      subtotalPaise: lines.reduce((a, l) => a + l.qty * l.pricePaise, 0),
    };
  }, [lines]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
