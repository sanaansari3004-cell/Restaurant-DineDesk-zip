# DineDesk — Restaurant Ordering Platform

A full-stack restaurant ordering platform for a warm neighbourhood bistro:
digital menu, cart & checkout, table reservations, live order tracking, a
kitchen display board, and an admin panel — built with **Next.js 14 (App
Router) + TypeScript + Prisma + PostgreSQL + Tailwind CSS**.

> **Payments are SIMULATED.** Checkout shows a `DEMO — no real payment
> processed` banner, the receipt repeats it, and every order is stored with
> `paymentMethod = "DEMO"`. No gateway is contacted and no real money moves.

## Features

- **Public digital menu** — 6 categories (Starters, Mains, Biryani & Rice,
  Breads, Desserts, Beverages), ~34 realistic Indian dishes with INR prices,
  search, veg / non-veg filter, category rail, item-detail modal.
- **Cart + checkout** — persistent cart (localStorage), dine-in / takeaway /
  delivery, optional table pick, 5% GST, simulated payment step (always
  succeeds, clearly labelled DEMO), order confirmation with tracking number.
- **Table reservations** — date + party-size picker, live per-slot table
  availability, one-tap table select. Double-booking is blocked twice: the
  availability query filters taken tables **and** a
  `UNIQUE(tableId, date, slot)` constraint returns HTTP 409 on a race.
- **Order tracking** — look up by order number (e.g. `DD-AB12CD`) or by phone
  ("my orders"); live status timeline (received → preparing → ready → served)
  auto-refreshing every 5 seconds while the order is active.
- **Kitchen dashboard** (staff login) — live incoming-order board with status
  counts, one-tap transitions `received → preparing → ready → served` (forward
  only, enforced server-side), cancel, manual refresh.
- **Admin panel** (admin login) — menu-item CRUD with availability toggle and
  "house special" flag, category CRUD, table CRUD (number / seats / zone /
  active), reservation list with status changes, order list with revenue
  summary.
- **Auth** — staff (admin / kitchen) sign in with email + password (bcrypt
  hashes in Postgres). A JWT is stored in an `httpOnly`, `SameSite=Lax`
  cookie; `middleware.ts` guards `/kitchen/*` (kitchen or admin) and `/admin/*`
  (admin only). Customers order as guests; giving a phone number creates a
  lightweight profile for "my orders".

## Tech stack

| Layer      | Choice |
|------------|--------|
| Framework  | Next.js 14.2 (App Router), TypeScript, React 18 |
| Data       | Prisma 5 + PostgreSQL 16 (docker-compose) |
| Styling    | Tailwind CSS 3, Fraunces (serif headlines) + Inter (body) |
| Live data  | Polling — SWR `refreshInterval: 5000` on kitchen board & tracking page |
| Auth       | JWT in httpOnly cookie (`jose` for edge-safe verify in middleware, bcryptjs for passwords) |
| Money      | Integer paise in the DB, formatted as INR in the UI |

### Architecture notes

- **Why polling, not WebSockets:** the live surfaces are low-frequency
  (kitchen board, customer tracking). A 5-second SWR poll is simple,
  survives deploys/restarts, needs no socket server, and is honest about
  latency. `app/kitchen/page.tsx` and `app/track/page.tsx` document this.
- **No double-booking:** availability is computed per slot from active
  reservations; the DB unique constraint is the final arbiter (409 → "pick
  another table").
- **Order numbers** are human-friendly (`DD-XXXXXX`) and unique-checked.
- **Deletion guards:** items on past orders and tables with reservations can't
  be deleted — toggle availability / deactivate instead, so history stays
  intact.
- **Food imagery:** there are no real dish photos in this build.
  `components/DishArt.tsx` renders deterministic warm SVG tiles per dish
  (honest placeholder — swap for `<Image>` + real photos in production).

## Setup (Windows PowerShell)

```powershell
# 1. Start PostgreSQL 16
docker compose up -d

# 2. Install dependencies
npm install

# 3. Configure environment
Copy-Item .env.example .env
# .env defaults already match docker-compose.yml (db on localhost:5433).
# Set JWT_SECRET to a long random string:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 4. Run migrations + seed
npx prisma migrate deploy
npm run db:seed

# 5. Start the app
npm run dev
# -> http://localhost:3000
```

Production build check: `npm run build` · start: `npm start`.

## Demo credentials

Seeded by `npm run db:seed` (passwords are bcrypt-hashed in the DB):

| Role    | Email                  | Password    | Lands on        |
|---------|------------------------|-------------|-----------------|
| Admin   | `admin@dinedesk.local` | `dinedesk123` | `/admin`      |
| Kitchen | `kitchen@dinedesk.local` | `dinedesk123` | `/kitchen`  |

Try the full loop: add dishes on `/menu` → checkout (demo pay) → note the
`DD-XXXXXX` number → watch it on `/track` → advance it on `/kitchen`.

## Feature status (honest)

| Feature | Status |
|---------|--------|
| Digital menu, search, veg/non-veg filters, item detail | ✅ Working |
| Cart, checkout, GST math | ✅ Working |
| Payment | ⚠️ **SIMULATED DEMO** — always "succeeds"; labelled `DEMO — no real payment processed` on the checkout banner, the receipt, and stored as `paymentMethod="DEMO"` |
| Table reservations + double-booking guard | ✅ Working |
| Order tracking (by number / by phone), 5s live refresh | ✅ Working |
| Kitchen board, status transitions, cancel | ✅ Working (polling, not WebSockets) |
| Admin: menu/category/table CRUD, availability toggles | ✅ Working |
| Admin: reservations + orders + revenue | ✅ Working |
| Staff JWT-cookie auth, role guards | ✅ Working |
| Real payment gateway, SMS/email notifications, online table maps | ❌ Not built (out of scope for this demo) |

## Project structure

```
app/
  page.tsx            landing (bistro editorial)
  menu/               public menu + filters + detail modal
  cart/               cart → details → DEMO payment → confirmation
  track/              order tracking (polling)
  reserve/            reservations with live slot availability
  login/              staff sign-in
  kitchen/            live kitchen board (staff)
  admin/              admin panel (admin)
  api/
    menu/ checkout/ orders/[orderNo]/ my-orders/ tables/
    kitchen/orders/ kitchen/orders/[id]/
    reserve/slots/ reservations/ reservations/[id]/
    admin/items/ admin/items/[id]/ admin/categories/...
    admin/tables/... admin/orders/ auth/login|logout|me/
components/           Navbar, DishArt (SVG placeholders), StatusBadge
lib/                  db.ts, auth.ts (JWT), cart.tsx, format.ts, constants.ts
prisma/
  schema.prisma
  migrations/20261013233900_init/migration.sql
  seed.ts             34 dishes · 10 tables · 2 staff users · sample orders · 1 reservation
middleware.ts         route guards for /kitchen and /admin
docker-compose.yml    PostgreSQL 16 on host port 5433
```

## Environment variables

See `.env.example`. `DATABASE_URL` points at the compose DB;
`JWT_SECRET` signs staff session cookies (generate a random one — never commit
a real `.env`).
