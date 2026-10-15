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
  if (body.number !== undefined) {
    const n = Math.floor(Number(body.number));
    if (!Number.isFinite(n) || n < 1)
      return NextResponse.json({ error: "Invalid table number" }, { status: 400 });
    data.number = n;
  }
  if (body.seats !== undefined) {
    const s = Math.floor(Number(body.seats));
    if (!Number.isFinite(s) || s < 1 || s > 20)
      return NextResponse.json({ error: "Invalid seats" }, { status: 400 });
    data.seats = s;
  }
  if (typeof body.zone === "string" && body.zone.trim()) data.zone = body.zone.trim();
  if (typeof body.active === "boolean") data.active = body.active;

  try {
    const table = await prisma.diningTable.update({ where: { id: params.id }, data });
    return NextResponse.json({ table });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const used = await prisma.reservation.count({ where: { tableId: params.id } });
  if (used > 0)
    return NextResponse.json(
      { error: "Table has reservations — deactivate it instead of deleting." },
      { status: 400 }
    );
  await prisma.diningTable.delete({ where: { id: params.id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
