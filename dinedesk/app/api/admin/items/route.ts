import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  return session && session.role === "ADMIN" ? session : null;
}

export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.menuItem.findMany({
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    include: { category: { select: { name: true } } },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { name, description, pricePaise, veg, spicy, available, isSpecial, categoryId } = body;
  if (!name?.trim() || !description?.trim() || !categoryId)
    return NextResponse.json({ error: "Name, description and category are required" }, { status: 400 });
  const price = Math.floor(Number(pricePaise));
  if (!Number.isFinite(price) || price < 0)
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });

  const item = await prisma.menuItem.create({
    data: {
      name: name.trim(),
      description: description.trim(),
      pricePaise: price,
      veg: veg !== false,
      spicy: Math.min(3, Math.max(0, Number(spicy) || 0)),
      available: available !== false,
      isSpecial: isSpecial === true,
      categoryId,
    },
    include: { category: { select: { name: true } } },
  });
  return NextResponse.json({ item }, { status: 201 });
}
