import { useMemo, useState } from "react";
import { Gift, Sparkles, Plus, Minus } from "lucide-react";
import {
  BOUQUET_FLOWERS,
  BOUQUET_GREENERY,
  BOUQUET_WRAPPING,
  GIFT_MESSAGE_MAX,
  GREETING_CARDS,
  bouquetFlowerCount,
  computeBouquetAddOn,
  type BouquetSelection,
  type CustomBouquet,
  type GiftOptions,
  type GreetingCardType,
} from "@/lib/gifting";
import { formatPrice } from "@/lib/products";

type Props = {
  basePrice: number;
  onChange: (state: { gift: GiftOptions | null; bouquet: CustomBouquet | null; addOnTotal: number }) => void;
};

const emptyBouquet: CustomBouquet = {
  flowers: BOUQUET_FLOWERS.map((f) => ({ ...f })),
  greenery: null,
  wrapping: null,
  addOnPrice: 0,
};

export function GiftAndBouquetCustomizer({ basePrice, onChange }: Props) {
  const [isGift, setIsGift] = useState(false);
  const [message, setMessage] = useState("");
  const [cardType, setCardType] = useState<GreetingCardType>("birthday");
  const [error, setError] = useState<string | null>(null);

  const [isCustom, setIsCustom] = useState(false);
  const [bouquet, setBouquet] = useState<CustomBouquet>(emptyBouquet);

  // Validate + emit changes to parent.
  function emit(next: {
    isGift: boolean;
    message: string;
    cardType: GreetingCardType;
    isCustom: boolean;
    bouquet: CustomBouquet;
  }) {
    const trimmed = next.message.slice(0, GIFT_MESSAGE_MAX);
    let giftPayload: GiftOptions | null = null;
    if (next.isGift) {
      const cardLabel = GREETING_CARDS.find((c) => c.id === next.cardType)?.label ?? next.cardType;
      giftPayload = { isGift: true, message: trimmed, cardType: next.cardType, cardLabel };
    }
    const addOn = next.isCustom ? computeBouquetAddOn(next.bouquet) : 0;
    const bouquetPayload = next.isCustom ? { ...next.bouquet, addOnPrice: addOn } : null;
    onChange({ gift: giftPayload, bouquet: bouquetPayload, addOnTotal: addOn });
  }

  function updateGift(patch: Partial<{ isGift: boolean; message: string; cardType: GreetingCardType }>) {
    const nextIsGift = patch.isGift ?? isGift;
    const nextMessage = patch.message ?? message;
    const nextCard = patch.cardType ?? cardType;

    if (nextMessage.length > GIFT_MESSAGE_MAX) {
      setError(`Gift message must be ${GIFT_MESSAGE_MAX} characters or fewer.`);
      return;
    }
    // Basic input sanitisation — strip control chars that break WhatsApp URLs.
    const clean = nextMessage.replace(/[\u0000-\u001F\u007F]/g, "");
    setError(null);
    setIsGift(nextIsGift);
    setMessage(clean);
    setCardType(nextCard);
    emit({ isGift: nextIsGift, message: clean, cardType: nextCard, isCustom, bouquet });
  }

  function updateBouquet(next: CustomBouquet, nextIsCustom = isCustom) {
    setBouquet(next);
    setIsCustom(nextIsCustom);
    emit({ isGift, message, cardType, isCustom: nextIsCustom, bouquet: next });
  }

  function setFlowerQty(id: string, delta: number) {
    const next = {
      ...bouquet,
      flowers: bouquet.flowers.map((f) =>
        f.id === id ? { ...f, qty: Math.max(0, Math.min(12, f.qty + delta)) } : f,
      ),
    };
    updateBouquet(next);
  }

  function pickOne(kind: "greenery" | "wrapping", option: BouquetSelection | null) {
    updateBouquet({ ...bouquet, [kind]: option });
  }

  const addOn = useMemo(() => (isCustom ? computeBouquetAddOn(bouquet) : 0), [isCustom, bouquet]);
  const flowerCount = bouquetFlowerCount(bouquet);
  const total = basePrice + addOn;

  return (
    <div className="mt-8 space-y-5">
      {/* Gift toggle */}
      <div className="hairline border rounded-2xl p-4">
        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="inline-flex items-center gap-2 text-sm font-medium">
            <Gift className="h-4 w-4 text-[color:var(--gold)]" /> Is this a gift?
          </span>
          <span className="relative inline-flex">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={isGift}
              onChange={(e) => updateGift({ isGift: e.target.checked })}
              aria-label="Mark this order as a gift"
            />
            <span className="w-11 h-6 rounded-full bg-[color:var(--muted)] peer-checked:bg-[color:var(--gold)] transition-colors" />
            <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
          </span>
        </label>

        {isGift && (
          <div className="mt-4 space-y-3 animate-fade-in">
            <div>
              <label htmlFor="gift-card-type" className="block text-[10px] tracking-[0.2em] uppercase text-[color:var(--muted-foreground)] mb-1.5">
                Greeting Card
              </label>
              <select
                id="gift-card-type"
                value={cardType}
                onChange={(e) => updateGift({ cardType: e.target.value as GreetingCardType })}
                className="w-full bg-[color:var(--noir)] border hairline rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]"
              >
                {GREETING_CARDS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="gift-message" className="block text-[10px] tracking-[0.2em] uppercase text-[color:var(--muted-foreground)] mb-1.5">
                Gift Message
              </label>
              <textarea
                id="gift-message"
                value={message}
                onChange={(e) => updateGift({ message: e.target.value })}
                maxLength={GIFT_MESSAGE_MAX}
                rows={3}
                placeholder="Write a heartfelt note (max 200 characters)…"
                className="w-full resize-none bg-[color:var(--noir)] border hairline rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]"
              />
              <div className="mt-1 flex justify-between text-[11px] text-[color:var(--muted-foreground)]">
                <span>{error ?? "Handwritten on our signature card."}</span>
                <span className={message.length >= GIFT_MESSAGE_MAX ? "text-[color:var(--destructive)]" : ""}>
                  {message.length}/{GIFT_MESSAGE_MAX}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Build Your Own Bouquet */}
      <div className="hairline border rounded-2xl p-4">
        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="inline-flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-[color:var(--gold)]" /> Build Your Own Bouquet
          </span>
          <span className="relative inline-flex">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={isCustom}
              onChange={(e) => {
                if (e.target.checked) {
                  updateBouquet({ ...emptyBouquet, flowers: BOUQUET_FLOWERS.map((f) => ({ ...f })) }, true);
                } else {
                  updateBouquet(emptyBouquet, false);
                }
              }}
              aria-label="Enable custom bouquet builder"
            />
            <span className="w-11 h-6 rounded-full bg-[color:var(--muted)] peer-checked:bg-[color:var(--gold)] transition-colors" />
            <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
          </span>
        </label>

        {isCustom && (
          <div className="mt-5 space-y-6 animate-fade-in">
            {/* Step 1 — flowers */}
            <section>
              <StepHeader step={1} title="Primary Flowers" hint={`${flowerCount} selected`} />
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {bouquet.flowers.map((f) => (
                  <div key={f.id} className="flex items-center justify-between hairline border rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{f.label}</p>
                      <p className="text-[11px] text-[color:var(--muted-foreground)]">+{formatPrice(f.price)}</p>
                    </div>
                    <div className="flex items-center hairline border rounded-full">
                      <button type="button" onClick={() => setFlowerQty(f.id, -1)} className="p-1.5" aria-label={`Remove ${f.label}`}>
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs px-2 min-w-6 text-center">{f.qty}</span>
                      <button type="button" onClick={() => setFlowerQty(f.id, 1)} className="p-1.5" aria-label={`Add ${f.label}`}>
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Step 2 — greenery */}
            <section>
              <StepHeader step={2} title="Filler Greenery" />
              <OptionGrid
                options={BOUQUET_GREENERY}
                selectedId={bouquet.greenery?.id ?? null}
                onSelect={(o) => pickOne("greenery", o)}
              />
            </section>

            {/* Step 3 — wrapping */}
            <section>
              <StepHeader step={3} title="Wrapping Paper" />
              <OptionGrid
                options={BOUQUET_WRAPPING}
                selectedId={bouquet.wrapping?.id ?? null}
                onSelect={(o) => pickOne("wrapping", o)}
              />
            </section>

            {/* Summary */}
            <div className="rounded-xl bg-[color:var(--noir)]/60 border hairline p-3 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-[color:var(--muted-foreground)]">Base product</span><span>{formatPrice(basePrice)}</span></div>
              <div className="flex justify-between"><span className="text-[color:var(--muted-foreground)]">Customization add-on</span><span className="text-[color:var(--gold)]">+{formatPrice(addOn)}</span></div>
              <div className="flex justify-between font-medium pt-1 border-t hairline"><span>New unit total</span><span className="text-[color:var(--gold)]">{formatPrice(total)}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepHeader({ step, title, hint }: { step: number; title: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="inline-grid place-items-center w-5 h-5 rounded-full bg-[color:var(--gold)] text-[color:var(--noir)] text-[10px] font-bold">{step}</span>
        <p className="text-sm font-medium">{title}</p>
      </div>
      {hint && <span className="text-[11px] text-[color:var(--muted-foreground)]">{hint}</span>}
    </div>
  );
}

function OptionGrid({
  options,
  selectedId,
  onSelect,
}: {
  options: BouquetSelection[];
  selectedId: string | null;
  onSelect: (o: BouquetSelection | null) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((o) => {
        const selected = selectedId === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onSelect(selected ? null : o)}
            className={`text-left hairline border rounded-lg px-3 py-2 transition-colors ${
              selected ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10" : "hover:border-[color:var(--gold)]/50"
            }`}
            aria-pressed={selected}
          >
            <p className="text-sm">{o.label}</p>
            <p className="text-[11px] text-[color:var(--muted-foreground)]">
              {o.price > 0 ? `+${formatPrice(o.price)}` : "Included"}
            </p>
          </button>
        );
      })}
    </div>
  );
}
