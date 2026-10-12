const PREFIX = "omora-order-token-";

export function saveOrderToken(orderId: string, token: string) {
  try {
    if (/^[a-f0-9]{64}$/i.test(token)) localStorage.setItem(PREFIX + orderId, token);
  } catch { /* ignore */ }
}

export function getOrderToken(orderId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(PREFIX + orderId);
  } catch { return null; }
}
