import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Admin: recent orders with revenue summary.
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true, table: { select: { number: true } } },
  });
  const revenuePaise = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((a, o) => a + o.totalPaise, 0);
  return NextResponse.json({ orders, revenuePaise, count: orders.length });
}
