import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Public menu: categories with their items.
export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { available: true },
        orderBy: [{ isSpecial: "desc" }, { name: "asc" }],
      },
    },
  });
  return NextResponse.json({ categories });
}
