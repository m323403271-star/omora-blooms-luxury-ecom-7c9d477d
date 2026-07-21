import { whatsappLink } from "@/lib/whatsapp";
import { MessageCircle } from "lucide-react";

export function WhatsAppFab() {
  return (
    <a
      href={whatsappLink("Hi OMORA BLOOMS!")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-30 h-14 w-14 rounded-full grid place-items-center shadow-2xl transition-transform hover:scale-110"
      style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
    >
      <MessageCircle className="h-6 w-6 text-white" />
      <span className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping" style={{ background: "#25D366" }} />
    </a>
  );
}
