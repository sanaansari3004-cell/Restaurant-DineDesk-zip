import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public order tracking by human-friendly order number.
export async function GET(
  _req: Request,
  { params }: { params: { orderNo: string } }
) {
  const order = await prisma.order.findUnique({
    where: { orderNo: params.orderNo.toUpperCase().trim() },
    include: {
      items: { orderBy: { name: "asc" } },
      table: { select: { number: true } },
    },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order });
}
