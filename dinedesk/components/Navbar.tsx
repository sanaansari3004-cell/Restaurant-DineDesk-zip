"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";

interface Me {
  name: string;
  role: "ADMIN" | "KITCHEN";
}

const LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/reserve", label: "Reserve" },
  { href: "/track", label: "Track Order" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useCart();
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user ?? null))
      .catch(() => setMe(null));
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-espresso/10 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-2xl font-bold text-espresso">DineDesk</span>
          <span className="hidden text-xs uppercase tracking-[0.2em] text-ember sm:inline">
            bistro &amp; kitchen
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors hover:text-ember ${
                pathname === l.href ? "text-ember" : "text-espresso/80"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {(me?.role === "KITCHEN" || me?.role === "ADMIN") && (
            <Link href="/kitchen" className="text-sm font-medium text-espresso/80 hover:text-ember">
              Kitchen
            </Link>
          )}
          {me?.role === "ADMIN" && (
            <Link href="/admin" className="text-sm font-medium text-espresso/80 hover:text-ember">
              Admin
            </Link>
          )}
          {me ? (
            <button
              onClick={logout}
              className="rounded-full border border-espresso/20 px-3 py-1 text-xs font-semibold text-espresso/70 hover:border-ember hover:text-ember"
            >
              Sign out ({me.name.split(" ")[0]})
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-espresso/20 px-3 py-1 text-xs font-semibold text-espresso/70 hover:border-ember hover:text-ember"
            >
              Staff login
            </Link>
          )}
          <Link
            href="/cart"
            className="relative rounded-full bg-espresso px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-ember"
          >
            Cart
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/cart"
            className="relative rounded-full bg-espresso px-3 py-1.5 text-sm font-semibold text-cream"
          >
            Cart{count > 0 ? ` (${count})` : ""}
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="rounded-md border border-espresso/20 px-2.5 py-1.5 text-espresso"
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-espresso/10 bg-cream px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium text-espresso/80 hover:bg-espresso/5"
              >
                {l.label}
              </Link>
            ))}
            {(me?.role === "KITCHEN" || me?.role === "ADMIN") && (
              <Link href="/kitchen" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-sm font-medium text-espresso/80">
                Kitchen
              </Link>
            )}
            {me?.role === "ADMIN" && (
              <Link href="/admin" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-sm font-medium text-espresso/80">
                Admin
              </Link>
            )}
            {me ? (
              <button onClick={logout} className="rounded-md px-2 py-2 text-left text-sm font-medium text-espresso/80">
                Sign out ({me.name})
              </button>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-sm font-medium text-espresso/80">
                Staff login
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
