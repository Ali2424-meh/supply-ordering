# Site-wide UI/UX Overhaul — SupplyHub

## Context

The user wants a full UI/UX overhaul across every account type (worker portal, supply-manager/admin area, login, manager/customer landings). Complaints: pages feel empty at current widths, everything is card-on-card, the product detail layout is ugly. Decisions gathered from the user:

- **Fill = less empty space** at current widths (worker shell stays max-w-7xl) — denser, richer layouts, not wider ones.
- **Full redesign** of structures, but keep the blue brand (`--color-brand #2563eb`, user chose blue yesterday) and the Bricolage Grotesque + Inter font pair.
- **All-blue success**: no green anywhere — success moments (submitted check, saved messages, Paid/Delivered, Active/SUCCEEDED pills) use the brand-blue family. Amber stays for waiting/warning, red for danger, zinc for neutral.
- **Light admin sidebar**: drop the dark zinc-900 admin chrome; one light visual system everywhere, active-nav = brand-tint pill (worker NavLink language).
- Product detail: "surprise me" → proper e-commerce PDP (spec below).

Design vocabulary replacing card-stacks: **split layouts (main + sticky rail)**, **tables on a single white surface**, **divided lists**, **sectioned panels with internal divide-y rows**.

## Hard rails (verified against the actual test suite — do not violate)

- `access.spec.ts` uses strict `page.locator("aside")` → exactly ONE `<aside>` on admin pages (the nav sidebar). New in-page side panels must be `<section>`/`<div>`.
- `helpers.ts#setFeature` uses strict `page.locator("form p")` on /admin/settings → exactly one `<p>` inside the settings `<form>`, containing "enabled"/"disabled"; button name `/(?:Enable|Disable) supply ordering/`. Page descriptions go outside the form / in non-`<p>` elements.
- `helpers.ts#login` waits on `form p[role='alert']`; inputs `input[name="email"]`/`input[name="password"]`; button "Sign in".
- `cleaner.spec.ts` uses strict `page.locator("header nav")` → exactly one `<nav>` in the worker header.
- PDP: exactly ONE `[data-testid=add-to-cart]` on the page (related-products strip must NOT use QuickAdd or `product-card`/`add-to-cart` testids). Body must show seed price "$18.95", description "Streak-free glass cleaner", link `/cleanersgallery.com.au/i`.
- `product-card` counts asserted (1 or 0) after search/filter — no new `product-card` testids anywhere.
- `cart-total` + `submit-order` testids stay in the always-in-DOM desktop block of CartView; mobile sticky bar stays `md:hidden` and testid-free. CartBadge aria-label format `Cart, ${count} items`.
- ProductForm: keep `data-testid="product-form"`, all `name=` attrs (`name`, `price`, `active` checkbox — e2e calls `.uncheck()`), button "Save product"; edit page h1 exactly `Edit {name}`. Admin catalogue product name must remain a visible `<a>` (SM-07 `a:visible` filter).
- Status radios: `status-select` testid wrapping `getByRole("radio", { name: "Paid"|"Contacted" })`; `status-note`, `save-status`. Worker order detail must have ZERO `status-select`.
- Keep verbatim copy: "From shelf to request, without the paperwork.", "Welcome back", "Everything you need, one request away.", "One request. A clear path from cart to site.", "Your details", link "Browse catalogue" (one per page on /supplies), category chips as links (e.g. "Chemicals"), `/no products found/i`, `/coming soon/i` on bookings, "Manager account"/"Customer account" (manager landing must NOT contain "Order requests"; customer landing must NOT contain "Supplies"), `import-row` containing "SUCCEEDED", refresh message `/Added \d+, updated \d+/`.
- All existing data-testids preserved: product-card, add-to-cart, qty, cart-line, cart-total, submit-order, order-card, order-number, status-timeline, status-select, status-note, save-status, admin-order-row (first `<a>` = detail link), admin-product-row, import-row, product-form, refresh-catalogue, dashboard-hero, supply-journey, journey-orbit, login-showcase, login-step-icon, worker-scroll-progress, `#cart-badge` id.
- A11y survives: min-h tap targets, aria-current, role=alert/status, sr-only labels, reduced-motion (`motion-reduce:hidden` on scroll progress; `journey-orbit` static under reduced motion). No horizontal overflow at 390px on /supplies, /supplies/catalogue, /supplies/cart, /admin/orders, /admin/account.
- `tests/unit/statuses.test.ts` hardcodes the current dot palette → MUST be updated in the same commit as the status palette change (only test change required).

## Phases (each = one commit; run the named specs after each)

### Phase 0 — Tokens + shared primitives
Files: `src/app/globals.css`, new `src/lib/ui.ts`, new `src/components/PageHeader.tsx`, new `src/components/PageTransition.tsx`, `src/app/(worker)/template.tsx`, `src/app/(admin)/template.tsx`.
- `@theme` additions: `--color-brand-soft: #dbeafe`, `--color-brand-deep: #1e40af`, `--color-warning: #b45309`, `--color-warning-tint: #fffbeb`, `--color-danger: #dc2626`, `--color-danger-tint: #fef2f2`. (No success token — success = brand.)
- `src/lib/ui.ts`: class-recipe helpers, NOT components (call sites mix server components, `motion.button`, `Link`): `cx()`, `btn("primary"|"secondary"|"ghost"|"danger", "sm"|"md"|"lg")` — primary is always `bg-brand hover:bg-brand-hover text-white`; `input("md"|"lg")` — canonical `min-h-11 rounded-lg border-zinc-300 shadow-sm focus:border-brand focus:ring-2 focus:ring-brand/20 …`; `panel()` = `rounded-2xl border border-zinc-200 bg-white shadow-sm`. All full literal strings (Tailwind v4 scanner).
- `PageHeader` (server): eyebrow?/title/description?/actions? — h1 `text-2xl font-semibold tracking-tight`, brand uppercase eyebrow. Single h1 rhythm for the whole app; titles stay plain text (heading-name assertions).
- `PageTransition` ("use client") absorbs the duplicated motion wrapper; both template.tsx files re-export it.

### Phase 1 — Status palette, all-blue (updates unit test in-commit)
Files: `src/lib/statuses.ts`, `src/components/StatusBadge.tsx`, `src/components/StatusTimeline.tsx`, `src/components/StatusUpdateForm.tsx`, `tests/unit/statuses.test.ts`.
- Replace `STATUS_COLORS` + regex `statusDotClass` with explicit full-literal `STATUS_STYLES: Record<OrderStatus,{dot,pill}>` (current `` `bg-${base}-500` `` construction is invisible to Tailwind's scanner). Keep `statusDotClass()` API delegating to the map.
- Palette (no green anywhere): SUBMITTED blue-500/blue-50+800 · CONTACTED sky-500/sky · AWAITING_PAYMENT amber-500/amber · PAID indigo-500/indigo · ORDERED_FROM_SUPPLIER violet-500/violet · READY_FOR_COLLECTION cyan-500/cyan · DELIVERED_COLLECTED blue-700/blue-100+blue-900 (deep terminal brand-blue) · CANCELLED zinc-400/zinc-100+600 · ISSUE_ON_HOLD red-500/red.
- StatusBadge drops its private DOT_COLORS/PILL_COLORS, reads STATUS_STYLES. StatusTimeline dots become per-status (fixes blue-dot-vs-colored-dot clash on order detail). StatusUpdateForm keeps radio semantics; Save → `btn("primary","md")`.
- Rewrite `statuses.test.ts` expectations to the new palette.

### Phase 2 — Button/input unification sweep (kill every `bg-zinc-900` button + every green)
Files: admin orders/catalogue filter forms + Apply buttons, catalogue "New product" link, settings toggle button class, ProductForm button class, `RefreshCatalogueButton` (success msg `text-emerald-700` → `text-brand`), `AccountForm` (success text → `text-brand`; inputs → `input()`), `admin/orders/error.tsx` (danger recipe), admin filter inputs/selects → `input()`.
- Admin catalogue Active pill → `bg-brand-tint text-brand-deep` / Inactive zinc. Imports SUCCEEDED → brand tint, FAILED → danger tint, RUNNING → warning tint.
- After this phase: `grep -rn "emerald\|green-\|teal-" src/` returns nothing; `grep -rn "bg-zinc-900" src/` returns only Toaster (dark toast stays — deliberate).

### Phase 3 — Login, role landings, submitted screen
Files: `(auth)/login/page.tsx`, `LoginForm.tsx`, `RoleLanding.tsx`, `supplies/cart/submitted/page.tsx`, `SubmittedCheck.tsx`.
- Login backdrop `#d1fae5` green radial → `var(--color-brand-soft)` wash. LoginForm inputs → `input("lg")`.
- RoleLanding: single card → split panel echoing login (brand gradient panel left, welcome/h1 + signed-in-as divided row + sign-out right). Keep "Manager account"/"Customer account"; never render "Order requests"/"Supplies" words here.
- SubmittedCheck SVG `stroke="#059669"` → `stroke="var(--color-brand)"`. Submitted page widens to max-w-2xl; add "What happens next" 3-row divided list (uses Phase-1 status dots) + ghost "Browse catalogue" link.

### Phase 4 — Worker home density
File: `src/app/(worker)/supplies/page.tsx` only.
- Below DashboardHero: `grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]`. Main = "My orders" (existing divided list + testids + Pagination). Right rail (`<div>`, sticky top-24): resume-cart card, "Browse by category" as a white panel with divide-y rows showing name + product count (swap `distinct` query for `prisma.product.groupBy({ by:["category"], where:{active:true}, _count })`), "Need help?" note row. SupplyJourney stays full-width below.

### Phase 5 — Catalogue polish + PDP redesign
Files: `supplies/catalogue/page.tsx`, `supplies/catalogue/[id]/page.tsx`, `supplies/catalogue/loading.tsx`, new `src/components/RelatedProducts.tsx` (optional inline).
- Catalogue: PageHeader + result count; CategoryFilter/ProductGrid/Pagination untouched. loading.tsx mirrors real grid columns.
- PDP (full-shell width, keep breadcrumb):
  - Hero split `lg:grid-cols-[7fr_5fr]`: LEFT gallery panel — white panel, soft canvas `bg-gradient-to-br from-brand-tint via-white to-zinc-50`, existing browser-fetched `<img id="product-hero">`, caption row (SKU chip + synced/manual microcopy). RIGHT sticky purchase panel (`lg:sticky lg:top-24`): category chip link → h1 → variant subtitle → price block (`text-3xl font-bold` + `/ unitSize`) → variant pills (existing Link+aria-current, selected = brand fill) → AddToCartButton unchanged (the ONLY add-to-cart) → reassurance divide-y list (no payment in app / ops confirms / track in My orders) → external store link verbatim.
  - Info band `lg:grid-cols-[2fr_1fr]`: "Details" panel (description prose; fallback sentence when null) + "Specifications" `<dl>` divide-y (SKU, unit size, category, variant, availability).
  - Related strip: same-category active products, `take: 5`, exclude same name; plain link cards (image/name/price), `data-testid="related-product"`; skip section when empty/null category.

### Phase 6 — Cart two-column
Files: `supplies/cart/page.tsx`, `CartView.tsx`.
- Page wrapper max-w-3xl → `max-w-6xl`. CartView root `lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8` (keep `pb-24 md:pb-0`).
- Left: h1 + item-count subtitle; lines move onto one white divide-y surface (line internals/testids/shake/undo untouched).
- Right sticky "Order summary" panel: Items(N) + Estimated total rows (`cart-total` + AnimatedMoney live here, always in DOM), alert slot, `submit-order` button (primary lg look), disclaimer, ghost "Continue browsing" link. Mobile sticky bar unchanged.
- Empty state keeps EmptyState + adds a primary link to the catalogue.

### Phase 7 — Worker order detail
File: `supplies/orders/[orderNumber]/page.tsx`.
- `grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]`. Left: PageHeader (eyebrow "Order request", h1 = order number, placed date) → items table on white surface (zinc-50 uppercase thead, divide-y, tfoot total, overflow-x-auto; drop `min-w-md`) → History h2 + StatusTimeline (per-status dots, showNotes={false}). Right sticky summary `<section>`: StatusBadge, dl rows (placed/items/total), full-width ReorderButton, ops help note. No status-select anywhere.

### Phase 8 — Admin shell: light sidebar + nav unification
Files: `(admin)/layout.tsx`, `AdminNav.tsx`, `admin/orders/[orderNumber]/page.tsx`.
- Sidebar goes light: `bg-white border-r border-zinc-200`, Brand without `onDark`, section eyebrows `text-zinc-400`; active item = `bg-brand-tint text-brand font-semibold` (same language as worker NavLink); hover `bg-zinc-100`. Mobile top bar + horizontal nav → light with brand underline active. Keep `<aside>` as the only aside, exact labels, aria-current, sign-out forms. Canvas `bg-zinc-100` → `var(--color-paper)`; main gets `mx-auto w-full max-w-6xl`.
- Admin order detail: right column stack = StatusUpdateForm + customer `<section>` panel (avatar circle, name, email `break-words`, phone, mailto ghost link) + order-meta dl. Left = Phase-7 table treatment + timeline with notes. Fix off-pattern `rounded-lg` card.

### Phase 9 — Admin list pages density
Files: `admin/orders/page.tsx`, `admin/catalogue/page.tsx`, `admin/imports/page.tsx`.
- Orders: PageHeader (filter Form in actions slot); nine floating status cards → one connected segmented rail (`flex divide-x rounded-xl border bg-white overflow-x-auto`; cell = dot + label + count; active = `bg-brand-tint` + brand bottom border). Keep the `<select name="status">` in the filter form (SM-02). Table/admin-order-row/mobile cards/Pagination unchanged.
- Catalogue: PageHeader (actions = New product); pills per Phase 2; name stays visible `<a>`.
- Imports: PageHeader with RefreshCatalogueButton in actions (its `role="status"` message stays adjacent/visible); pills per Phase 2.

### Phase 10 — Admin forms, settings, stubs
Files: `ProductForm.tsx`, `catalogue/new/page.tsx`, `catalogue/[id]/edit/page.tsx`, `admin/settings/page.tsx`, `admin/{bookings,customers,payouts}/page.tsx`.
- ProductForm: max-w-lg → max-w-2xl; one panel() with divide-y sections — Basics (name, variant/category 2-col), Description, Pricing & identifiers (price/SKU/unit 3-col), Media & links, Visibility (active checkbox as labeled switch-look row, still `input[name="active"]` type=checkbox). Inputs via `input()`; footer = alert slot + "Save product" primary. New/edit pages get PageHeader (edit h1 exactly `Edit {name}`; synced warning → warning-tint note bar).
- Settings: PageHeader + panel with divided rows; row 1 left = title/description (non-`<p>`, outside form), right = `<form>` with exactly its one `<p>` ("…is enabled/disabled.") + toggle button; row 2 = static "Catalogue sync — managed from Import history" link row.
- Stubs: PageHeader (proper h1 Bookings/Customers/Payouts, eyebrow "Platform") + dashed panel with icon + sentence containing "coming soon" + 2–3 static zinc placeholder rows. No fake data.

### Phase 11 — Final sweep + full verification
- EmptyState radius/tone alignment; heading audit (all h1 via PageHeader; h2s one consistent style); kill straggler `rounded`/plain-`border` utilities; final greps (`emerald|green-|teal-`, `bg-zinc-900`).

## Verification

Per phase: `npm run lint && npm run typecheck && npm test` + the named Playwright specs (`npx playwright test tests/e2e/<spec>` — free port 3000 first: stop dev server, restart after; `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION=1` needed for AI-run e2e).
Final: full `npm run check` (24 unit — statuses.test.ts updated — 44 integration untouched, 22 e2e) + production build. Then drive the real app (dev server + Playwright screenshots like last session's scratchpad/shots.mjs) at 390/768/1280/1600 px across: login, manager+customer landings, worker home, catalogue, PDP (with + without variants/image/description), cart, submitted, worker order detail, admin orders+detail, catalogue+new/edit, imports, settings, bookings, account. Inspect screenshots before claiming done.

## Riskiest changes
1. Cart restructure (testids must stay in always-in-DOM desktop block; invalid-line alert + mobile bar interplay) — move markup, don't rewrite handlers.
2. Status palette (Tailwind can't see interpolated classes — full literals only; unit test updated same commit).
3. PDP related strip (a second add-to-cart/product-card testid breaks strict-mode clicks in two specs).
4. Admin `<aside>` strictness (any decorative aside fails four tests).
5. Settings `form p` strictness (gates cleaner.spec + access.spec via setFeature helper).

## Notes
- Also save this design as `docs/superpowers/specs/2026-07-17-ui-overhaul-design.md` and commit it before implementation (project convention; brainstorming skill step).
- Reuse existing: formatAud, EmptyState, Pagination, SearchBar, StatusBadge/Timeline APIs, MotionProvider, Toaster, seed logins (cleaner@example.com etc., password123).
- AGENTS.md: consult `node_modules/next/dist/docs/` before using unfamiliar Next APIs.
