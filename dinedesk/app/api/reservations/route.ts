import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { RESERVATION_SLOTS } from "@/lib/constants";

// POST /api/reservations — public: book a table.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, date, slot, partySize, tableId, notes } = body as {
      name?: string;
      phone?: string;
      date?: string;
      slot?: string;
      partySize?: number;
      tableId?: string;
      notes?: string;
    };

    if (!name?.trim() || !phone?.trim())
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      return NextResponse.json({ error: "Valid date required" }, { status: 400 });
    if (!slot || !RESERVATION_SLOTS.includes(slot))
      return NextResponse.json({ error: "Valid time slot required" }, { status: 400 });
    const size = Math.floor(partySize ?? 0);
    if (size < 1 || size > 20)
      return NextResponse.json({ error: "Party size must be 1–20" }, { status: 400 });
    if (!tableId)
      return NextResponse.json({ error: "Table selection required" }, { status: 400 });

    const day = new Date(date + "T00:00:00");
    const table = await prisma.diningTable.findUnique({ where: { id: tableId } });
    if (!table || !table.active)
      return NextResponse.json({ error: "Table not available" }, { status: 400 });
    if (table.seats < size)
      return NextResponse.json(
        { error: `Table ${table.number} seats only ${table.seats}` },
        { status: 400 }
      );

    try {
      const reservation = await prisma.reservation.create({
        data: {
          name: name.trim(),
          phone: phone.trim(),
          date: day,
          slot,
          partySize: size,
          tableId,
          notes: notes?.trim() || null,
        },
        include: { table: { select: { number: true, zone: true } } },
      });
      return NextResponse.json({ reservation }, { status: 201 });
    } catch (e: unknown) {
      // Unique(tableId, date, slot) violation => someone just booked it.
      if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002")
        return NextResponse.json(
          { error: "That table was just booked for this slot — please pick another." },
          { status: 409 }
        );
      throw e;
    }
  } catch (e) {
    console.error("reservation failed", e);
    return NextResponse.json({ error: "Reservation failed" }, { status: 500 });
  }
}

// GET /api/reservations — admin: list upcoming reservations.
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reservations = await prisma.reservation.findMany({
    orderBy: [{ date: "asc" }, { slot: "asc" }],
    take: 100,
    include: { table: { select: { number: true, zone: true } } },
  });
  return NextResponse.json({ reservations });
}
