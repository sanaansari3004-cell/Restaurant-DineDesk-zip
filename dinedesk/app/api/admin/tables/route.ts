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
  const tables = await prisma.diningTable.findMany({ orderBy: { number: "asc" } });
  return NextResponse.json({ tables });
}

export async function POST(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { number, seats, zone, active } = await req.json();
  const n = Math.floor(Number(number));
  const s = Math.floor(Number(seats));
  if (!Number.isFinite(n) || n < 1 || !Number.isFinite(s) || s < 1 || s > 20)
    return NextResponse.json({ error: "Valid table number and seats required" }, { status: 400 });
  try {
    const table = await prisma.diningTable.create({
      data: { number: n, seats: s, zone: String(zone || "Main Hall"), active: active !== false },
    });
    return NextResponse.json({ table }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Table number already exists" }, { status: 400 });
  }
}
