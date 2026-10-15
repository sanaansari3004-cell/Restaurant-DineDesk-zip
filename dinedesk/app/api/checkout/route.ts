import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface CartLine {
  id: string;
  qty: number;
}

// POST /api/checkout
// Body: { customerName, phone?, type: DINE_IN|TAKEAWAY|DELIVERY, tableId?, items: CartLine[] }
// Payment is SIMULATED — demo mode only, always succeeds. No real money moves.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerName, phone, type, tableId, items } = body as {
      customerName?: string;
      phone?: string;
      type?: string;
      tableId?: string;
      items?: CartLine[];
    };

    if (!customerName?.trim())
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!["DINE_IN", "TAKEAWAY", "DELIVERY"].includes(type ?? ""))
      return NextResponse.json({ error: "Invalid order type" }, { status: 400 });
    if (!Array.isArray(items) || items.length === 0)
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

    const ids = [...new Set(items.map((l) => l.id))];
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: ids }, available: true },
    });
    if (menuItems.length !== ids.length)
      return NextResponse.json(
        { error: "Some items are no longer available" },
        { status: 400 }
      );

    const byId = new Map(menuItems.map((m) => [m.id, m]));
    const lines = items.map((l) => {
      const m = byId.get(l.id)!;
      const qty = Math.min(Math.max(1, Math.floor(l.qty || 1)), 20);
      return { menuItemId: m.id, name: m.name, pricePaise: m.pricePaise, qty };
    });

    const subtotal = lines.reduce((a, l) => a + l.pricePaise * l.qty, 0);
    const tax = Math.round(subtotal * 0.05); // 5% GST
    const total = subtotal + tax;

    let tableConnect: { connect: { id: string } } | undefined;
    if (type === "DINE_IN" && tableId) {
      const table = await prisma.diningTable.findUnique({ where: { id: tableId } });
      if (table?.active) tableConnect = { connect: { id: tableId } };
    }

    // Unique human-friendly order number
    let orderNo = "";
    for (let i = 0; i < 5; i++) {
      const cand =
        "DD-" + Date.now().toString(36).toUpperCase().slice(-4) +
        Math.random().toString(36).toUpperCase().slice(2, 6);
      const clash = await prisma.order.findUnique({ where: { orderNo: cand } });
      if (!clash) {
        orderNo = cand;
        break;
      }
    }
    if (!orderNo)
      return NextResponse.json({ error: "Could not generate order number" }, { status: 500 });

    // Lightweight customer profile keyed by phone (optional)
    let customerConnect: { connect: { id: string } } | undefined;
    if (phone?.trim()) {
      const customer = await prisma.customer.upsert({
        where: { phone: phone.trim() },
        update: { name: customerName.trim() },
        create: { name: customerName.trim(), phone: phone.trim() },
      });
      customerConnect = { connect: { id: customer.id } };
    }

    const order = await prisma.order.create({
      data: {
        orderNo,
        ...(customerConnect ? { customer: customerConnect } : {}),
        customerName: customerName.trim(),
        phone: phone?.trim() || null,
        type: type as "DINE_IN" | "TAKEAWAY" | "DELIVERY",
        ...(tableConnect ? { table: tableConnect } : {}),
        status: "RECEIVED",
        // SIMULATED demo payment — always marked paid, never touches a gateway.
        paymentStatus: "DEMO_PAID",
        paymentMethod: "DEMO",
        subtotalPaise: subtotal,
        taxPaise: tax,
        totalPaise: total,
        items: { create: lines },
      },
      include: { items: true },
    });

    return NextResponse.json({
      orderNo: order.orderNo,
      totalPaise: order.totalPaise,
      demoPayment: true, // explicit: no real payment was processed
    });
  } catch (e) {
    console.error("checkout failed", e);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
