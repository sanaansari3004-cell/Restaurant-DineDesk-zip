import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* Hero — warm bistro editorial */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 md:pt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ember">
          Est. 2026 · Neighbourhood bistro
        </p>
        <h1 className="mt-4 max-w-3xl font-serif text-5xl font-black leading-[1.05] text-espresso md:text-7xl">
          Slow food, <span className="italic text-ember">fast</span> kitchen.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-espresso/70">
          Browse the menu, book a table, and watch your order move from flame to
          plate — all from this page. DineDesk is the bistro&apos;s digital
          front-of-house.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/menu"
            className="rounded-full bg-espresso px-7 py-3 text-sm font-semibold text-cream transition-colors hover:bg-ember"
          >
            Explore the menu
          </Link>
          <Link
            href="/reserve"
            className="rounded-full border-2 border-espresso/20 px-7 py-3 text-sm font-semibold text-espresso transition-colors hover:border-ember hover:text-ember"
          >
            Reserve a table
          </Link>
        </div>

        {/* marquee-ish strip of house notes */}
        <div className="rule-double mt-14 flex flex-wrap gap-x-8 gap-y-2 pt-4 text-sm text-espresso/60">
          <span>Wood-fired tandoor</span>
          <span>·</span>
          <span>18-hour dal makhani</span>
          <span>·</span>
          <span>Hand-pounded spices</span>
          <span>·</span>
          <span>Alphonso in season</span>
        </div>
      </section>

      {/* Three ways in */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              n: "01",
              title: "Order ahead",
              body: "Build your thali from the digital menu and check out in under a minute. Dine-in, takeaway or delivery.",
              href: "/menu",
              cta: "Start an order",
            },
            {
              n: "02",
              title: "Book a table",
              body: "Pick a date, a slot and your party size — live table availability, no double bookings, instant confirmation.",
              href: "/reserve",
              cta: "Reserve now",
            },
            {
              n: "03",
              title: "Watch it cook",
              body: "Every order gets a tracking number. Follow it live: received → preparing → ready → served.",
              href: "/track",
              cta: "Track an order",
            },
          ].map((c) => (
            <Link
              key={c.n}
              href={c.href}
              className="group rounded-2xl border border-espresso/15 bg-parchment/60 p-7 transition-all hover:-translate-y-1 hover:border-ember/40 hover:shadow-xl"
            >
              <p className="font-serif text-sm italic text-ember">{c.n}</p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-espresso">{c.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-espresso/65">{c.body}</p>
              <p className="mt-5 text-sm font-semibold text-ember group-hover:underline">
                {c.cta} →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Hours + staff strip */}
      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="flex flex-col gap-4 rounded-2xl bg-espresso p-8 text-cream md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-serif text-3xl font-bold">Open daily, 11:00 – 23:00</h2>
            <p className="mt-2 text-sm text-cream/70">
              Kitchen takes last orders at 22:30. Reservations open 30 days out.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/kitchen"
              className="rounded-full bg-cream/10 px-5 py-2.5 text-sm font-semibold text-cream ring-1 ring-cream/25 transition-colors hover:bg-cream/20"
            >
              Kitchen dashboard
            </Link>
            <Link
              href="/admin"
              className="rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-tomato"
            >
              Admin panel
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
