// DineDesk seed: menu, tables, staff users, sample orders, one demo reservation.
// Run with: npm run db:seed   (needs DATABASE_URL pointing at a migrated DB)
import { PrismaClient, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const P = (rs: number) => Math.round(rs * 100); // rupees -> paise

const MENU: {
  category: string;
  items: { name: string; desc: string; price: number; veg: boolean; spicy: 0 | 1 | 2 | 3; special?: boolean }[];
}[] = [
  {
    category: "Starters",
    items: [
      { name: "Paneer Tikka Angara", desc: "Char-grilled cottage cheese marinated in smoked yoghurt, Kashmiri chilli and ajwain.", price: 249, veg: true, spicy: 2, special: true },
      { name: "Hara Bhara Kebab", desc: "Spinach, green pea and potato patties with mint chutney.", price: 199, veg: true, spicy: 1 },
      { name: "Tandoori Chicken (Half)", desc: "Overnight-marinated chicken, clay-oven roasted, onion laccha and lemon.", price: 299, veg: false, spicy: 2 },
      { name: "Chicken 65", desc: "Fiery curry-leaf tossed fried chicken, the Chennai classic.", price: 259, veg: false, spicy: 3 },
      { name: "Dahi ke Kebab", desc: "Crisped hung-curd kebabs with roasted cumin.", price: 219, veg: true, spicy: 1 },
      { name: "Masala Papad Basket", desc: "Roasted papads topped with onion, tomato and chaat masala.", price: 99, veg: true, spicy: 1 },
    ],
  },
  {
    category: "Mains",
    items: [
      { name: "Butter Chicken", desc: "Old-Delhi style murgh makhani — tomato, butter and kasuri methi.", price: 329, veg: false, spicy: 1, special: true },
      { name: "Paneer Lababdar", desc: "Rich onion-tomato gravy with hand-torn paneer and fresh cream.", price: 279, veg: true, spicy: 1 },
      { name: "Dal Tadka Fry", desc: "Yellow dal finished with ghee, garlic and dried red chillies.", price: 199, veg: true, spicy: 1 },
      { name: "Dal Makhani", desc: "Black urad simmered 18 hours, finished with white butter.", price: 229, veg: true, spicy: 0 },
      { name: "Kadhai Chicken", desc: "Chicken tossed with charred capsicum and crushed coriander seeds.", price: 309, veg: false, spicy: 2 },
      { name: "Palak Paneer", desc: "Fresh spinach puree, soft paneer, garlic tempering.", price: 259, veg: true, spicy: 1 },
      { name: "Chana Masala", desc: "Amritsari chickpeas with anardana and ginger juliennes.", price: 219, veg: true, spicy: 2 },
      { name: "Veg Kolhapuri", desc: "Mixed vegetables in a fiery Kolhapuri masala.", price: 249, veg: true, spicy: 3 },
    ],
  },
  {
    category: "Biryani & Rice",
    items: [
      { name: "Hyderabadi Chicken Dum Biryani", desc: "Sealed handi biryani with mirchi ka salan and raita.", price: 299, veg: false, spicy: 2, special: true },
      { name: "Subz Dum Biryani", desc: "Seasonal vegetables layered with saffron rice, served with burhani raita.", price: 249, veg: true, spicy: 1 },
      { name: "Egg Curry Biryani", desc: "Masala fried eggs over fragrant dum rice.", price: 229, veg: false, spicy: 2 },
      { name: "Jeera Rice", desc: "Basmati tossed with ghee-tempered cumin.", price: 149, veg: true, spicy: 0 },
      { name: "Curd Rice", desc: "Comfort curd rice with pomegranate and curry-leaf tadka.", price: 139, veg: true, spicy: 0 },
    ],
  },
  {
    category: "Breads",
    items: [
      { name: "Butter Naan", desc: "Tandoor-fresh, brushed with white butter.", price: 49, veg: true, spicy: 0 },
      { name: "Garlic Naan", desc: "Topped with roasted garlic and coriander.", price: 69, veg: true, spicy: 0 },
      { name: "Tandoori Roti", desc: "Whole-wheat, clay-oven baked.", price: 29, veg: true, spicy: 0 },
      { name: "Laccha Paratha", desc: "Sixteen flaky layers, ghee finished.", price: 59, veg: true, spicy: 0 },
      { name: "Cheese Naan", desc: "Stuffed with molten processed cheese.", price: 89, veg: true, spicy: 0 },
    ],
  },
  {
    category: "Desserts",
    items: [
      { name: "Gulab Jamun (4 pc)", desc: "Warm khoya dumplings in rose-cardamom syrup.", price: 119, veg: true, spicy: 0 },
      { name: "Rasmalai (2 pc)", desc: "Saffron milk-soaked chenna discs with pistachio.", price: 149, veg: true, spicy: 0 },
      { name: "Kulfi Falooda", desc: "Dense malai kulfi over vermicelli, basil seeds and rose syrup.", price: 169, veg: true, spicy: 0, special: true },
      { name: "Gajar ka Halwa", desc: "Slow-cooked winter carrots, ghee and khoya.", price: 159, veg: true, spicy: 0 },
    ],
  },
  {
    category: "Beverages",
    items: [
      { name: "Masala Chaas", desc: "Spiced buttermilk with roasted jeera.", price: 79, veg: true, spicy: 0 },
      { name: "Mango Lassi", desc: "Alphonso pulp churned with creamy curd.", price: 129, veg: true, spicy: 0 },
      { name: "Sweet / Salted Lassi", desc: "Punjabi-style thick lassi with malai topping.", price: 99, veg: true, spicy: 0 },
      { name: "Filter Coffee", desc: "South-Indian degree coffee, frothed dabara style.", price: 89, veg: true, spicy: 0 },
      { name: "Masala Shikanji", desc: "Nimbu cooler with black salt and mint.", price: 69, veg: true, spicy: 0 },
      { name: "Cold Coffee", desc: "Blended with vanilla ice cream.", price: 139, veg: true, spicy: 0 },
    ],
  },
];

const TABLES = [
  { number: 1, seats: 2, zone: "Window Side" },
  { number: 2, seats: 2, zone: "Window Side" },
  { number: 3, seats: 4, zone: "Main Hall" },
  { number: 4, seats: 4, zone: "Main Hall" },
  { number: 5, seats: 4, zone: "Main Hall" },
  { number: 6, seats: 6, zone: "Main Hall" },
  { number: 7, seats: 6, zone: "Family Corner" },
  { number: 8, seats: 8, zone: "Family Corner" },
  { number: 9, seats: 2, zone: "Patio" },
  { number: 10, seats: 4, zone: "Patio" },
];

async function main() {
  console.log("Seeding DineDesk…");

  // Staff users (demo credentials — see README)
  const password = await bcrypt.hash("dinedesk123", 10);
  await prisma.staffUser.upsert({
    where: { email: "admin@dinedesk.local" },
    update: { password, name: "DineDesk Admin", role: "ADMIN" },
    create: { email: "admin@dinedesk.local", name: "DineDesk Admin", password, role: "ADMIN" },
  });
  await prisma.staffUser.upsert({
    where: { email: "kitchen@dinedesk.local" },
    update: { password, name: "Head Chef", role: "KITCHEN" },
    create: { email: "kitchen@dinedesk.local", name: "Head Chef", password, role: "KITCHEN" },
  });

  // Categories + menu items
  for (const [i, cat] of MENU.entries()) {
    const slug = cat.category.toLowerCase().replace(/[^a-z]+/g, "-").replace(/(^-|-$)/g, "");
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name: cat.category, sortOrder: i },
      create: { name: cat.category, slug, sortOrder: i },
    });
    for (const item of cat.items) {
      const existing = await prisma.menuItem.findFirst({
        where: { name: item.name, categoryId: category.id },
      });
      const data = {
        description: item.desc,
        pricePaise: P(item.price),
        veg: item.veg,
        spicy: item.spicy,
        isSpecial: item.special ?? false,
        available: true,
        categoryId: category.id,
      };
      if (existing) await prisma.menuItem.update({ where: { id: existing.id }, data });
      else await prisma.menuItem.create({ data: { name: item.name, ...data } });
    }
  }

  // Tables
  for (const t of TABLES) {
    await prisma.diningTable.upsert({
      where: { number: t.number },
      update: { seats: t.seats, zone: t.zone, active: true },
      create: { ...t, active: true },
    });
  }

  // Sample orders at various statuses (for the kitchen board demo)
  const items = await prisma.menuItem.findMany({ take: 12 });
  const pick = (names: string[]) => items.filter((m) => names.includes(m.name));
  const sampleOrders: { orderNo: string; name: string; phone: string; type: "DINE_IN" | "TAKEAWAY" | "DELIVERY"; tableNo?: number; status: OrderStatus; items: string[]; minsAgo: number }[] = [
    { orderNo: "DD-SEED01", name: "Aarav Mehta", phone: "98110 22334", type: "DINE_IN", tableNo: 3, status: "RECEIVED", items: ["Paneer Tikka Angara", "Butter Naan", "Mango Lassi"], minsAgo: 4 },
    { orderNo: "DD-SEED02", name: "Sana Kapoor", phone: "98990 11223", type: "TAKEAWAY", status: "PREPARING", items: ["Hyderabadi Chicken Dum Biryani", "Masala Chaas"], minsAgo: 18 },
    { orderNo: "DD-SEED03", name: "Rohan Iyer", phone: "97654 32109", type: "DINE_IN", tableNo: 6, status: "READY", items: ["Dal Makhani", "Jeera Rice", "Tandoori Roti", "Gulab Jamun (4 pc)"], minsAgo: 32 },
    { orderNo: "DD-SEED04", name: "Priya Nair", phone: "98111 44556", type: "DELIVERY", status: "SERVED", items: ["Butter Chicken", "Garlic Naan", "Kulfi Falooda"], minsAgo: 95 },
  ];
  for (const s of sampleOrders) {
    const exists = await prisma.order.findUnique({ where: { orderNo: s.orderNo } });
    if (exists) continue;
    const chosen = pick(s.items);
    const subtotal = chosen.reduce((a, m) => a + m.pricePaise, 0);
    const tax = Math.round(subtotal * 0.05);
    const table = s.tableNo ? await prisma.diningTable.findUnique({ where: { number: s.tableNo } }) : null;
    await prisma.order.create({
      data: {
        orderNo: s.orderNo,
        customerName: s.name,
        phone: s.phone,
        type: s.type,
        tableId: table?.id,
        status: s.status,
        paymentStatus: "DEMO_PAID",
        paymentMethod: "DEMO",
        subtotalPaise: subtotal,
        taxPaise: tax,
        totalPaise: subtotal + tax,
        createdAt: new Date(Date.now() - s.minsAgo * 60_000),
        items: {
          create: chosen.map((m) => ({ menuItemId: m.id, name: m.name, pricePaise: m.pricePaise, qty: 1 })),
        },
      },
    });
  }

  // One demo reservation: tomorrow, 19:00, table 7 (6-seater, Family Corner)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const table7 = await prisma.diningTable.findUnique({ where: { number: 7 } });
  if (table7) {
    await prisma.reservation.upsert({
      where: { tableId_date_slot: { tableId: table7.id, date: tomorrow, slot: "19:00" } },
      update: {},
      create: {
        name: "Kavya Sharma",
        phone: "98220 77889",
        date: tomorrow,
        slot: "19:00",
        partySize: 5,
        tableId: table7.id,
        status: "CONFIRMED",
        notes: "Window seat preferred, one high chair for a toddler.",
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
