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
- **Prisma is pinned to v6.x** — v7 requires `prisma.config.js` and breaks the
  schema's inline datasource URL. Do not upgrade without migrating config.

## Task progress

| Task | Status | Commits | Notes |
| --- | --- | --- | --- |
| 1. Scaffold + Docker + deps | ✅ complete | a018ec3 | `@/*` alias kept (plan typo fixed); review approved |
| 2. Prisma schema + seed | ✅ complete | 42d8bc5 (+ fixups) | Prisma v7→v6 downgrade; prisma CLI moved to devDependencies; review approved |
| 3. Format + status helpers | ✅ complete | f03a562 | review approved |
| 4. Cart pure functions | ✅ complete | 44c9313 | review approved |
| 5. Shopify mapping | ✅ complete | 604a2e8 | exact plan match; 14 unit tests pass; local review approved (Claude CLI limit prevented second review) |
| 6. Auth.js + guards + login | ✅ complete | 689be78 | typecheck/lint/unit/build pass; credentials flow manually verified; local review approved (Claude CLI still limited) |
| 7. Cart actions + int-test harness | ✅ complete | f2f700e + 9af243c | review fix atomically caps merged quantities at 999; 6 DB integration tests pass; Vitest 4 harness stubs `next/cache`; Claude CLI still limited |
| 8. Order submission action | ✅ complete | 62b9edf | transaction rechecks auth state/toggle, snapshots items, clears cart; per-user lock prevents concurrent double-submit; 13 integration tests pass; Claude CLI still limited |
| 9. Order email | ✅ complete | ebe25e2 | React Email + capture/Resend sender; configurable verified `EMAIL_FROM`; Resend errors surface and post-commit failures cannot roll back orders; 15 unit + 14 integration tests pass; Claude CLI still limited |
| 10. Status updates | ✅ complete | b00cb36 | manager/admin authorization, trimmed internal notes, locked status history updates; 18 integration tests pass; local review approved |
| 11. Product CRUD + audit | ✅ complete | 09b592a | shared Zod input, transactional create/edit, audit + activation events, price history; 23 integration tests pass; local review approved |
| 12. Catalogue sync action | ✅ complete | df0dd80 | atomic apply + price history/deactivation; transaction-scoped advisory lock avoids pooled-connection bug; import success/failure tracking; 28 integration tests pass |
| 13. App shells + nav | ✅ complete | 40cddb9 | responsive worker/admin navigation, role guards/placeholders, animated cart/status/shared UI, atomic admin toggle; metadata deferred finding resolved |
| 14. Cleaner catalogue UI | ⬜ | | |
| 15. Cart UI + submit flow | ⬜ | | |
| 16. Cleaner orders UI | ⬜ | | |
| 17. Admin orders UI | ⬜ | | |
| 18. Admin catalogue UI | ⬜ | | |
| 19. Playwright E2E suite | ⬜ | | |
| 20. Full verification sweep | ⬜ | | |

## Deferred minor findings (triage at final review)

- `prisma/seed.ts` error path could `process.exit(1)` (Task 2 review, spec-matching).
- `OrderItem.productId` deliberately has no FK constraint (snapshot design) —
  application code must not write dangling ids (Task 2 review, design note).
