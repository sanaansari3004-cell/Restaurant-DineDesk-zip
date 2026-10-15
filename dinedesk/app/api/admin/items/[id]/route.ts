import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  return session && session.role === "ADMIN" ? session : null;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.description === "string" && body.description.trim())
    data.description = body.description.trim();
  if (body.pricePaise !== undefined) {
    const price = Math.floor(Number(body.pricePaise));
    if (!Number.isFinite(price) || price < 0)
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    data.pricePaise = price;
  }
  if (typeof body.veg === "boolean") data.veg = body.veg;
  if (body.spicy !== undefined) data.spicy = Math.min(3, Math.max(0, Number(body.spicy) || 0));
  if (typeof body.available === "boolean") data.available = body.available;
  if (typeof body.isSpecial === "boolean") data.isSpecial = body.isSpecial;
  if (typeof body.categoryId === "string") data.categoryId = body.categoryId;

  const item = await prisma.menuItem
    .update({ where: { id: params.id }, data, include: { category: { select: { name: true } } } })
    .catch(() => null);
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Keep order history intact: block deletion if the item appears on any order.
  const used = await prisma.orderItem.count({ where: { menuItemId: params.id } });
  if (used > 0)
    return NextResponse.json(
      { error: "Item is on past orders — mark it unavailable instead of deleting." },
      { status: 400 }
    );

  await prisma.menuItem.delete({ where: { id: params.id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
