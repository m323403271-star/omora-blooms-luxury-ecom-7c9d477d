import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/site/Logo";
import heroBouquet from "@/assets/hero-bouquet.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — OMORA BLOOMS" },
      { name: "description", content: "OMORA BLOOMS crafts luxury handmade bouquets, mother recovery kits, baby essentials, and premium gift boxes with love in India." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      <section className="container-luxe py-16 md:py-24 text-center">
        <Logo size="xl" className="justify-center" />
        <p className="eyebrow mt-6 mb-4">Our Story</p>
        <h1 className="font-serif text-5xl md:text-7xl leading-tight">Handmade with Love,<br />Crafted to Last Forever.</h1>
      </section>

      <section className="container-luxe grid lg:grid-cols-2 gap-12 md:gap-20 items-center pb-24">
        <img src={heroBouquet} alt="OMORA BLOOMS atelier" className="w-full aspect-square object-cover rounded-3xl hairline border" />
        <div>
          <p className="eyebrow mb-4">The OMORA Philosophy</p>
          <h2 className="font-serif text-4xl md:text-5xl">A gift that stays forever</h2>
          <p className="mt-6 text-[color:var(--muted-foreground)] leading-relaxed">
            OMORA BLOOMS was created for one reason — to give the world a way to say the most beautiful things without them ever fading. Every bouquet, hamper and gift box is handmade in India by our skilled artisans, using premium yarn, pipe cleaner, and materials curated with obsessive care.
          </p>
          <p className="mt-4 text-[color:var(--muted-foreground)] leading-relaxed">
            We're not a floral brand. We're a memory brand — building keepsakes that outlast the moment.
          </p>
        </div>
      </section>

      <section className="border-y hairline">
        <div className="container-luxe py-20 grid md:grid-cols-3 gap-8">
          {[
            { n: "01", t: "Design", c: "Every collection is designed in-house, drawing from luxury florals, textile art and Indian craft heritage." },
            { n: "02", t: "Handcraft", c: "Each bloom is crocheted or shaped by hand. No two pieces are ever exactly the same." },
            { n: "03", t: "Luxury Finishing", c: "Signature matte black boxes, gold satin ribbons and handwritten notes complete the experience." },
          ].map((s) => (
            <div key={s.n}>
              <p className="text-gold-gradient font-serif text-4xl">{s.n}</p>
              <h3 className="font-serif text-2xl mt-3">{s.t}</h3>
              <p className="text-sm text-[color:var(--muted-foreground)] mt-2 leading-relaxed">{s.c}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-luxe py-20 text-center">
        <p className="eyebrow mb-4">Let's Connect</p>
        <h2 className="font-serif text-4xl md:text-5xl max-w-2xl mx-auto">Have a special occasion in mind?</h2>
        <p className="text-[color:var(--muted-foreground)] mt-4 max-w-lg mx-auto">Our concierge team designs bespoke pieces for weddings, corporate gifting and once-in-a-lifetime moments.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/contact" className="btn-gold px-8 py-3 rounded-full text-sm">Contact us</Link>
          <Link to="/shop" className="btn-outline-gold px-8 py-3 rounded-full text-sm">Explore the shop</Link>
        </div>
      </section>
    </div>
  );
}
