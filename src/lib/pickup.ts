export type PickupPoint = {
  id: "t1-departure" | "arrival-hall" | "quad-food-court";
  label: string;
  detail: string;
};

export const PICKUP_POINTS: PickupPoint[] = [
  {
    id: "t1-departure",
    label: "Pickup Point 1 — T1 Departure Gate 2",
    detail: "Outside Kerbside, Terminal 1 Departures",
  },
  {
    id: "arrival-hall",
    label: "Pickup Point 2 — T1/T2 Arrival Hall Exit",
    detail: "Taxi Zone, Arrival Hall Exit",
  },
  {
    id: "quad-food-court",
    label: "Pickup Point 3 — The Quad / Food Court",
    detail: "Parking Zone, The Quad Food Court Area",
  },
];

const SELECTED_KEY = "omora-pickup-selected";
const ORDER_KEY_PREFIX = "omora-pickup-order-";

export function getSelectedPickup(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(SELECTED_KEY); } catch { return null; }
}

export function setSelectedPickup(id: string) {
  try { localStorage.setItem(SELECTED_KEY, id); } catch { /* ignore */ }
}

export function savePickupForOrder(orderId: string, id: string) {
  try { localStorage.setItem(ORDER_KEY_PREFIX + orderId, id); } catch { /* ignore */ }
}

export function getPickupForOrder(orderId: string): PickupPoint | null {
  if (typeof window === "undefined") return null;
  try {
    const id = localStorage.getItem(ORDER_KEY_PREFIX + orderId);
    if (!id) return null;
    return PICKUP_POINTS.find((p) => p.id === id) ?? null;
  } catch { return null; }
}

export function findPickup(id: string | null | undefined): PickupPoint | null {
  if (!id) return null;
  return PICKUP_POINTS.find((p) => p.id === id) ?? null;
}
