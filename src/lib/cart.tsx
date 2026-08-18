import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { CustomBouquet, GiftOptions } from "@/lib/gifting";
import { hashCustomization } from "@/lib/gifting";

export type CartItem = {
  id: string;
  /** Base product id (without customization/variant suffix). */
  productId?: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  /** Exact variant (shade) the customer picked, when applicable. */
  variantSlug?: string | null;
  colorName?: string | null;
  colorHex?: string | null;
  gift?: GiftOptions | null;
  bouquet?: CustomBouquet | null;
};


type AddInput = Omit<CartItem, "quantity" | "id"> & { id: string };

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: AddInput, quantity?: number) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "omora-cart-v1";

/** Deterministic short hash for variant/image keys. */
function simpleHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, hydrated]);

  const add = useCallback((input: AddInput, quantity = 1) => {
    setItems((prev) => {
      const suffix = hashCustomization(input.gift ?? null, input.bouquet ?? null);
      // Each distinct shade / selected image is its own cart line so the
      // warehouse always receives the exact media the customer chose.
      const variantKey = [input.variantSlug ?? "", input.image ?? ""].filter(Boolean).join("|");
      const variantSuffix = variantKey ? `::v${simpleHash(variantKey)}` : "";
      const compositeId = `${input.id}${variantSuffix}${suffix}`;
      const existing = prev.find((p) => p.id === compositeId);
      if (existing) {
        return prev.map((p) => (p.id === compositeId ? { ...p, quantity: p.quantity + quantity } : p));
      }
      const item: CartItem = {
        ...input,
        id: compositeId,
        productId: input.id,
        quantity,
        variantSlug: input.variantSlug ?? null,
        colorName: input.colorName ?? null,
        colorHex: input.colorHex ?? null,
        gift: input.gift ?? null,
        bouquet: input.bouquet ?? null,
      };
      return [...prev, item];
    });

    toast.success(`${input.name} added to your bag`);
    setIsOpen(true);
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((p) => p.id !== id));
      return;
    }
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity } : p)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const total = items.reduce((s, i) => s + i.quantity * i.price, 0);
    return {
      items,
      count,
      total,
      add,
      remove,
      setQuantity,
      clear,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    };
  }, [items, isOpen, add, remove, setQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
