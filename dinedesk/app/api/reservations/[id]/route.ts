import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// PATCH /api/reservations/[id] — admin: update status (SEATED/COMPLETED/CANCELLED)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = (await req.json()) as { status?: string };
  if (!["CONFIRMED", "SEATED", "COMPLETED", "CANCELLED"].includes(status ?? ""))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const reservation = await prisma.reservation.update({
    where: { id: params.id },
    data: { status: status as "CONFIRMED" | "SEATED" | "COMPLETED" | "CANCELLED" },
    include: { table: { select: { number: true } } },
  }).catch(() => null);

  if (!reservation)
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  return NextResponse.json({ reservation });
}
