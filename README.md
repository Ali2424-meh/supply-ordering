# SupplyHub — Supply Ordering

SupplyHub is a responsive supply-request platform for field cleaners and
operations staff. Cleaners browse a live catalogue, manage a cart, and submit
requests. Supply managers and administrators review those requests, maintain
the catalogue, and move orders through fulfilment. Payment remains offline.

**Live application:** [supply-ordering-jade.vercel.app](https://supply-ordering-jade.vercel.app)

## Documentation

- [Complete project documentation](docs/PROJECT_DOCUMENTATION.md)
- [Word document](docs/SupplyHub_Project_Documentation.docx)
- [Functional specification](docs/Supply_Ordering.md)
- [Technical design](docs/superpowers/specs/2026-07-16-supply-ordering-design.md)
- [Implementation handoff](docs/HANDOFF.md)

## Technology

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Motion, Auth.js, Prisma 6,
PostgreSQL/Neon, Resend, Vitest, and Playwright.

## Local setup

```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Local seed accounts use
`password123`; production credentials are supplied separately and are never
stored in git.

## Verification

```bash
npm run check
npm run build
```

`npm run check` runs linting, TypeScript checks, unit tests, integration tests,
and the Playwright browser suite.

## Deployment

Production is deployed through Vercel with a Neon Postgres database. The
deployment build applies committed migrations through Neon's unpooled URL,
generates Prisma Client, and builds Next.js.

See the [deployment runbook](docs/PROJECT_DOCUMENTATION.md#deployment-runbook)
for required environment variables and operational notes.

> Prisma is intentionally pinned to v6. Migrating to Prisma v7 requires a
> separate configuration and datasource upgrade.
