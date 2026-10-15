// Bookable reservation slots (kitchen hours 11:00 – 22:30)
export const RESERVATION_SLOTS = [
  "11:30",
  "12:30",
  "13:30",
  "14:30",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

export const ORDER_FLOW = ["RECEIVED", "PREPARING", "READY", "SERVED"] as const;

export const STATUS_LABEL: Record<string, string> = {
  RECEIVED: "Received",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  CANCELLED: "Cancelled",
};

export const DEMO_PAYMENT_NOTE = "DEMO — no real payment processed";
