import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ — OMORA BLOOMS" }, { name: "description", content: "Answers about OMORA BLOOMS handmade bouquets, shipping, custom orders and more." }] }),
  component: FaqPage,
});

const FAQS: { q: string; a: string }[] = [
  { q: "What are OMORA BLOOMS bouquets made of?", a: "Our bouquets are handmade using premium yarn (crochet) and pipe cleaner. We do not sell fresh flowers — every bloom is designed to last forever." },
  { q: "How long does an order take?", a: "In-stock pieces ship same-day within Bengaluru and 1–3 days across India. Handmade-to-order pieces take 3–7 working days. Custom orders may take 7–15 days." },
  { q: "Do you offer same-day delivery?", a: "Yes, within Bengaluru city for orders placed before 12 PM. Additional charges apply." },
  { q: "Do you ship internationally?", a: "Yes, we ship worldwide via DHL & FedEx. Delivery times and rates vary by destination." },
  { q: "Can I customize a bouquet?", a: "Absolutely. Chat with us on WhatsApp — we offer custom colors, sizes, personalized notes and complete bespoke arrangements." },
  { q: "How do I place an order?", a: "You can order directly from the website or via WhatsApp. Our concierge team confirms every order personally." },
  { q: "Do you offer corporate gifting?", a: "Yes. We work with brands and companies on bulk gifting, custom packaging and full branding. Contact us for a proposal." },
  { q: "What is your return policy?", a: "Because every piece is handmade to order, we do not accept returns on completed items. Damaged-in-transit pieces are replaced free of charge." },
];

function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="container-luxe py-16 md:py-24">
      <div className="text-center max-w-2xl mx-auto">
        <p className="eyebrow mb-4">FAQ</p>
        <h1 className="font-serif text-5xl md:text-6xl">Frequently Asked</h1>
        <p className="text-[color:var(--muted-foreground)] mt-4">Everything you need to know before ordering. Still curious? Message us anytime.</p>
      </div>
      <div className="mt-12 max-w-3xl mx-auto space-y-3">
        {FAQS.map((f, i) => (
          <div key={i} className="hairline border rounded-2xl overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full text-left px-6 py-5 flex items-center justify-between gap-4">
              <span className="font-serif text-lg">{f.q}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${open === i ? "rotate-180 text-[color:var(--gold)]" : ""}`} />
            </button>
            {open === i && <div className="px-6 pb-5 text-sm text-[color:var(--muted-foreground)] leading-relaxed">{f.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
