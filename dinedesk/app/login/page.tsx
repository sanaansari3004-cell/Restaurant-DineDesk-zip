"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      const role = data.user.role as string;
      // Kitchen staff land on the kitchen board; admins on the admin panel.
      router.push(
        next !== "/"
          ? next
          : role === "ADMIN"
            ? "/admin"
            : "/kitchen"
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ember">Staff only</p>
      <h1 className="mt-2 font-serif text-4xl font-black text-espresso">Back of house.</h1>
      <p className="mt-2 text-sm text-espresso/60">
        Sign in with your staff account to reach the kitchen board or the admin panel.
      </p>

      <form onSubmit={submit} className="mt-8 rounded-2xl border border-espresso/12 bg-white/70 p-6">
        {error && (
          <p className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-800">
            {error}
          </p>
        )}
        <label className="block">
          <span className="text-sm font-semibold text-espresso">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="kitchen@dinedesk.local"
            className="mt-1 w-full rounded-xl border border-espresso/20 px-4 py-2.5 text-sm outline-none focus:border-ember"
          />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-espresso">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full rounded-xl border border-espresso/20 px-4 py-2.5 text-sm outline-none focus:border-ember"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-full bg-espresso py-3 text-sm font-bold text-cream transition-colors hover:bg-ember disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-6 rounded-2xl bg-parchment p-5 text-sm text-espresso/70">
        <p className="font-semibold text-espresso">Demo credentials (seeded):</p>
        <p className="mt-2 font-mono text-[13px]">admin@dinedesk.local / dinedesk123</p>
        <p className="font-mono text-[13px]">kitchen@dinedesk.local / dinedesk123</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-md px-4 py-16">Loading…</p>}>
      <LoginInner />
    </Suspense>
  );
}
