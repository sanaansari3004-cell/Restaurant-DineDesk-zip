import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Public: active tables for dine-in checkout.
export async function GET() {
  const tables = await prisma.diningTable.findMany({
    where: { active: true },
    orderBy: { number: "asc" },
    select: { id: true, number: true, seats: true, zone: true },
  });
  return NextResponse.json({ tables });
}
