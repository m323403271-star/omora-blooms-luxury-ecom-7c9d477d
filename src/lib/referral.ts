const KEY = "omora-ref-v1";

export function getStoredRef(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setStoredRef(code: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, code);
  } catch {
    // ignore
  }
}

export function clearStoredRef() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function captureRefFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && /^[A-Za-z0-9_-]{2,32}$/.test(ref)) {
      setStoredRef(ref.toUpperCase());
      return ref.toUpperCase();
    }
  } catch {
    // ignore
  }
  return null;
}
