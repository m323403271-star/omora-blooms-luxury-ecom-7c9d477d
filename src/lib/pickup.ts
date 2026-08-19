export type PickupPoint = {
  id: string;
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

/** Local hubs available across Devanahalli Taluk. */
export const TALUK_PICKUP_POINTS: PickupPoint[] = [
  {
    id: "devanahalli-town-hub",
    label: "Devanahalli Town Hub",
    detail: "Near Devanahalli Fort Circle, Devanahalli Town",
  },
  {
    id: "budigere-cross-hub",
    label: "Budigere Cross Hub",
    detail: "Old Madras Road junction, Budigere Cross",
  },
  {
    id: "prestige-golfshire-gate",
    label: "Prestige Golfshire — Main Gate",
    detail: "Nandi Hills Road, Prestige Golfshire entrance",
  },
];

/** Pincodes across Devanahalli Taluk that get a pickup-point choice. */
export const TALUK_PINCODES = ["562110", "562164", "562157", "562129"] as const;

export function isTalukPincode(pincode: string | null | undefined): boolean {
  return !!pincode && (TALUK_PINCODES as readonly string[]).includes(pincode);
}

/**
 * Pickup points offered for a pincode:
 * airport pins get the terminals, taluk pins get terminals + local hubs.
 */
export function pickupPointsForPincode(pincode: string | null | undefined): PickupPoint[] {
  if (!pincode) return [];
  if (pincode === "560030" || pincode === "560300") return PICKUP_POINTS;
  if (isTalukPincode(pincode)) return [...PICKUP_POINTS, ...TALUK_PICKUP_POINTS];
  return [];
}

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
    return findPickup(id);
  } catch { return null; }
}

export function findPickup(id: string | null | undefined): PickupPoint | null {
  if (!id) return null;
  return [...PICKUP_POINTS, ...TALUK_PICKUP_POINTS].find((p) => p.id === id) ?? null;
}
