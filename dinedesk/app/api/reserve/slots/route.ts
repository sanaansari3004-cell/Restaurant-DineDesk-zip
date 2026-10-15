import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { RESERVATION_SLOTS } from "@/lib/constants";

// GET /api/reserve/slots?date=YYYY-MM-DD&partySize=N
// Returns each slot with the tables that can seat the party and are still free.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const partySize = parseInt(searchParams.get("partySize") ?? "2", 10);

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr))
    return NextResponse.json({ error: "date=YYYY-MM-DD required" }, { status: 400 });

  const day = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (day < today)
    return NextResponse.json({ error: "Date is in the past" }, { status: 400 });

  const tables = await prisma.diningTable.findMany({
    where: { active: true, seats: { gte: Math.max(1, partySize || 2) } },
    orderBy: [{ seats: "asc" }, { number: "asc" }],
  });

  const taken = await prisma.reservation.findMany({
    where: {
      date: day,
      status: { in: ["CONFIRMED", "SEATED"] },
    },
    select: { tableId: true, slot: true },
  });
  const takenSet = new Set(taken.map((t) => `${t.tableId}|${t.slot}`));

  const slots = RESERVATION_SLOTS.map((slot) => ({
    slot,
    tables: tables
      .filter((t) => !takenSet.has(`${t.id}|${slot}`))
      .map((t) => ({ id: t.id, number: t.number, seats: t.seats, zone: t.zone })),
  }));

  return NextResponse.json({ date: dateStr, slots });
}
