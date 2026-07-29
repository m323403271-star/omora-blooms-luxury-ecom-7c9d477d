# Project Overview

An e-commerce storefront built with [Lovable](https://lovable.dev). Features a shop, product/collection browsing, cart, orders, auth, and static pages (FAQ, shipping, returns, privacy, terms).

## Stack

- **Framework**: TanStack Start (SSR) + React 19
- **Routing**: TanStack Router (file-based, `src/routes/`)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Auth & DB**: Supabase (`src/integrations/supabase/`)
- **Build**: Vite 8 via `@lovable.dev/vite-tanstack-config`
- **Package manager**: Bun

## Running the app

```bash
bun install
bunx --bun vite dev --host 0.0.0.0 --port 5000 --strictPort
```

The workflow "Start application" runs this automatically.

**Important Replit notes:**
- The Lovable vite config defaults to `host: "::"` (IPv6), which fails in this environment (`EAFNOSUPPORT`). Always pass `--host 0.0.0.0` to force IPv4.
- Do not pass `--strictPort false` — Replit blocks most ports, causing Vite to scan thousands of them endlessly.
- Port 5000 = webview (main app preview).

## Project structure

```
src/
  routes/          # File-based pages (index, shop, products.$slug, collections.$slug, cart, auth, etc.)
  components/      # UI components
  integrations/    # Supabase client + auth
  hooks/           # Custom React hooks
  lib/             # Utilities
supabase/
  migrations/      # DB schema migrations
  config.toml      # Supabase project config
```

## Environment

Supabase credentials are in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).

## User preferences

<!-- Add any preferences here -->
