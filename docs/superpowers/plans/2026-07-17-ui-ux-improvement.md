# UI/UX Improvement Pass Implementation Plan

> **For agentic workers:** Execute task-by-task with review between tasks. Checkboxes track steps.

**Goal:** Make ordering effortless (fewer taps, forgiving, glanceable) and give the app a distinctive visual identity — without straying from the functional spec.

**Architecture:** No schema changes. One new server action (`reorderFromOrder`). Everything else is presentation + interaction work in existing components/pages. Tailwind v4 design tokens via `@theme` in `globals.css`.

**Tech:** next/font (Bricolage Grotesque + Inter), lucide-react, Motion (existing), Tailwind v4.

## Global Constraints (binding, in addition to the original plan's)

- **All 30 spec scenarios stay green.** `npm run check` (lint, typecheck, 22 unit, 33 integration, 19 E2E) must pass at the end of every task. E2E selectors/assertions MAY be updated to match new UI, but each scenario's *semantics* must remain (e.g., C-03 still proves search + category filtering of active-only products).
- **Preserve every existing `data-testid`** (`product-card`, `add-to-cart`, `qty`, `cart-line`, `submit-order`, `cart-total`, `order-number`, `order-card`, `status-timeline`, `admin-order-row`, `status-select` [may become a hidden select or radio group — keep the testid on the interactive element], `status-note`, `save-status`, `admin-product-row`, `product-form`, `refresh-catalogue`, `import-row`).
- Server actions keep their exact signatures; `guardAction` discipline unchanged; money stays integer cents; responsive at 375/768/1280.
- Animations: Motion only, transform/opacity, 150–400ms, `reducedMotion="user"` global config stays.
- Brand: name **SupplyHub**; primary `--color-brand` deep teal-green `#0d5c4d` (hover `#0a4a3e`, tint `#e8f2ef`); background warm paper `#faf9f6`; keep emerald success accents. Headings font variable `--font-display` (Bricolage Grotesque), body `--font-sans` (Inter).
- No new heavy dependencies. Allowed additions: `lucide-react` only. Toast/undo built in-house (small `Toaster` context + Motion).

---

### Task A: Design-system foundation + shared components

**Files:** `src/app/globals.css` (@theme tokens), `src/app/layout.tsx` (fonts via next/font, metadata already "Supply Ordering" → title "SupplyHub"), new `src/components/Brand.tsx` (logo mark: lucide `Sparkles` or `Package` in brand square + wordmark), restyle `src/components/StatusBadge.tsx` (tinted pill + colored dot, keep label text exact), `EmptyState.tsx` (icon, friendlier copy prop-compatible), `Skeleton.tsx` (shimmer on paper tone), `CartBadge.tsx` (lucide `ShoppingCart`, keep `id="cart-badge"` and count animation), new `src/components/Toaster.tsx` (context provider + `useToast()` returning `toast(message, { actionLabel?, onAction? })`; AnimatePresence bottom-center stack, auto-dismiss 8s; mount in root layout).

**Verify:** `npm run check` fully green (E2E: no testids changed here). Commit.

### Task B: Worker portal — flow + restyle

**Files:** worker layout header (Brand, nav pills, lucide icons), `supplies/page.tsx` home (greeting with user first name, resume-cart card when cartCount>0 linking to cart, category shortcut chips from active categories, order list below), catalogue page + `ProductGrid.tsx` (quick-add: stepper + add button on card via a new `QuickAdd.tsx` client component reusing `addToCart`; flight animation retained from card position; card hover image zoom `scale-105`), `SearchBar.tsx` new client component (debounced 300ms, updates `?q=` via `router.replace`, no submit button — **update E2E C-03 accordingly**), product detail restyle, `CartView.tsx` (sticky bottom summary bar on `<md`, remove → `toast` with Undo re-adding via `addToCart(productId, prevQty)`), confirmation page restyle.

**Verify:** `npm run check` green (E2E C-03/C-05/C-10 selectors updated if needed, semantics identical). Commit.

### Task C: Reorder

**Files:** `src/actions/orders.ts` add:
```ts
export async function reorderFromOrder(orderId: string): Promise<{ ok: boolean; skipped: number; error?: string }>
```
Guard `["CLEANER"]`; order must belong to the user; for each OrderItem with a `productId` that resolves to an **active** product, upsert cart line (quantity add, clamped); count `skipped` = items whose product is missing/inactive; empty result (all skipped) → `ok: false` with message. Integration tests in `tests/integration/reorder.test.ts`: happy path, ownership rejection (other user's order), inactive-product skipping, all-skipped error. UI: "Reorder" button (lucide `RotateCcw`) on cleaner order detail + order cards; on success toast "Added N items to cart" + navigate to cart; on partial, toast mentions skipped count.

**Verify:** new integration tests pass + `npm run check` green. Commit.

### Task D: Admin — pulse + restyle

**Files:** admin layout (dark `bg-zinc-900` sidebar, brand mark, lucide nav icons, active-route highlight; mobile: top bar + horizontal nav — keep responsive constraint), `admin/orders/page.tsx` add status summary cards row above table (counts by status via one `groupBy` query; each card links `?status=X`; active card highlighted; "All" card clears), `StatusUpdateForm.tsx` — replace bare select with color-chip radio group (one chip per status using STATUS_COLORS; keep `data-testid="status-select"` on the group and ensure Playwright `selectOption` calls in E2E are updated to click chips instead), tables restyle (header contrast, row hover, mobile card fallbacks already exist — retune to new palette), imports + catalogue pages restyled to match.

**Verify:** `npm run check` green (E2E SM-05/A-02 updated for chip select). Commit.

### Task E: Sweep + data cleanup

- Full `npm run check`; fix any drift.
- Truncate local dev ImportRun rows: `docker compose exec db psql -U supply -d supply -c 'TRUNCATE "ImportRun";'` (user request — prod starts empty anyway).
- Update `docs/HANDOFF.md` (improvement pass recorded). Commit.

### Task F: Vercel deploy prep (code only — interactive steps happen with the user)

**Files:** `package.json` build script → `prisma generate && next build`; `vercel.json` (optional cron for catalogue refresh — skip, YAGNI); README deploy section documenting env vars: `DATABASE_URL` (Neon pooled URL), `AUTH_SECRET` (generate), `EMAIL_MODE=resend`, `RESEND_API_KEY`, `EMAIL_FROM` (verified sender), `TEAM_INBOX`, `CATALOGUE_BASE_URL`. Ensure nothing imports Node-only APIs in edge contexts (auth uses bcryptjs in authorize — runs in Node runtime route, fine). `next build` must pass locally.

**Verify:** local `npm run build` green. Commit.

Then interactive (controller + user): create GitHub repo & push → Neon DB → Vercel project + env vars → `prisma migrate deploy` + seed against Neon → live sync → smoke test.
