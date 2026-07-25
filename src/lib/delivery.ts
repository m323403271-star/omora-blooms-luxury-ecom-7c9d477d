import { z } from "zod";

export type DeliveryZone = "express" | "regional" | "none";
export type DeliveryTier = "regular" | "prestige";

export type DeliveryResult = {
  pincode: string;
  zone: DeliveryZone;
  serviceable: boolean;
  eta: string;
  label: string;
  area?: string;
  tier: DeliveryTier;
  badge: "green" | "blue" | "vip" | "muted";
  message: string;
};

export const EXPRESS_PINCODES: Record<string, string> = {
  "562110": "Devanahalli",
  "560300": "Kempegowda International Airport",
};

export const REGIONAL_PINCODES: Record<string, string> = {
  "562101": "Regional Express Zone",
  "561203": "Regional Express Zone",
  "562129": "Regional Express Zone",
  "562157": "Regional Express Zone",
  "562135": "Regional Express Zone",
  "562103": "Regional Express Zone",
};

export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d{5}$/, { message: "Enter a valid 6-digit Indian pincode" });

const STORAGE_KEY = "omora_delivery_pincode";
const TIER_KEY = "omora_customer_tier";

export function getStoredPincode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredPincode(pincode: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, pincode);
    window.dispatchEvent(new CustomEvent("omora:pincode-changed", { detail: pincode }));
  } catch {
    // ignore
  }
}

export function clearStoredPincode() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("omora:pincode-changed", { detail: null }));
  } catch {
    // ignore
  }
}

export function getCustomerTier(): DeliveryTier {
  if (typeof window === "undefined") return "regular";
  try {
    return window.localStorage.getItem(TIER_KEY) === "prestige" ? "prestige" : "regular";
  } catch {
    return "regular";
  }
}

export function setCustomerTier(tier: DeliveryTier) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TIER_KEY, tier);
    window.dispatchEvent(new CustomEvent("omora:tier-changed", { detail: tier }));
  } catch {
    // ignore
  }
}

export function checkDelivery(pincodeInput: string, tier: DeliveryTier = getCustomerTier()): DeliveryResult {
  const parsed = pincodeSchema.safeParse(pincodeInput);
  if (!parsed.success) {
    return {
      pincode: pincodeInput,
      zone: "none",
      serviceable: false,
      eta: "—",
      label: "Invalid pincode",
      tier,
      badge: "muted",
      message: parsed.error.issues[0]?.message ?? "Enter a valid 6-digit Indian pincode",
    };
  }
  const pincode = parsed.data;

  if (EXPRESS_PINCODES[pincode]) {
    return {
      pincode,
      zone: "express",
      serviceable: true,
      eta: "20 – 30 Minutes",
      label: "Express Delivery",
      area: EXPRESS_PINCODES[pincode],
      tier,
      badge: "green",
      message: `Express delivery in 20–30 minutes to ${EXPRESS_PINCODES[pincode]}.`,
    };
  }

  if (REGIONAL_PINCODES[pincode]) {
    const isPrestige = tier === "prestige";
    return {
      pincode,
      zone: "regional",
      serviceable: true,
      eta: isPrestige ? "45 Minutes – 1 Hour" : "1 – 2 Hours",
      label: isPrestige ? "Prestige Priority Delivery" : "Regional Express",
      area: "Regional Express Zone",
      tier,
      badge: isPrestige ? "vip" : "blue",
      message: isPrestige
        ? "Prestige priority: your order arrives in 45 minutes to 1 hour."
        : "Regional express delivery in 1 to 2 hours.",
    };
  }

  return {
    pincode,
    zone: "none",
    serviceable: false,
    eta: "—",
    label: "Not serviceable",
    tier,
    badge: "muted",
    message: "Sorry, we currently do not deliver to this pincode.",
  };
}
