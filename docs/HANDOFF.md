# Session Handoff — Supply Ordering

Purpose: let ANY agent or developer (Claude Code, GPT, human) resume this build
cold. Read this file, then the plan, then continue from the first task not
marked complete below.

## Key documents

1. **Functional spec:** `docs/Supply_Ordering.md`
2. **Technical design:** `docs/superpowers/specs/2026-07-16-supply-ordering-design.md`
3. **Implementation plan (source of truth for tasks):** `docs/superpowers/plans/2026-07-16-supply-ordering.md`
   — 20 tasks, each with TDD steps, complete code, and a commit. Its
   **Global Constraints** section binds every task (incl. responsive
   mobile/tablet/desktop requirement).

## How this is being executed

- Branch: `feature/supply-ordering` (branched from `main` at b5f27c2).
- One task at a time, in order. Per task: implement (TDD where specified) →
  commit → review against the task's plan text → fix Critical/Important
  findings → mark complete here.
- Commit after every task. Verification commands per task are in the plan.

## Environment

- Docker Postgres: `docker compose up -d` → DBs `supply`, `supply_test`,
  `supply_e2e` on localhost:5432 (user/pass `supply`/`supply`).
- `.env` is git-ignored; copy `.env.example` and fill (dev values in plan Task 1).
- Seeded logins (all password `password123`): cleaner@example.com,
  cleaner2@example.com, disabled@example.com (disabled), supply@example.com,
  admin@example.com, manager@example.com, customer@example.com.
- **Prisma is pinned to v6.x** — seed/migration settings have been moved to
  `prisma.config.ts`, but v7 also requires moving the schema's inline
  datasource URL. Do not upgrade without completing that migration.

## Task progress

| Task | Status | Commits | Notes |
| --- | --- | --- | --- |
| 1. Scaffold + Docker + deps | ✅ complete | a018ec3 | `@/*` alias kept (plan typo fixed); review approved |
| 2. Prisma schema + seed | ✅ complete | 42d8bc5 (+ fixups) | Prisma v7→v6 downgrade; prisma CLI moved to devDependencies; review approved |
| 3. Format + status helpers | ✅ complete | f03a562 | review approved |
| 4. Cart pure functions | ✅ complete | 44c9313 | review approved |
| 5. Shopify mapping | ✅ complete | 604a2e8 | exact plan match; 14 unit tests pass; local review approved (Claude CLI limit prevented second review) |
| 6. Auth.js + guards + login | ✅ complete | 689be78 + 04912b1 | E2E fixed the same-action cookie visibility redirect; all role landings verified; Claude CLI still limited |
| 7. Cart actions + int-test harness | ✅ complete | f2f700e + 9af243c | review fix atomically caps merged quantities at 999; 6 DB integration tests pass; Vitest 4 harness stubs `next/cache`; Claude CLI still limited |
| 8. Order submission action | ✅ complete | 62b9edf | transaction rechecks auth state/toggle, snapshots items, clears cart; per-user lock prevents concurrent double-submit; 13 integration tests pass; Claude CLI still limited |
| 9. Order email | ✅ complete | ebe25e2 | React Email + capture/Resend sender; configurable verified `EMAIL_FROM`; Resend errors surface and post-commit failures cannot roll back orders; 15 unit + 14 integration tests pass; Claude CLI still limited |
| 10. Status updates | ✅ complete | b00cb36 | manager/admin authorization, trimmed internal notes, locked status history updates; 18 integration tests pass; local review approved |
| 11. Product CRUD + audit | ✅ complete | 09b592a | shared Zod input, transactional create/edit, audit + activation events, price history; 23 integration tests pass; local review approved |
| 12. Catalogue sync action | ✅ complete | df0dd80 + 5b51ed0 | atomic apply + price history/deactivation; dedicated single-connection session lock; transient live-store retry/timeout handling; interrupted-run cleanup; 28 integration tests pass |
| 13. App shells + nav | ✅ complete | 40cddb9 | responsive worker/admin navigation, role guards/placeholders, animated cart/status/shared UI, atomic admin toggle; metadata deferred finding resolved |
| 14. Cleaner catalogue UI | ✅ complete | 8b11923 | responsive active-only grid, URL search/category filters, detail page, quantity stepper + reduced-motion-aware cart flight; build/lint/typecheck pass |
| 15. Cart UI + submit flow | ✅ complete | 3222953 + 6c9a6c0 | responsive animated cart/total/removal, inactive-line shake, pending-safe submission/confirmation, visible guard errors; reduced-motion respected |
| 16. Cleaner orders UI | ✅ complete | 51f0adb | responsive own-order list/detail, DB-scoped ownership, immutable snapshots, note-free animated history; build/lint/typecheck pass |
| 17. Admin orders UI | ✅ complete | ce73492 | responsive all-worker order table/search/filter/sort, contact/detail, status+note form, internal timeline, error boundary; build/lint/typecheck pass |
| 18. Admin catalogue UI | ✅ complete | 363234a | responsive active/inactive catalogue + filters, accessible shared create/edit form, guarded refresh and import history; full unit/integration/build checks pass |
| 19. Playwright E2E suite | ✅ complete | cbf2fdb | isolated reset/seeded DB, managed store + email fixtures, C/SM/A/M/U/S scenarios and mobile overflow smoke; 19 E2E tests pass |
| 20. Full verification sweep | ✅ complete | 40c7b14 | `npm run check` green: lint, typecheck, 17 unit, 28 integration, 19 E2E; production build green; live sync added 4,225 variants and cleaner category filter smoke passed |

## Post-completion hardening (2026-07-17)

- **Commit:** `7ac6ff2` (`fix: production hardening and catalogue pagination`).
- **Authorization and privacy:** role guards now reload the current user from
  the database; disabled users cannot authenticate; Server Actions use a fresh
  authorization read; submission confirmation validates order ownership.
- **Order integrity:** cart mutations share the submission user lock, product
  rows are locked while an order snapshot is made, and excessive totals are
  rejected before they can overflow PostgreSQL `Int` columns.
- **Input safety:** product fields and internal notes have bounded lengths;
  manually entered product/image links accept HTTP(S) only.
- **Catalogue correctness and sync:** Shopify option data populates unit size,
  descriptions decode HTML entities, duplicate variant payloads are collapsed,
  unchanged records are not rewritten, and sync counts now reflect real
  changes. A repeated live refresh reported `added 0, updated 0, deactivated 0`.
- **Performance:** cleaner catalogue is limited to 48 cards/page, admin lists
  to 50 rows/page, cleaner order history to 20 cards/page, queries select only
  needed fields, and common filters/sorts have database indexes. With 4,225
  live variants, the cleaner catalogue dropped from 4,225 cards/~28,030 DOM
  nodes/~22.9s to 48 cards/434 DOM nodes/~1.6s; admin catalogue dropped from
  4,227 rows/~39,152 nodes/~4.6s to 50 rows/1,077 nodes/~0.94s.
- **UI and accessibility:** products are explicitly grouped by category;
  responsive mobile cards replace oversized admin tables; category filters
  horizontally scroll on small screens; active navigation, labels, focus
  states, image fallbacks, error feedback, page titles, and empty/pending states
  were improved. Planned Motion animations remain, with reduced-motion support.
- **Tooling:** Prisma configuration no longer uses the deprecated
  `package.json#prisma` key.
- **Verification:** lint, typecheck, Prisma validation, 21 unit tests, 33
  integration tests, 19 Playwright browser tests, and the optimized production
  build pass.

## Deferred minor findings (triage at final review)

- `OrderItem.productId` deliberately has no FK constraint (snapshot design) —
  application code must not write dangling ids (Task 2 review, design note).
- `npm audit` reports three moderate findings through Next 16.2.10's vendored
  PostCSS 8.4.31. The Next.js maintainer states this is build-time only and does
  not affect Next.js users; `npm audit fix --force` proposes an unsafe downgrade
  to Next 9, so no forced override or downgrade was applied. Track the upstream
  Next.js stable dependency update.

## Final review status

- Local diff/spec review found no remaining blocking or important issue after
  the post-completion hardening pass.
- **Claude Code independent verification completed 2026-07-17:**
  - Re-ran the full suite independently: lint clean, typecheck clean,
    22/22 unit, 33/33 integration, 19/19 Playwright E2E (with user-consented
    `supply_e2e` reset — Prisma v6 requires
    `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` when an AI agent runs
    `migrate reset`; humans running `npm run test:e2e` are unaffected).
  - Independent whole-branch code review (b5f27c2..HEAD): **READY TO MERGE** —
    zero Critical, zero Important findings. Spot-checked 11 spec scenario IDs
    against implementation + tests, all ✅. Reviewer specifically validated the
    hardening commit's concurrency design (FOR UPDATE user lock serializing
    double-submits, FOR SHARE product locks during snapshot, atomic sequence
    numbering, post-commit email isolation).
  - Remaining minors closed: clampQuantity non-finite test added, note-trimming
    comment added. One cosmetic item accepted as-is: admin layout renders a
    "supply ordering is disabled" shell when the feature is off (child pages
    independently 404 — no data exposure).
