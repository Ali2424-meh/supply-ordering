# Supply Ordering — Technical Design

**Date:** 2026-07-16
**Status:** Approved
**Functional spec:** [`docs/Supply_Ordering.md`](../../Supply_Ordering.md)

## Summary

A full-stack, greenfield web app implementing the Supply Ordering functional
specification: field workers (Cleaners) browse a product catalogue synced from
the Shopify store at cleanersgallery.com.au, build a cart, and submit order
requests; Supply managers and Administrators manage the catalogue and move
orders through a nine-status fulfilment workflow. Payment happens offline.

Goals beyond the functional spec: polished animations as a showcase,
efficiency, reliability, and comprehensive automated tests mapped to the
spec's scenario tables.

## Decisions

| Area | Decision |
| --- | --- |
| Scope | Supply module only; non-supply admin areas are placeholder pages so role-visibility scenarios (SM-02, A-03) are demonstrable |
| Framework | Next.js (App Router, TypeScript), Tailwind CSS v4 |
| Data | Prisma + PostgreSQL (local dev via Docker Compose) |
| Data flow | Server Components query Prisma directly; mutations are Zod-validated Server Actions. No REST/tRPC layer |
| Auth | Auth.js v5 (credentials), role enum on `User`, session via Prisma adapter |
| Animations | Motion (Framer Motion) in client components |
| Email | Resend + React Email; dev mode captures payloads to disk instead of sending |
| Catalogue sync | Admin-triggered server action pulling Shopify's public paginated `products.json` (verified working, HTTP 200); optional cron route later |
| Testing | Vitest (unit + integration against a test Postgres) + Playwright E2E mapped 1:1 to spec scenario IDs |

## Architecture & Project Structure

```
src/
  app/
    (auth)/login/                    # sign-in
    (worker)/supplies/               # Cleaner portal (guard: CLEANER)
      page.tsx                       # Supplies home: own orders, newest first
      catalogue/                     # browse + search/filter (URL params)
      catalogue/[id]/                # product detail
      cart/                          # cart + submit
      orders/[orderNumber]/          # order detail (read-only)
    (admin)/admin/                   # guard: SUPPLY_MANAGER | ADMIN
      orders/                        # all requests: search/filter/sort
      orders/[orderNumber]/          # detail: status updates + internal notes
      catalogue/                     # active + inactive products
      catalogue/new/  [id]/edit/     # manual create/edit
      imports/                       # catalogue import history + refresh button
    api/auth/[...nextauth]/
  lib/
    auth.ts                          # Auth.js config + guard()/requireRole()
    prisma.ts
    cart.ts                          # cart rules (pure functions)
    sync/shopify.ts                  # fetch + map products.json (pure mapping)
    email/                           # React Email templates + send wrapper
  actions/                           # server actions (Zod-validated)
    cart.ts  orders.ts  products.ts  sync.ts
  components/                        # client components incl. all animations
```

Structural rules:

- **Route groups enforce role boundaries.** The `(worker)` layout guard
  requires role `CLEANER`; `(admin)` requires `SUPPLY_MANAGER` or `ADMIN`.
  Managers and Customers hitting supply URLs are redirected (spec M-02, U-01).
  The global feature toggle is checked in the same guards (C-02, SM-01).
- **Every server action independently re-checks** session → role → account
  not disabled → feature toggle, via a single `guard()` helper called first.
  The UI hides buttons; the server enforces rules.
- **Business logic lives in pure functions** (`lib/cart.ts`,
  `lib/sync/shopify.ts`) so it is unit-testable without a database.
- Administrators see the same supply screens as Supply managers plus
  placeholder nav entries (Bookings, Customers, Payouts → "coming soon").

## Data Model

Prisma models (plus Auth.js session tables):

| Model | Fields (key ones) |
| --- | --- |
| `User` | name, email, phone, passwordHash, `role` enum (CLEANER, SUPPLY_MANAGER, ADMIN, MANAGER, CUSTOMER), `disabled` bool |
| `Product` | name, variantName, category, description, imageUrl, `priceCents` int, sku, unitSize, productUrl, `active` bool, `source` (SYNCED, MANUAL), `shopifyVariantId` unique nullable |
| `PriceHistory` | productId, priceCents, recordedAt |
| `CartItem` | userId + productId (unique pair), quantity |
| `Order` | `orderNumber` "OR-00001" from a Postgres sequence, userId, `status` 9-value enum, totalCents, createdAt |
| `OrderItem` | orderId, productId (nullable), nameSnapshot, variantSnapshot, priceCentsSnapshot, quantity |
| `OrderEvent` | orderId, fromStatus, toStatus, note, actorId, createdAt |
| `ImportRun` | startedAt, finishedAt, status, added, updated, deactivated, errorMessage |
| `AuditEvent` | actorId, entity ("Product"), entityId, action (CREATED, UPDATED, ACTIVATED, DEACTIVATED), details JSON, createdAt — satisfies SM-08/SM-09 |
| `Setting` | key unique, value — feature toggle `supplyOrderingEnabled`, editable on an admin settings page (ADMIN role only) |

Order statuses: Submitted, Contacted, Awaiting payment, Paid, Ordered from
supplier, Ready for collection, Delivered / collected, Cancelled,
Issue / on hold. Staff may set any status (no transition restrictions).

Key decisions:

- **Money is integer cents** end-to-end; formatted as AUD with two decimals
  only at render (`Money` component). No floating-point money.
- **Cart is server-side** (DB rows per user), so it survives navigation and
  devices (C-10) and submission can re-validate every line in one transaction.
- **Order submission is one Prisma transaction:** re-check user not disabled
  (C-09) → feature enabled → re-fetch each product and reject inactive/missing
  (C-06) → reject duplicate lines → snapshot name/variant/price into
  `OrderItem` → assign orderNumber from a DB sequence → create OrderEvent
  (→ Submitted) → clear cart. Email sends after commit; email failure logs
  but never rolls back the order.
- **Sync upserts on `shopifyVariantId`:** each Shopify variant = one Product
  row. Missing variants → `active: false` (never deleted). Price change →
  update Product + append PriceHistory row. Returned products are updated and
  reactivated per store data (S-04). Manual products (`source: MANUAL`) are
  never touched by sync. Staff may edit `SYNCED` products, but the store is
  the source of truth: the next sync reasserts store data over such edits.

## Screens & Components

**Cleaner portal** (`/supplies`) — mobile-first:

| Screen | Components | Notes |
| --- | --- | --- |
| Supplies home | `OrderList` → `OrderCard` (status badge, total, date) | Newest first; "New order" CTA |
| Catalogue | `SearchBar`, `CategoryFilter` chips, `ProductGrid` → `ProductCard` | Server-filtered via URL params `?q=&category=`; active products only |
| Product detail | `ProductDetail`, `AddToCartButton` with quantity stepper | External link to product page on cleanersgallery.com.au |
| Cart | `CartLine` (qty stepper, remove), `CartSummary`, `SubmitOrderButton` | Live total; submit → confirmation explaining staff will contact for payment |
| Order detail | `OrderItemsTable` (snapshot prices), `StatusTimeline` | Read-only |

Persistent `CartBadge` in the portal header on every screen.

**Admin area** (`/admin`) — desktop-first tables:

| Screen | Components | Notes |
| --- | --- | --- |
| Order requests | `OrdersTable` — search (worker/order #), filter (status), sort (date/total) | URL-param driven, paginated |
| Order detail | Worker contact card, items table, `StatusUpdateForm` (status select + optional note), `OrderHistory` | Any status settable |
| Catalogue | `ProductsTable` — search, filter incl. active state, sort | Active + inactive with badges |
| Product create/edit | `ProductForm` — Zod schema shared with server action | Every create/edit/activate/deactivate writes an `AuditEvent` (SM-08/SM-09); edits to synced products last until the next sync |
| Import history | `ImportRunsTable` + "Refresh catalogue" button | Live progress state, then result counts |

Shared: `StatusBadge` (all 9 statuses, color-coded), `Money`, `EmptyState`,
`ConfirmDialog`.

All list/search/filter/sort state lives in **URL search params**, not client
state — server components re-render with filtered Prisma queries. Linkable,
back-button friendly, no state-sync bugs.

## Animations

Every animation is purposeful, GPU-friendly (transform/opacity only), and
respects `prefers-reduced-motion` via `useReducedMotion()` (collapses to
fades). Built with Motion in client components.

Signature moments:

1. **Add-to-cart flight** — a product-image ghost flies from the button into
   the header `CartBadge`, which spring-pulses and increments.
2. **Cart layout animations** — `AnimatePresence` animates removed rows out
   while remaining rows and the total glide into place; the total is an
   animated numeric counter.
3. **Submit sequence** — button morphs to spinner → confirmation screen draws
   an animated SVG checkmark and the order number counts up.
4. **Status timeline reveal** — timeline nodes and connecting line stagger in;
   in admin, a saved status update animates onto the timeline live.

Ambient polish: staggered fade-up on catalogue grid and order lists (60 ms,
once per load); `layoutId` shared-element transition from `ProductCard` image
to detail hero; category chips with sliding active pill; 150 ms portal page
transitions via `template.tsx`; skeleton shimmer in `loading.tsx` per route;
button press-scale; admin row hover elevation and animated sort arrows.

Discipline: durations 150–400 ms; no animation-induced layout shift on first
paint (no CLS); admin data-critical actions animate confirmation feedback only.

## Error Handling & Reliability

Validation at every boundary: every server action parses input with Zod
(schemas shared with client forms) and calls `guard()` before any DB access.

| Failure | Behavior |
| --- | --- |
| Cart submit containing inactive/removed product | Transaction rejects; cart highlights invalid lines with animated shake + prompt to remove (C-06) |
| Double-submit race | Button disables optimistically; cart is cleared inside the transaction, so the second submit finds an empty cart and no-ops with a friendly message |
| Shopify sync network/shape error | ImportRun records `FAILED` + message; existing data untouched; Shopify payload is Zod-validated (external APIs are inputs) |
| Concurrent sync trigger | Advisory lock; second trigger sees "refresh already in progress" |
| Email send failure | Order still succeeds (post-commit send); failure logged for staff visibility |
| Unexpected server error | Per-section `error.tsx` boundaries with retry UI; a crash in catalogue never takes down the cart |
| Unauthorized direct URL or crafted POST (M-02) | Layout guard redirects; server actions independently throw |

Principles: all multi-step writes are single Prisma transactions; order
numbers from a DB sequence (no read-modify-write races); money never leaves
integer cents until render; the server is the only source of truth.

## Testing

Spec scenario tables are the acceptance checklist; spec IDs appear in test
names (e.g., `test("C-06: submit cart with inactive product …")`).

- **Unit (Vitest, no DB):** `lib/cart.ts` (quantities, duplicate rejection,
  totals in cents); `lib/sync/shopify.ts` mapping, variant flattening,
  deactivate-missing, price-change detection (fixtures captured from the real
  store); Zod schemas; RBAC helpers against the spec's View Matrix.
- **Integration (Vitest + Docker Postgres, per-run schema):** the order
  submission transaction (snapshots, sequencing, cart clearing, inactive and
  disabled-user rejection); sync upsert behavior (S-01–S-04); feature toggle
  off → every supply action throws.
- **E2E (Playwright, seeded users per role):** C-01–C-10, SM-01–SM-11,
  A-01–A-03, M-01–M-02, U-01. Email assertions via Resend dev-mode disk
  capture. Sync E2E hits a local mock of the Shopify endpoint (recorded
  fixtures) — never the live store.

CI order: lint → typecheck → unit → integration → E2E.

## Out of Scope

Per the functional spec: in-app payment, automatic ordering at the external
store, live inventory, customer ordering, recurring orders. Additionally out
of scope for this design: production hosting choice (Prisma keeps Postgres
portable), scheduled cron sync (the action is cron-ready; wiring a schedule
is a follow-up), and real non-supply admin features (placeholders only).
