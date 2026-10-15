import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ORDER_FLOW } from "@/lib/constants";

const ALLOWED = new Set([...ORDER_FLOW, "CANCELLED"]);

// Advance an order's status. Only forward transitions are allowed
// (RECEIVED -> PREPARING -> READY -> SERVED), plus cancellation.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || (session.role !== "KITCHEN" && session.role !== "ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = (await req.json()) as { status?: string };
  if (!status || !ALLOWED.has(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (status !== "CANCELLED") {
    const cur = ORDER_FLOW.indexOf(order.status as (typeof ORDER_FLOW)[number]);
    const next = ORDER_FLOW.indexOf(status as (typeof ORDER_FLOW)[number]);
    if (cur === -1 || next !== cur + 1)
      return NextResponse.json(
        { error: `Cannot move from ${order.status} to ${status}` },
        { status: 400 }
      );
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { status: status as "RECEIVED" | "PREPARING" | "READY" | "SERVED" | "CANCELLED" },
    include: { items: true, table: { select: { number: true } } },
  });
  return NextResponse.json({ order: updated });
}
