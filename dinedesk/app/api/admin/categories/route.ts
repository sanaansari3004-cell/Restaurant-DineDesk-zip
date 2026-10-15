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
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { items: true } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name } = await req.json();
  if (!name?.trim())
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const slug = name.trim().toLowerCase().replace(/[^a-z]+/g, "-").replace(/(^-|-$)/g, "");
  try {
    const category = await prisma.category.create({
      data: { name: name.trim(), slug },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Category already exists" }, { status: 400 });
  }
}
