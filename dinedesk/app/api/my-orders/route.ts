import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// "My orders" lookup by phone number (lightweight guest accounts).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone")?.trim();
  if (!phone) return NextResponse.json({ error: "phone required" }, { status: 400 });

  const orders = await prisma.order.findMany({
    where: { phone },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { items: true, table: { select: { number: true } } },
  });
  return NextResponse.json({ orders });
}
