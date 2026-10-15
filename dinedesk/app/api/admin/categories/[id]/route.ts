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
  const { name } = await req.json();
  if (!name?.trim())
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const slug = name.trim().toLowerCase().replace(/[^a-z]+/g, "-").replace(/(^-|-$)/g, "");
  try {
    const category = await prisma.category.update({
      where: { id: params.id },
      data: { name: name.trim(), slug },
    });
    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ error: "Update failed (duplicate name?)" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const count = await prisma.menuItem.count({ where: { categoryId: params.id } });
  if (count > 0)
    return NextResponse.json(
      { error: "Category has items — move or delete them first." },
      { status: 400 }
    );
  await prisma.category.delete({ where: { id: params.id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
