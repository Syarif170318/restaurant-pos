function inTimeRange(now: string, from?: string | null, to?: string | null): boolean {
  if (!from && !to) return true;
  if (from && to) return now >= from && now <= to;
  if (from) return now >= from;
  if (to) return now <= to;
  return true;
}

export function isMenuAvailableNow(
  availableFrom?: string | null,
  availableTo?: string | null,
): boolean {
  const now = new Date().toTimeString().slice(0, 5);
  return inTimeRange(now, availableFrom, availableTo);
}

export function getEffectivePrice(
  dineInPrice: number,
  takeawayPrice: number | null | undefined,
  orderType: "dine_in" | "takeaway",
): number {
  if (orderType === "takeaway" && takeawayPrice != null) return takeawayPrice;
  return dineInPrice;
}
