// Prices are stored in paise (integer). Format as INR.
export function inr(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function inrShort(paise: number): string {
  const v = paise / 100;
  return "₹" + (Number.isInteger(v) ? v.toLocaleString("en-IN") : v.toLocaleString("en-IN", { minimumFractionDigits: 2 }));
}

export function timeAgo(date: Date | string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m ago`;
}
