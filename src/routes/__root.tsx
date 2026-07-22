import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CartDrawer } from "@/components/site/CartDrawer";
import { WhatsAppFab } from "@/components/site/WhatsAppFab";
import { RefCapture } from "@/components/site/RefCapture";
import logoAsset from "@/assets/omora-logo.asset.json";

function NotFoundComponent() {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow mb-4">404</p>
        <h1 className="font-serif text-5xl mb-4">Page not found</h1>
        <p className="text-sm text-[color:var(--muted-foreground)] mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-gold inline-block px-8 py-3 rounded-full text-sm">Return home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-3xl mb-3">This page didn't load</h1>
        <p className="text-sm text-[color:var(--muted-foreground)] mb-6">
          Something went wrong. You can try again or head back home.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="btn-gold px-6 py-2.5 rounded-full text-sm"
          >Try again</button>
          <a href="/" className="btn-outline-gold px-6 py-2.5 rounded-full text-sm">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "OMORA BLOOMS — Luxury Handmade Bouquets That Last Forever" },
      { name: "description", content: "OMORA BLOOMS crafts luxury handmade crochet & pipe cleaner bouquets, mother recovery kits, baby essentials and premium gift boxes. Handmade with love, crafted to last forever." },
      { name: "author", content: "OMORA BLOOMS" },
      { name: "theme-color", content: "#0B0B0B" },
      { property: "og:title", content: "OMORA BLOOMS — Luxury Handmade Bouquets That Last Forever" },
      { property: "og:description", content: "OMORA BLOOMS crafts luxury handmade crochet & pipe cleaner bouquets, mother recovery kits, baby essentials and premium gift boxes. Handmade with love, crafted to last forever." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: logoAsset.url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "OMORA BLOOMS — Luxury Handmade Bouquets That Last Forever" },
      { name: "twitter:description", content: "OMORA BLOOMS crafts luxury handmade crochet & pipe cleaner bouquets, mother recovery kits, baby essentials and premium gift boxes. Handmade with love, crafted to last forever." },
      { name: "twitter:image", content: logoAsset.url },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/533c9fec-a0ee-4af6-b723-e8b6418f7eb4/id-preview-d8737fa4--9b70daa9-6a74-48da-91ba-28f391def9de.lovable.app-1784644894065.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/533c9fec-a0ee-4af6-b723-e8b6418f7eb4/id-preview-d8737fa4--9b70daa9-6a74-48da-91ba-28f391def9de.lovable.app-1784644894065.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/jpeg", href: logoAsset.url },
      { rel: "apple-touch-icon", href: logoAsset.url },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
        <CartDrawer />
        <WhatsAppFab />
        <RefCapture />
        <Toaster theme="dark" position="bottom-left" toastOptions={{ style: { background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" } }} />
      </CartProvider>
    </QueryClientProvider>
  );
}
