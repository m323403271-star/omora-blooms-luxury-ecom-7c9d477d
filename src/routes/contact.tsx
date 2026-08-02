import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MessageCircle, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CONTACT_EMAIL, WHATSAPP_DISPLAY, whatsappLink } from "@/lib/whatsapp";
import { Logo } from "@/components/site/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    ...pageSeo({
      path: "/contact",
      title: 'Contact — OMORA BLOOMS',
      description: 'Get in touch with the OMORA BLOOMS concierge team for luxury gifting, bespoke bouquets and corporate orders.',
    }),
  }),
  component: ContactPage,
});

function ContactPage() {
  const [state, setState] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from("inquiries").insert({
      name: state.name.trim(),
      email: state.email.trim(),
      phone: state.phone.trim() || null,
      subject: state.subject.trim() || null,
      message: state.message.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast.error("Something went wrong. Please try WhatsApp.");
      return;
    }
    toast.success("Thank you! Our concierge team will be in touch shortly.");
    setState({ name: "", email: "", phone: "", subject: "", message: "" });
  }

  return (
    <div>
      <section className="container-luxe py-16 md:py-20 text-center">
        <Logo size="lg" className="justify-center" />
        <p className="eyebrow mt-6 mb-4">Contact</p>
        <h1 className="font-serif text-5xl md:text-6xl">We'd love to hear from you</h1>
        <p className="text-[color:var(--muted-foreground)] mt-4 max-w-xl mx-auto">Chat with our concierge team for bespoke orders, corporate gifting or anything else.</p>
      </section>

      <section className="container-luxe pb-24 grid lg:grid-cols-5 gap-10">
        <form onSubmit={submit} className="lg:col-span-3 glass-card rounded-3xl p-6 md:p-10 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Full name" value={state.name} onChange={(v) => setState({ ...state, name: v })} required />
            <Field label="Email" type="email" value={state.email} onChange={(v) => setState({ ...state, email: v })} required />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Phone (optional)" value={state.phone} onChange={(v) => setState({ ...state, phone: v })} />
            <Field label="Subject" value={state.subject} onChange={(v) => setState({ ...state, subject: v })} />
          </div>
          <Field label="Your message" value={state.message} onChange={(v) => setState({ ...state, message: v })} required textarea />
          <button disabled={submitting} className="btn-gold w-full py-3.5 rounded-full text-sm disabled:opacity-60">
            {submitting ? "Sending..." : "Send message"}
          </button>
        </form>

        <aside className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <p className="eyebrow mb-3">Concierge</p>
            <div className="space-y-4 text-sm">
              <a href={whatsappLink("Hello OMORA BLOOMS!")} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 hover:text-[color:var(--gold)]">
                <MessageCircle className="h-5 w-5 text-[color:var(--gold)] mt-0.5" />
                <div>
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-[color:var(--muted-foreground)]">{WHATSAPP_DISPLAY}</p>
                </div>
              </a>
              <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-start gap-3 hover:text-[color:var(--gold)]">
                <Mail className="h-5 w-5 text-[color:var(--gold)] mt-0.5" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-[color:var(--muted-foreground)]">{CONTACT_EMAIL}</p>
                </div>
              </a>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-[color:var(--gold)] mt-0.5" />
                <div>
                  <p className="font-medium">Call</p>
                  <p className="text-[color:var(--muted-foreground)]">Mon-Sat · 10 AM – 7 PM IST</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[color:var(--gold)] mt-0.5" />
                <div>
                  <p className="font-medium">Atelier</p>
                  <p className="text-[color:var(--muted-foreground)]">Bengaluru, India — ships worldwide.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <p className="eyebrow mb-2">Bespoke Orders</p>
            <p className="font-serif text-2xl">Tell us your vision.</p>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-2">Custom color palettes, personalized notes, corporate gifting, and wedding keepsakes — we make it happen.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required, textarea,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; textarea?: boolean;
}) {
  const cls = "w-full bg-transparent hairline border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]";
  return (
    <label className="block">
      <span className="block text-xs tracking-widest uppercase text-[color:var(--muted-foreground)] mb-2">{label}{required && " *"}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} required={required} rows={5} className={cls} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className={cls} />
      )}
    </label>
  );
}
