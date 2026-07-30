import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { WHATSAPP_DISPLAY } from "@/lib/whatsapp";

const SLIDES = [
  {
    id: "airport",
    content: (
      <>
        ⚡{" "}
        <span className="font-semibold">
          Express 20–30 Mins Delivery at Kempegowda International Airport!
        </span>
        &ensp;
        <Link
          to="/airport-pickup"
          className="underline underline-offset-2 opacity-75 hover:opacity-100 transition-opacity font-normal normal-case tracking-normal"
        >
          Check Pickup Points →
        </Link>
      </>
    ),
  },
  {
    id: "packaging",
    content: (
      <>
        🎁{" "}
        <span className="font-semibold">
          Complimentary Luxury Packaging &amp; Same-Day Delivery Available
        </span>
      </>
    ),
  },
  {
    id: "whatsapp",
    content: (
      <>
        💬{" "}
        <span className="font-semibold">WhatsApp Us:&ensp;{WHATSAPP_DISPLAY}</span>
      </>
    ),
  },
  {
    id: "zones",
    content: (
      <>
        🚀{" "}
        <span className="font-semibold">Express Zone</span>
        <span className="opacity-70">&ensp;20–30 mins&ensp;</span>
        <span className="opacity-40">|</span>
        <span className="font-semibold">&ensp;Regional</span>
        <span className="opacity-70">&ensp;1–2 hrs&ensp;</span>
        <span className="opacity-40">|</span>
        <span className="font-semibold">&ensp;Prestige Priority</span>
        <span className="opacity-70">&ensp;45 mins – 1 hr</span>
      </>
    ),
  },
];

const DURATION = 3500; // ms between slides
const FADE_MS = 350;   // fade-out + fade-in duration

export function DeliveryBanner() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      // fade out
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % SLIDES.length);
        // fade in
        setVisible(true);
      }, FADE_MS);
    }, DURATION);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[color:var(--noir)] border-b hairline overflow-hidden">
      <div
        className="container-luxe py-2.5 flex items-center justify-center text-[11px] md:text-[12px] tracking-[0.16em] uppercase text-[color:var(--gold)] text-center min-h-[2.25rem]"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-4px)",
          transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
        }}
      >
        {SLIDES[index].content}
      </div>
    </div>
  );
}
