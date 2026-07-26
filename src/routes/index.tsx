    </section>
  );
}

function FeatureGrid() {
  const feats = [
    { icon: Heart, title: "Handmade with love", copy: "Every piece stitched, twisted and finished by our artisans in India." },
    { icon: Gem, title: "Crafted to last", copy: "Everlasting florals — no wilting, no waste. A keepsake forever." },
    { icon: Package, title: "Signature packaging", copy: "Matte black magnetic boxes with soft pink tissue and gold ribbon." },
    { icon: Award, title: "Personalized gifting", copy: "Add handwritten notes, custom colors and bespoke arrangements." },
  ];
  return (
    <section className="border-y hairline">
      <div className="container-luxe py-20 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {feats.map((f) => (
          <div key={f.title} className="text-center md:text-left">
            <div className="inline-flex h-12 w-12 rounded-full bg-gold-gradient text-[color:var(--noir)] items-center justify-center mb-4">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-xl mb-2">{f.title}</h3>
            <p className="text-sm text-[color:var(--muted-foreground)]">{f.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PackagingBand() {
  return (
    <section className="container-luxe py-24 md:py-32">
      <div className="grid lg:grid-cols-2 gap-12 md:gap-20 items-center">
        <div className="order-2 lg:order-1">
          <p className="eyebrow mb-4">Signature Packaging</p>
          <h2 className="font-serif text-4xl md:text-5xl leading-tight">The unboxing is part of the gift.</h2>
          <ul className="mt-8 space-y-4 text-[color:var(--muted-foreground)]">
            <li className="flex gap-3"><span className="text-[color:var(--gold)]">✦</span> Matte black magnetic gift box with gold foil detailing</li>
            <li className="flex gap-3"><span className="text-[color:var(--gold)]">✦</span> Soft blush pink tissue lining and gold satin ribbon</li>
            <li className="flex gap-3"><span className="text-[color:var(--gold)]">✦</span> Complimentary handwritten note card with every order</li>
            <li className="flex gap-3"><span className="text-[color:var(--gold)]">✦</span> Custom personalization & bespoke wrapping on request</li>
          </ul>
        </div>
        <div className="order-1 lg:order-2 relative">
          <img src={giftboxImg} loading="lazy" decoding="async" alt="OMORA BLOOMS luxury signature packaging — matte black magnetic gift box with gold foil detailing" className="w-full aspect-square object-cover rounded-3xl hairline border" />
        </div>
      </div>
    </section>
  );
}

function DeliveryBand() {
  const opts = [
    { title: "Same-Day Delivery", copy: "Bengaluru city — order before 12 PM.", accent: "Local" },
    { title: "Next-Day Pan-India", copy: "Delivered to your doorstep across India.", accent: "India" },
    { title: "Airport Delivery", copy: "Meet them at arrivals with a luxury bouquet.", accent: "Signature" },
    { title: "International Shipping", copy: "Selected countries — DHL & FedEx.", accent: "Worldwide" },
  ];
  return (
    <section className="container-luxe pb-20">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {opts.map((o) => (
          <div key={o.title} className="glass-card rounded-2xl p-6">
            <p className="eyebrow">{o.accent}</p>
            <h3 className="font-serif text-xl mt-2">{o.title}</h3>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-2">{o.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="container-luxe pb-24">
      <div className="relative overflow-hidden rounded-3xl p-10 md:p-16 text-center hairline border glass-card">
        <div className="absolute -inset-40 bg-gradient-to-br from-[color:var(--gold)]/20 via-transparent to-[color:var(--blush)]/10 blur-3xl -z-10" />
        <p className="eyebrow mb-4">Let's make it unforgettable</p>
        <h2 className="font-serif text-4xl md:text-6xl max-w-3xl mx-auto leading-tight">Bespoke gifting, crafted just for you</h2>
        <p className="mt-5 text-[color:var(--muted-foreground)] max-w-xl mx-auto">Chat with our artisans on WhatsApp for custom colors, personalized notes, corporate orders and bespoke arrangements.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={whatsappLink("Hi OMORA BLOOMS! I'd like a custom order.")} target="_blank" rel="noopener noreferrer" className="btn-gold px-8 py-3.5 rounded-full text-sm inline-flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
          < md:pb-8 -mt-6 md:-mt-10">
      <Link
        to="/products/$slug"
        params={{ slug: "eternal-bond-luxury-kit" }}
        className="group relative block overflow-hidden rounded-3xl hairline border ring-1 ring-[color:var(--gold)]/40 shadow-[0_30px_80px_-30px_rgba(200,162,74,0.55)] transition-shadow duration-500 hover:shadow-[0_40px_100px_-30px_rgba(200,162,74,0.7)]"
      >
        <div className="relative aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9]">
          <img
            src={eternalBondBanner}
            alt="The Eternal Bond Luxury Kit — royal luxury gift combo for new mother and newborn baby | OMORA BLOOMS"
            loading="lazy"
            decoding="async"
            width={1600}
            height={900}
            sizes="(min-width: 768px) 90vw, 100vw"
            className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.04]"
          />
          {/* Stronger mobile scrim keeps text readable over imagery */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/30 md:bg-gradient-to-r md:from-black/85 md:via-black/45 md:to-transparent" />

          {/* Desktop-only floating badge; mobile badge lives inline below to
              avoid overlapping the eyebrow/heading. */}
          <span className="hidden md:inline-flex absolute top-6 left-8 items-center gap-1.5 rounded-full bg-gold-gradient text-[color:var(--noir)] text-[10px] tracking-[0.22em] uppercase font-semibold px-3 py-1.5 shadow-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--noir)]" /> Most Gifted for Naming Ceremonies
          </span>

          <div className="absolute inset-0 flex items-end md:items-center">
            <div className="p-5 sm:p-8 md:p-14 w-full md:max-w-2xl">
              <span className="md:hidden inline-flex items-center gap-1.5 rounded-full bg-gold-gradient text-[color:var(--noir)] text-[9px] tracking-[0.2em] uppercase font-semibold px-2.5 py-1 shadow-lg mb-3">
                <span className="h-1 w-1 rounded-full bg-[color:var(--noir)]" /> Most Gifted · Naming Ceremonies
              </span>
              <p className="eyebrow mb-2 md:mb-4 text-[color:var(--gold)] text-[0.6rem] md:text-[0.7rem]">Exclusively for Mom &amp; Baby</p>
              <h3 className="font-serif text-[1.75rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-6xl md:leading-[1.05] tracking-tight">
                The Eternal Bond<br className="hidden sm:block" /> Luxury Kit
              </h3>
              <p className="mt-3 md:mt-5 text-[13px] md:text-base text-white/85 max-w-lg leading-relaxed line-clamp-3 md:line-clamp-none">
                A royal luxury gift combo thoughtfully curated for both the New Mother and the Newborn Baby — everlasting crochet bouquet, mother recovery wellness, baby essentials, in a signature OMORA heritage box.
              </p>
              <div className="mt-5 md:mt-8 flex flex-wrap items-center gap-2.5 md:gap-3">
                <span className="btn-gold inline-flex items-center gap-2 px-6 md:px-7 py-3 md:py-3.5 rounded-full text-sm font-medium">
                  Buy Now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="btn-outline-gold inline-flex items-center gap-2 px-6 md:px-7 py-3 md:py-3.5 rounded-full tex
