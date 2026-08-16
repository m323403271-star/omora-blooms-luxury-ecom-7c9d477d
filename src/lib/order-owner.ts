const PREFIX = "omora-order-phone-";

export function normalizeOrderPhone(raw: string) {
  const digits = (raw || "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function saveOrderPhone(orderId: string, phone: string) {
  try {
    const p = normalizeOrderPhone(phone);
    if (p.length === 10) localStorage.setItem(PREFIX + orderId, p);
  } catch { /* ignore */ }
}

export function getOrderPhone(orderId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(PREFIX + orderId);
  } catch { return null; }
}
