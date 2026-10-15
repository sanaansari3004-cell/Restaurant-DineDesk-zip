import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Live order feed for the kitchen board (polled by the client every few seconds).
export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "KITCHEN" && session.role !== "ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { status: { in: ["RECEIVED", "PREPARING", "READY"] } },
    orderBy: { createdAt: "asc" },
    include: { items: true, table: { select: { number: true } } },
  });
  return NextResponse.json({ orders, serverTime: new Date().toISOString() });
}
