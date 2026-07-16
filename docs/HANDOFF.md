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
| 4. Cart pure functions | ⬜ | | |
| 5. Shopify mapping | ⬜ | | |
| 6. Auth.js + guards + login | ⬜ | | |
| 7. Cart actions + int-test harness | ⬜ | | |
| 8. Order submission action | ⬜ | | |
| 9. Order email | ⬜ | | |
| 10. Status updates | ⬜ | | |
| 11. Product CRUD + audit | ⬜ | | |
| 12. Catalogue sync action | ⬜ | | |
| 13. App shells + nav | ⬜ | | responsive constraint applies from here on |
| 14. Cleaner catalogue UI | ⬜ | | |
| 15. Cart UI + submit flow | ⬜ | | |
| 16. Cleaner orders UI | ⬜ | | |
| 17. Admin orders UI | ⬜ | | |
| 18. Admin catalogue UI | ⬜ | | |
| 19. Playwright E2E suite | ⬜ | | |
| 20. Full verification sweep | ⬜ | | |

## Deferred minor findings (triage at final review)

- `src/app/layout.tsx` metadata still says "Create Next App" (Task 1 review).
- `prisma/seed.ts` error path could `process.exit(1)` (Task 2 review, spec-matching).
- `OrderItem.productId` deliberately has no FK constraint (snapshot design) —
  application code must not write dangling ids (Task 2 review, design note).
