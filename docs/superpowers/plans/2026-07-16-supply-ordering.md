# Supply Ordering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Supply Ordering app: cleaners browse a Shopify-synced catalogue, cart, and submit order requests; supply managers/admins manage catalogue and fulfilment.

**Architecture:** Next.js App Router with Server Components querying Prisma directly and Zod-validated Server Actions for all mutations. Role-guarded route groups `(worker)` and `(admin)`; pure business logic in `lib/`; Motion animations in client components only.

**Tech Stack:** Next.js 16 (TypeScript, Tailwind v4, src dir), Prisma + PostgreSQL (Docker), Auth.js v5 (credentials, JWT sessions), Motion, Resend + React Email, Zod, Vitest, Playwright.

## Global Constraints

- Money is **integer cents** everywhere; render via `formatAud()` only (AUD, 2 dp).
- The 9 order statuses (Prisma enum `OrderStatus`): `SUBMITTED, CONTACTED, AWAITING_PAYMENT, PAID, ORDERED_FROM_SUPPLIER, READY_FOR_COLLECTION, DELIVERED_COLLECTED, CANCELLED, ISSUE_ON_HOLD`.
- Roles (Prisma enum `Role`): `CLEANER, SUPPLY_MANAGER, ADMIN, MANAGER, CUSTOMER`.
- Order numbers: `OR-` + 5-digit zero-padded Postgres sequence value (e.g. `OR-00001`).
- **Every server action calls a guard first** (`guardAction`) — session, role, not-disabled, feature toggle — before touching the DB.
- Products are deactivated, never deleted. Order items keep name/variant/price snapshots.
- All catalogue/order list state lives in URL search params, server-filtered.
- Animations: Motion (`motion/react`), transform/opacity only, 150–400 ms, whole app wrapped in `<MotionConfig reducedMotion="user">`.
- **Responsive on mobile, tablet, and desktop** (user requirement): every screen must be usable at 375px, 768px, and 1280px widths. Worker portal is mobile-first. Admin area: sidebar collapses to a top bar / stacked nav below `md:`; tables must not overflow the viewport — wrap them in `overflow-x-auto` or stack cells on small screens. Use Tailwind responsive prefixes (`sm: md: lg:`), no fixed pixel widths on containers.
- Test names include spec scenario IDs, e.g. `test("C-06: …")`.
- External catalogue base URL comes from env `CATALOGUE_BASE_URL` (default `https://cleanersgallery.com.au`); tests never hit the live store.
- Email: `EMAIL_MODE=capture` writes JSON to `.email-capture/` instead of sending via Resend.
- Commit after every task (steps show the commands).

---

### Task 1: Scaffold project, Docker Postgres, dependencies

**Files:**
- Create: entire Next.js scaffold in `/Users/iyah/Projects/supply-ordering` (`src/app/...`), `docker-compose.yml`, `docker/init-dbs.sql`, `.env`, `.env.example`
- Modify: `package.json` (scripts), `.gitignore`

**Interfaces:**
- Produces: running dev server, Postgres on `localhost:5432` with databases `supply`, `supply_test`, `supply_e2e`; env vars `DATABASE_URL`, `AUTH_SECRET`, `CATALOGUE_BASE_URL`, `EMAIL_MODE`, `TEAM_INBOX`, `RESEND_API_KEY`.

- [ ] **Step 1: Scaffold Next.js in the existing repo**

`docs/` and `.git` are on create-next-app's allowlist, so scaffolding in place works:

```bash
cd /Users/iyah/Projects/supply-ordering
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: scaffold completes; `src/app/page.tsx` exists.

- [ ] **Step 2: Install dependencies**

```bash
npm i prisma @prisma/client next-auth@beta zod bcryptjs motion resend @react-email/components react-email
npm i -D vitest @vitejs/plugin-react @playwright/test tsx @types/bcryptjs
npx playwright install chromium
```

- [ ] **Step 3: Docker Postgres with three databases**

Create `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: supply
      POSTGRES_PASSWORD: supply
      POSTGRES_DB: supply
    ports: ["5432:5432"]
    volumes:
      - ./docker/init-dbs.sql:/docker-entrypoint-initdb.d/init-dbs.sql
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

Create `docker/init-dbs.sql`:

```sql
CREATE DATABASE supply_test;
CREATE DATABASE supply_e2e;
```

Run: `docker compose up -d` then `docker compose exec db psql -U supply -c '\l'`
Expected: `supply`, `supply_test`, `supply_e2e` listed.

- [ ] **Step 4: Env files**

Create `.env` (and `.env.example` with the same keys, secrets blanked):

```env
DATABASE_URL="postgresql://supply:supply@localhost:5432/supply"
AUTH_SECRET="dev-secret-change-me"
CATALOGUE_BASE_URL="https://cleanersgallery.com.au"
EMAIL_MODE="capture"
TEAM_INBOX="supplies@example.com"
RESEND_API_KEY=""
```

Append to `.gitignore`: `.env`, `.email-capture/`.

- [ ] **Step 5: Package scripts**

In `package.json` set:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run tests/unit",
  "test:int": "DATABASE_URL=postgresql://supply:supply@localhost:5432/supply_test prisma migrate deploy && DATABASE_URL=postgresql://supply:supply@localhost:5432/supply_test vitest run tests/integration",
  "test:e2e": "playwright test",
  "db:migrate": "prisma migrate dev",
  "db:seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 6: Verify and commit**

Run: `npm run dev` — expected: app on http://localhost:3000. Stop it.

```bash
git add -A && git commit -m "chore: scaffold Next.js app, Docker Postgres, deps"
```

---

### Task 2: Prisma schema, migration, order-number sequence, seed

**Files:**
- Create: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/prisma.ts`
- Modify: generated migration SQL (append sequence)

**Interfaces:**
- Produces: all models below; sequence `order_number_seq`; seeded users (all roles, password `password123`), `Setting` key `supplyOrderingEnabled` = `"true"`; singleton `prisma` from `src/lib/prisma.ts`.

- [ ] **Step 1: Write the schema**

Create `prisma/schema.prisma`:

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum Role { CLEANER SUPPLY_MANAGER ADMIN MANAGER CUSTOMER }
enum ProductSource { SYNCED MANUAL }
enum OrderStatus { SUBMITTED CONTACTED AWAITING_PAYMENT PAID ORDERED_FROM_SUPPLIER READY_FOR_COLLECTION DELIVERED_COLLECTED CANCELLED ISSUE_ON_HOLD }
enum ImportStatus { RUNNING SUCCEEDED FAILED }
enum AuditAction { CREATED UPDATED ACTIVATED DEACTIVATED }

model User {
  id           String     @id @default(cuid())
  name         String
  email        String     @unique
  phone        String?
  passwordHash String
  role         Role
  disabled     Boolean    @default(false)
  cartItems    CartItem[]
  orders       Order[]
}

model Product {
  id               String         @id @default(cuid())
  name             String
  variantName      String?
  category         String?
  description      String?
  imageUrl         String?
  priceCents       Int
  sku              String?
  unitSize         String?
  productUrl       String?
  active           Boolean        @default(true)
  source           ProductSource
  shopifyVariantId String?        @unique
  priceHistory     PriceHistory[]
  cartItems        CartItem[]
}

model PriceHistory {
  id         String   @id @default(cuid())
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  priceCents Int
  recordedAt DateTime @default(now())
}

model CartItem {
  id        String  @id @default(cuid())
  userId    String
  user      User    @relation(fields: [userId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id])
  quantity  Int
  @@unique([userId, productId])
}

model Order {
  id          String       @id @default(cuid())
  orderNumber String       @unique
  userId      String
  user        User         @relation(fields: [userId], references: [id])
  status      OrderStatus  @default(SUBMITTED)
  totalCents  Int
  createdAt   DateTime     @default(now())
  items       OrderItem[]
  events      OrderEvent[]
}

model OrderItem {
  id                 String  @id @default(cuid())
  orderId            String
  order              Order   @relation(fields: [orderId], references: [id])
  productId          String?
  nameSnapshot       String
  variantSnapshot    String?
  priceCentsSnapshot Int
  quantity           Int
}

model OrderEvent {
  id         String       @id @default(cuid())
  orderId    String
  order      Order        @relation(fields: [orderId], references: [id])
  fromStatus OrderStatus?
  toStatus   OrderStatus
  note       String?
  actorId    String?
  createdAt  DateTime     @default(now())
}

model ImportRun {
  id           String       @id @default(cuid())
  startedAt    DateTime     @default(now())
  finishedAt   DateTime?
  status       ImportStatus
  added        Int          @default(0)
  updated      Int          @default(0)
  deactivated  Int          @default(0)
  errorMessage String?
}

model AuditEvent {
  id        String      @id @default(cuid())
  actorId   String
  entity    String
  entityId  String
  action    AuditAction
  details   Json?
  createdAt DateTime    @default(now())
}

model Setting {
  key   String @id
  value String
}
```

- [ ] **Step 2: Migrate, then append the order-number sequence**

```bash
npx prisma migrate dev --name init --create-only
```

Append to the generated `prisma/migrations/*_init/migration.sql`:

```sql
CREATE SEQUENCE order_number_seq START 1;
```

Then: `npx prisma migrate dev`
Expected: migration applied, client generated.

- [ ] **Step 3: Prisma singleton**

Create `src/lib/prisma.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Seed script**

Create `prisma/seed.ts`:

```ts
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const USERS: Array<{ name: string; email: string; role: Role; disabled?: boolean }> = [
  { name: "Cara Cleaner", email: "cleaner@example.com", role: "CLEANER" },
  { name: "Dan Disabled", email: "disabled@example.com", role: "CLEANER", disabled: true },
  { name: "Wendy Worker", email: "cleaner2@example.com", role: "CLEANER" },
  { name: "Sam Supply", email: "supply@example.com", role: "SUPPLY_MANAGER" },
  { name: "Ada Admin", email: "admin@example.com", role: "ADMIN" },
  { name: "Mo Manager", email: "manager@example.com", role: "MANAGER" },
  { name: "Cust Omer", email: "customer@example.com", role: "CUSTOMER" },
];

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  for (const u of USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, disabled: u.disabled ?? false },
      create: { ...u, disabled: u.disabled ?? false, passwordHash },
    });
  }
  await prisma.setting.upsert({
    where: { key: "supplyOrderingEnabled" },
    update: {},
    create: { key: "supplyOrderingEnabled", value: "true" },
  });
  await prisma.product.upsert({
    where: { shopifyVariantId: "seed-1" },
    update: {},
    create: {
      name: "Glass Cleaner 5L", variantName: "5L", category: "Chemicals",
      description: "Streak-free glass cleaner.", priceCents: 1895,
      sku: "GC-5L", productUrl: "https://cleanersgallery.com.au/products/glass-cleaner",
      active: true, source: "SYNCED", shopifyVariantId: "seed-1",
    },
  });
  await prisma.product.upsert({
    where: { shopifyVariantId: "seed-2" },
    update: {},
    create: {
      name: "Retired Mop", category: "Hardware", priceCents: 2500,
      active: false, source: "SYNCED", shopifyVariantId: "seed-2",
    },
  });
}

main().finally(() => prisma.$disconnect());
```

- [ ] **Step 5: Run seed, verify, commit**

Run: `npm run db:seed` then `npx prisma studio` (spot-check users) or:
`docker compose exec db psql -U supply -d supply -c 'SELECT email, role FROM "User";'`
Expected: 7 users.

```bash
git add -A && git commit -m "feat: prisma schema, order-number sequence, seed data"
```

---

### Task 3: Formatting + status helpers (TDD)

**Files:**
- Create: `src/lib/format.ts`, `src/lib/statuses.ts`, `tests/unit/format.test.ts`
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: `formatAud(cents: number): string` (e.g. `1895 → "$18.95"`), `formatOrderNumber(n: number): string` (`1 → "OR-00001"`), `STATUS_LABELS: Record<OrderStatus, string>`, `STATUS_ORDER: OrderStatus[]` (the 9 statuses in spec table order).

- [ ] **Step 1: Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { environment: "node", testTimeout: 20000, fileParallelism: false },
});
```

(`fileParallelism: false` keeps integration tests from racing on the shared test DB.)

- [ ] **Step 2: Write failing tests**

Create `tests/unit/format.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { formatAud, formatOrderNumber } from "../../src/lib/format";
import { STATUS_LABELS, STATUS_ORDER } from "../../src/lib/statuses";

describe("formatAud", () => {
  test("formats cents as AUD with two decimals", () => {
    expect(formatAud(1895)).toBe("$18.95");
    expect(formatAud(0)).toBe("$0.00");
    expect(formatAud(100000)).toBe("$1,000.00");
  });
});

describe("formatOrderNumber", () => {
  test("pads to five digits with OR- prefix", () => {
    expect(formatOrderNumber(1)).toBe("OR-00001");
    expect(formatOrderNumber(12345)).toBe("OR-12345");
    expect(formatOrderNumber(123456)).toBe("OR-123456");
  });
});

describe("statuses", () => {
  test("all nine statuses have labels, in spec order", () => {
    expect(STATUS_ORDER).toHaveLength(9);
    expect(STATUS_ORDER[0]).toBe("SUBMITTED");
    expect(STATUS_LABELS.ISSUE_ON_HOLD).toBe("Issue / on hold");
    expect(STATUS_LABELS.DELIVERED_COLLECTED).toBe("Delivered / collected");
    for (const s of STATUS_ORDER) expect(STATUS_LABELS[s]).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run tests/unit/format.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 4: Implement**

Create `src/lib/format.ts`:

```ts
const aud = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });

export function formatAud(cents: number): string {
  return aud.format(cents / 100);
}

export function formatOrderNumber(n: number): string {
  return `OR-${String(n).padStart(5, "0")}`;
}
```

Create `src/lib/statuses.ts`:

```ts
import type { OrderStatus } from "@prisma/client";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  SUBMITTED: "Submitted",
  CONTACTED: "Contacted",
  AWAITING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  ORDERED_FROM_SUPPLIER: "Ordered from supplier",
  READY_FOR_COLLECTION: "Ready for collection",
  DELIVERED_COLLECTED: "Delivered / collected",
  CANCELLED: "Cancelled",
  ISSUE_ON_HOLD: "Issue / on hold",
};

export const STATUS_ORDER = Object.keys(STATUS_LABELS) as OrderStatus[];

export const STATUS_COLORS: Record<OrderStatus, string> = {
  SUBMITTED: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-sky-100 text-sky-800",
  AWAITING_PAYMENT: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  ORDERED_FROM_SUPPLIER: "bg-violet-100 text-violet-800",
  READY_FOR_COLLECTION: "bg-teal-100 text-teal-800",
  DELIVERED_COLLECTED: "bg-green-100 text-green-800",
  CANCELLED: "bg-zinc-200 text-zinc-700",
  ISSUE_ON_HOLD: "bg-red-100 text-red-800",
};
```

- [ ] **Step 5: Run tests, commit**

Run: `npx vitest run tests/unit/format.test.ts` — Expected: PASS (3 tests).

```bash
git add -A && git commit -m "feat: money/order-number formatting and status metadata"
```

---

### Task 4: Cart rules — pure functions (TDD)

**Files:**
- Create: `src/lib/cart.ts`, `tests/unit/cart.test.ts`

**Interfaces:**
- Produces:
  - `type CartLine = { productId: string; quantity: number; priceCents: number }`
  - `lineTotalCents(line: CartLine): number`
  - `cartTotalCents(lines: CartLine[]): number`
  - `clampQuantity(q: number): number` (int, min 1, max 999)
  - `hasDuplicateLines(lines: { productId: string }[]): boolean`
  - `findInvalidLines(lines: { productId: string }[], products: { id: string; active: boolean }[]): string[]` — productIds that are missing or inactive

- [ ] **Step 1: Write failing tests**

Create `tests/unit/cart.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import {
  cartTotalCents, clampQuantity, findInvalidLines, hasDuplicateLines, lineTotalCents,
} from "../../src/lib/cart";

const line = (productId: string, quantity: number, priceCents: number) =>
  ({ productId, quantity, priceCents });

describe("totals", () => {
  test("line total multiplies price by quantity in cents", () => {
    expect(lineTotalCents(line("a", 3, 1895))).toBe(5685);
  });
  test("cart total sums line totals; empty cart is 0", () => {
    expect(cartTotalCents([line("a", 2, 1000), line("b", 1, 550)])).toBe(2550);
    expect(cartTotalCents([])).toBe(0);
  });
});

describe("clampQuantity", () => {
  test("floors decimals, clamps to 1..999", () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(-5)).toBe(1);
    expect(clampQuantity(2.9)).toBe(2);
    expect(clampQuantity(5000)).toBe(999);
  });
});

describe("hasDuplicateLines", () => {
  test("detects duplicate productIds", () => {
    expect(hasDuplicateLines([{ productId: "a" }, { productId: "a" }])).toBe(true);
    expect(hasDuplicateLines([{ productId: "a" }, { productId: "b" }])).toBe(false);
  });
});

describe("findInvalidLines (C-06 basis)", () => {
  const products = [{ id: "a", active: true }, { id: "b", active: false }];
  test("flags inactive and missing products", () => {
    expect(findInvalidLines(
      [{ productId: "a" }, { productId: "b" }, { productId: "ghost" }], products,
    )).toEqual(["b", "ghost"]);
  });
  test("all-active cart has no invalid lines", () => {
    expect(findInvalidLines([{ productId: "a" }], products)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/cart.test.ts` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

Create `src/lib/cart.ts`:

```ts
export type CartLine = { productId: string; quantity: number; priceCents: number };

export function lineTotalCents(line: CartLine): number {
  return line.priceCents * line.quantity;
}

export function cartTotalCents(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + lineTotalCents(l), 0);
}

export function clampQuantity(q: number): number {
  if (!Number.isFinite(q)) return 1;
  return Math.min(999, Math.max(1, Math.floor(q)));
}

export function hasDuplicateLines(lines: { productId: string }[]): boolean {
  return new Set(lines.map((l) => l.productId)).size !== lines.length;
}

export function findInvalidLines(
  lines: { productId: string }[],
  products: { id: string; active: boolean }[],
): string[] {
  const active = new Set(products.filter((p) => p.active).map((p) => p.id));
  return lines.map((l) => l.productId).filter((id) => !active.has(id));
}
```

- [ ] **Step 4: Run tests, commit**

Run: `npx vitest run tests/unit/cart.test.ts` — Expected: PASS (6 tests).

```bash
git add -A && git commit -m "feat: pure cart rules with unit tests"
```

---

### Task 5: Shopify catalogue mapping (TDD)

**Files:**
- Create: `src/lib/sync/shopify.ts`, `tests/fixtures/shopify-page.json`, `tests/unit/shopify.test.ts`

**Interfaces:**
- Produces:
  - `type CatalogueLine = { shopifyVariantId: string; name: string; variantName: string | null; category: string | null; description: string | null; imageUrl: string | null; priceCents: number; sku: string | null; productUrl: string }`
  - `parsePriceToCents(price: string): number` — string-math, no floats; throws on malformed input
  - `shopifyPageSchema` (Zod) — validates the shape of one `products.json` page
  - `mapProductsPage(page: unknown, baseUrl: string): CatalogueLine[]` — validates then flattens each variant into one line
  - `fetchAllCatalogueLines(baseUrl: string): Promise<CatalogueLine[]>` — paginates `GET {baseUrl}/products.json?limit=250&page=N` until an empty page

- [ ] **Step 1: Create the fixture**

Create `tests/fixtures/shopify-page.json` (trimmed real shape — two products, three variants):

```json
{
  "products": [
    {
      "id": 111, "title": "Glass Cleaner", "handle": "glass-cleaner",
      "body_html": "<p>Streak-free glass cleaner.</p>", "product_type": "Chemicals",
      "variants": [
        { "id": 1001, "title": "5L", "price": "18.95", "sku": "GC-5L" },
        { "id": 1002, "title": "20L", "price": "59.00", "sku": "GC-20L" }
      ],
      "images": [{ "src": "https://cdn.shopify.com/glass.jpg" }]
    },
    {
      "id": 222, "title": "Pro Mop", "handle": "pro-mop",
      "body_html": "", "product_type": "",
      "variants": [{ "id": 2001, "title": "Default Title", "price": "34.50", "sku": "" }],
      "images": []
    }
  ]
}
```

- [ ] **Step 2: Write failing tests**

Create `tests/unit/shopify.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import page from "../fixtures/shopify-page.json";
import { mapProductsPage, parsePriceToCents } from "../../src/lib/sync/shopify";

describe("parsePriceToCents", () => {
  test("parses dollar strings without float drift", () => {
    expect(parsePriceToCents("18.95")).toBe(1895);
    expect(parsePriceToCents("59.00")).toBe(5900);
    expect(parsePriceToCents("0.10")).toBe(10);
    expect(parsePriceToCents("1000")).toBe(100000);
    expect(parsePriceToCents("2.5")).toBe(250);
  });
  test("throws on malformed prices", () => {
    expect(() => parsePriceToCents("abc")).toThrow();
    expect(() => parsePriceToCents("")).toThrow();
  });
});

describe("mapProductsPage (S-01 basis)", () => {
  const lines = mapProductsPage(page, "https://cleanersgallery.com.au");

  test("each variant becomes one catalogue line", () => {
    expect(lines).toHaveLength(3);
    expect(lines[0]).toEqual({
      shopifyVariantId: "1001", name: "Glass Cleaner", variantName: "5L",
      category: "Chemicals", description: "Streak-free glass cleaner.",
      imageUrl: "https://cdn.shopify.com/glass.jpg", priceCents: 1895,
      sku: "GC-5L", productUrl: "https://cleanersgallery.com.au/products/glass-cleaner",
    });
  });
  test("'Default Title' variant, empty sku/type/images map to nulls", () => {
    const mop = lines[2];
    expect(mop.variantName).toBeNull();
    expect(mop.sku).toBeNull();
    expect(mop.category).toBeNull();
    expect(mop.imageUrl).toBeNull();
    expect(mop.priceCents).toBe(3450);
  });
  test("rejects malformed payloads", () => {
    expect(() => mapProductsPage({ nope: true }, "x")).toThrow();
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run tests/unit/shopify.test.ts` — Expected: FAIL (module not found).

- [ ] **Step 4: Implement**

Create `src/lib/sync/shopify.ts`:

```ts
import { z } from "zod";

export type CatalogueLine = {
  shopifyVariantId: string; name: string; variantName: string | null;
  category: string | null; description: string | null; imageUrl: string | null;
  priceCents: number; sku: string | null; productUrl: string;
};

export function parsePriceToCents(price: string): number {
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(price.trim());
  if (!m) throw new Error(`Malformed price: "${price}"`);
  const dollars = parseInt(m[1], 10);
  const cents = parseInt((m[2] ?? "0").padEnd(2, "0"), 10);
  return dollars * 100 + cents;
}

export const shopifyPageSchema = z.object({
  products: z.array(z.object({
    id: z.number(),
    title: z.string(),
    handle: z.string(),
    body_html: z.string().nullish(),
    product_type: z.string().nullish(),
    variants: z.array(z.object({
      id: z.number(),
      title: z.string(),
      price: z.string(),
      sku: z.string().nullish(),
    })),
    images: z.array(z.object({ src: z.string() })).nullish(),
  })),
});

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function mapProductsPage(page: unknown, baseUrl: string): CatalogueLine[] {
  const parsed = shopifyPageSchema.parse(page);
  return parsed.products.flatMap((p) =>
    p.variants.map((v) => ({
      shopifyVariantId: String(v.id),
      name: p.title,
      variantName: v.title === "Default Title" ? null : v.title,
      category: p.product_type || null,
      description: p.body_html ? stripHtml(p.body_html) || null : null,
      imageUrl: p.images?.[0]?.src ?? null,
      priceCents: parsePriceToCents(v.price),
      sku: v.sku || null,
      productUrl: `${baseUrl}/products/${p.handle}`,
    })),
  );
}

export async function fetchAllCatalogueLines(baseUrl: string): Promise<CatalogueLine[]> {
  const all: CatalogueLine[] = [];
  for (let pageNum = 1; pageNum <= 40; pageNum++) {
    const res = await fetch(`${baseUrl}/products.json?limit=250&page=${pageNum}`, {
      headers: { "user-agent": "SupplyOrdering/1.0" },
    });
    if (!res.ok) throw new Error(`Catalogue fetch failed: HTTP ${res.status}`);
    const lines = mapProductsPage(await res.json(), baseUrl);
    if (lines.length === 0) break;
    all.push(...lines);
  }
  return all;
}
```

- [ ] **Step 5: Run tests, commit**

Run: `npx vitest run tests/unit/shopify.test.ts` — Expected: PASS (5 tests).

```bash
git add -A && git commit -m "feat: shopify catalogue mapping with zod validation"
```

---

### Task 6: Auth.js v5, login page, guards, feature toggle

**Files:**
- Create: `src/lib/auth.ts`, `src/lib/guards.ts`, `src/lib/settings.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/login/LoginForm.tsx`, `src/actions/auth.ts`, `src/types/next-auth.d.ts`

**Interfaces:**
- Produces:
  - `auth()` — Auth.js session getter; session user carries `{ id, name, email, role }`
  - `requireRole(...roles: Role[]): Promise<{ id: string; name: string; email: string; role: Role }>` — for pages/layouts; redirects `/login` when signed out, `/` when wrong role
  - `guardAction(roles: Role[]): Promise<User>` — for server actions; **throws** on no session / wrong role / disabled user / feature toggle off; returns the fresh DB user
  - `supplyEnabled(): Promise<boolean>`
  - `homeFor(role: Role): string` — `/supplies` for CLEANER, `/admin/orders` for SUPPLY_MANAGER/ADMIN, `/` otherwise
  - Login at `/login` (email + password), sign-out server action `signOutAction()`

- [ ] **Step 1: Auth config + session types**

Create `src/lib/auth.ts`:

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const email = String(creds?.email ?? "").toLowerCase().trim();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.id = (user as { id: string }).id; token.role = (user as { role: Role }).role; }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
});

export function homeFor(role: Role): string {
  if (role === "CLEANER") return "/supplies";
  if (role === "SUPPLY_MANAGER" || role === "ADMIN") return "/admin/orders";
  return "/";
}
```

Create `src/types/next-auth.d.ts`:

```ts
import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
  }
  interface User { role: Role }
}
declare module "next-auth/jwt" {
  interface JWT { id?: string; role?: Role }
}
```

Create `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 2: Settings + guards**

Create `src/lib/settings.ts`:

```ts
import { prisma } from "@/lib/prisma";

export async function supplyEnabled(): Promise<boolean> {
  const s = await prisma.setting.findUnique({ where: { key: "supplyOrderingEnabled" } });
  return s?.value === "true";
}

export async function setSupplyEnabled(enabled: boolean): Promise<void> {
  await prisma.setting.upsert({
    where: { key: "supplyOrderingEnabled" },
    update: { value: String(enabled) },
    create: { key: "supplyOrderingEnabled", value: String(enabled) },
  });
}
```

Create `src/lib/guards.ts`:

```ts
import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { auth, homeFor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supplyEnabled } from "@/lib/settings";

export async function requireRole(...roles: Role[]) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!roles.includes(session.user.role)) redirect(homeFor(session.user.role));
  return session.user;
}

/** For server actions: throws instead of redirecting; re-checks the DB. */
export async function guardAction(roles: Role[]): Promise<User> {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in.");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("Not signed in.");
  if (!roles.includes(user.role)) throw new Error("Not allowed.");
  if (user.disabled) throw new Error("Your account is disabled.");
  if (!(await supplyEnabled())) throw new Error("Supply ordering is currently disabled.");
  return user;
}
```

- [ ] **Step 3: Login page + actions**

Create `src/actions/auth.ts`:

```ts
"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth, homeFor, signIn, signOut } from "@/lib/auth";

export async function loginAction(_prev: { error?: string }, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"), password: formData.get("password"), redirect: false,
    });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Invalid email or password." };
    throw e;
  }
  const session = await auth();
  const user = session ? await prisma.user.findUnique({ where: { id: session.user.id } }) : null;
  redirect(user ? homeFor(user.role) : "/login");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
```

Create `src/app/(auth)/login/page.tsx`:

```tsx
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <h1 className="mb-6 text-2xl font-semibold">Sign in</h1>
      <LoginForm />
    </main>
  );
}
```

Create `src/app/(auth)/login/LoginForm.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <input name="email" type="email" required placeholder="Email"
        className="rounded border p-2" />
      <input name="password" type="password" required placeholder="Password"
        className="rounded border p-2" />
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending}
        className="rounded bg-zinc-900 p-2 text-white disabled:opacity-50">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
```

Also replace `src/app/page.tsx` (root redirects by role):

```tsx
import { redirect } from "next/navigation";
import { auth, homeFor } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "CLEANER" || session.user.role === "SUPPLY_MANAGER" || session.user.role === "ADMIN") {
    redirect(homeFor(session.user.role));
  }
  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold">Welcome</h1>
      <p className="text-zinc-600">Nothing here for your role yet.</p>
    </main>
  );
}
```

- [ ] **Step 4: Verify manually, commit**

Run: `npm run dev`, sign in as `cleaner@example.com` / `password123`.
Expected: redirect to `/supplies` (404 for now — route comes in Task 12). Sign in as `manager@example.com` — expected: stays on `/` with the "nothing here" message.

```bash
git add -A && git commit -m "feat: auth.js credentials login, role guards, feature toggle"
```

---

### Task 7: Integration-test harness + cart server actions (TDD)

**Files:**
- Create: `tests/integration/helpers.ts`, `tests/integration/cart.test.ts`, `src/actions/cart.ts`

**Interfaces:**
- Consumes: `guardAction`, `clampQuantity`, `prisma`
- Produces:
  - `addToCart(productId: string, quantity: number): Promise<void>` — upserts (adds to existing quantity), rejects inactive products
  - `setCartQuantity(productId: string, quantity: number): Promise<void>`
  - `removeFromCart(productId: string): Promise<void>`
  - Test helpers: `resetDb()`, `makeUser(role, overrides?)`, `makeProduct(overrides?)`, `asUser(user)` (mocks `auth()` to return that user's session)

- [ ] **Step 1: Test helpers**

Integration tests run against `supply_test` (script `test:int` sets `DATABASE_URL` and migrates). Mock only `auth()`; everything else is real. Create `tests/integration/helpers.ts`:

```ts
import { vi } from "vitest";
import { PrismaClient, Role, User } from "@prisma/client";
import bcrypt from "bcryptjs";

export const db = new PrismaClient();

let currentUser: User | null = null;

vi.mock("@/lib/auth", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...mod,
    auth: vi.fn(async () =>
      currentUser
        ? { user: { id: currentUser.id, name: currentUser.name, email: currentUser.email, role: currentUser.role } }
        : null),
  };
});

export function asUser(user: User | null) { currentUser = user; }

export async function resetDb() {
  await db.$executeRawUnsafe(
    `TRUNCATE "OrderEvent","OrderItem","Order","CartItem","PriceHistory","AuditEvent","ImportRun","Product","User","Setting" CASCADE`,
  );
  await db.$executeRawUnsafe(`ALTER SEQUENCE order_number_seq RESTART WITH 1`);
  await db.setting.create({ data: { key: "supplyOrderingEnabled", value: "true" } });
  currentUser = null;
}

const hash = bcrypt.hashSync("password123", 4);
let n = 0;

export async function makeUser(role: Role, overrides: Partial<User> = {}) {
  n += 1;
  return db.user.create({
    data: { name: `User ${n}`, email: `u${n}@t.test`, passwordHash: hash, role, ...overrides },
  });
}

export async function makeProduct(overrides: Record<string, unknown> = {}) {
  n += 1;
  return db.product.create({
    data: {
      name: `Product ${n}`, priceCents: 1000, active: true, source: "MANUAL",
      ...overrides,
    },
  });
}
```

Note: `vi.mock("@/lib/auth", …)` must be imported before the actions in each test file (importing `helpers.ts` first is enough — `vi.mock` is hoisted per file that imports it, so each integration test file must `import { … } from "./helpers"` as its **first** local import).

- [ ] **Step 2: Write failing tests**

Create `tests/integration/cart.test.ts`:

```ts
import { beforeEach, describe, expect, test } from "vitest";
import { asUser, db, makeProduct, makeUser, resetDb } from "./helpers";
import { addToCart, removeFromCart, setCartQuantity } from "../../src/actions/cart";

describe("cart actions", () => {
  beforeEach(resetDb);

  test("addToCart creates a line, then merges quantities (no duplicate lines)", async () => {
    const user = await makeUser("CLEANER");
    const product = await makeProduct();
    asUser(user);
    await addToCart(product.id, 2);
    await addToCart(product.id, 3);
    const items = await db.cartItem.findMany({ where: { userId: user.id } });
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(5);
  });

  test("addToCart rejects inactive products", async () => {
    const user = await makeUser("CLEANER");
    const product = await makeProduct({ active: false });
    asUser(user);
    await expect(addToCart(product.id, 1)).rejects.toThrow(/not available/i);
  });

  test("setCartQuantity clamps to at least 1; removeFromCart deletes the line", async () => {
    const user = await makeUser("CLEANER");
    const product = await makeProduct();
    asUser(user);
    await addToCart(product.id, 2);
    await setCartQuantity(product.id, 0);
    expect((await db.cartItem.findFirst({ where: { userId: user.id } }))?.quantity).toBe(1);
    await removeFromCart(product.id);
    expect(await db.cartItem.count({ where: { userId: user.id } })).toBe(0);
  });

  test("non-cleaner roles cannot use the cart", async () => {
    const manager = await makeUser("MANAGER");
    const product = await makeProduct();
    asUser(manager);
    await expect(addToCart(product.id, 1)).rejects.toThrow(/not allowed/i);
  });

  test("C-02 basis: feature toggle off blocks cart actions", async () => {
    const user = await makeUser("CLEANER");
    const product = await makeProduct();
    await db.setting.update({ where: { key: "supplyOrderingEnabled" }, data: { value: "false" } });
    asUser(user);
    await expect(addToCart(product.id, 1)).rejects.toThrow(/disabled/i);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm run test:int` — Expected: FAIL (`src/actions/cart.ts` not found).

- [ ] **Step 4: Implement cart actions**

Create `src/actions/cart.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clampQuantity } from "@/lib/cart";
import { guardAction } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const idSchema = z.string().min(1);

export async function addToCart(productId: string, quantity: number): Promise<void> {
  const user = await guardAction(["CLEANER"]);
  const pid = idSchema.parse(productId);
  const qty = clampQuantity(z.number().parse(quantity));
  const product = await prisma.product.findUnique({ where: { id: pid } });
  if (!product || !product.active) throw new Error("This product is not available.");
  await prisma.cartItem.upsert({
    where: { userId_productId: { userId: user.id, productId: pid } },
    update: { quantity: { increment: qty } },
    create: { userId: user.id, productId: pid, quantity: qty },
  });
  revalidatePath("/supplies", "layout");
}

export async function setCartQuantity(productId: string, quantity: number): Promise<void> {
  const user = await guardAction(["CLEANER"]);
  const pid = idSchema.parse(productId);
  await prisma.cartItem.update({
    where: { userId_productId: { userId: user.id, productId: pid } },
    data: { quantity: clampQuantity(z.number().parse(quantity)) },
  });
  revalidatePath("/supplies", "layout");
}

export async function removeFromCart(productId: string): Promise<void> {
  const user = await guardAction(["CLEANER"]);
  const pid = idSchema.parse(productId);
  await prisma.cartItem.deleteMany({ where: { userId: user.id, productId: pid } });
  revalidatePath("/supplies", "layout");
}
```

- [ ] **Step 5: Run tests, commit**

Run: `npm run test:int` — Expected: PASS (5 tests).

```bash
git add -A && git commit -m "feat: cart server actions with integration tests"
```

---

### Task 8: Order submission action (TDD)

**Files:**
- Create: `src/actions/orders.ts` (submit only; status update comes in Task 10), `tests/integration/submit.test.ts`

**Interfaces:**
- Consumes: `guardAction`, `findInvalidLines`, `cartTotalCents`, `formatOrderNumber`, `prisma`, `sendOrderSubmittedEmail` (Task 9 — until then a local no-op stub `notifyTeam` is inlined and replaced in Task 9)
- Produces:
  - `submitOrder(): Promise<{ ok: true; orderNumber: string } | { ok: false; error: string; invalidProductIds?: string[] }>`
  - Behavior: single transaction — re-validate lines (inactive/missing → structured error, C-06), snapshot name/variant/price, orderNumber from `order_number_seq`, OrderEvent `→ SUBMITTED`, clear cart. Empty cart no-ops with error (double-submit safety). Email after commit; failure logged, never rolled back.

- [ ] **Step 1: Write failing tests**

Create `tests/integration/submit.test.ts`:

```ts
import { beforeEach, describe, expect, test } from "vitest";
import { asUser, db, makeProduct, makeUser, resetDb } from "./helpers";
import { submitOrder } from "../../src/actions/orders";

describe("submitOrder", () => {
  beforeEach(resetDb);

  async function cartFor(userId: string, lines: Array<[string, number]>) {
    for (const [productId, quantity] of lines) {
      await db.cartItem.create({ data: { userId, productId, quantity } });
    }
  }

  test("C-05: creates a SUBMITTED order with snapshots, sequence number, event, cleared cart", async () => {
    const user = await makeUser("CLEANER");
    const a = await makeProduct({ name: "Glass Cleaner", variantName: "5L", priceCents: 1895 });
    const b = await makeProduct({ priceCents: 550 });
    await cartFor(user.id, [[a.id, 2], [b.id, 1]]);
    asUser(user);

    const result = await submitOrder();
    expect(result).toEqual({ ok: true, orderNumber: "OR-00001" });

    const order = await db.order.findUnique({
      where: { orderNumber: "OR-00001" }, include: { items: true, events: true },
    });
    expect(order?.status).toBe("SUBMITTED");
    expect(order?.totalCents).toBe(1895 * 2 + 550);
    expect(order?.items).toHaveLength(2);
    const snap = order?.items.find((i) => i.productId === a.id);
    expect(snap?.nameSnapshot).toBe("Glass Cleaner");
    expect(snap?.variantSnapshot).toBe("5L");
    expect(snap?.priceCentsSnapshot).toBe(1895);
    expect(order?.events[0].toStatus).toBe("SUBMITTED");
    expect(await db.cartItem.count({ where: { userId: user.id } })).toBe(0);
  });

  test("S-02 basis: later price changes do not affect submitted orders", async () => {
    const user = await makeUser("CLEANER");
    const a = await makeProduct({ priceCents: 1000 });
    await cartFor(user.id, [[a.id, 1]]);
    asUser(user);
    await submitOrder();
    await db.product.update({ where: { id: a.id }, data: { priceCents: 9999 } });
    const item = await db.orderItem.findFirst();
    expect(item?.priceCentsSnapshot).toBe(1000);
  });

  test("C-06: rejects carts containing inactive products, reports which", async () => {
    const user = await makeUser("CLEANER");
    const ok = await makeProduct();
    const bad = await makeProduct({ active: false });
    await cartFor(user.id, [[ok.id, 1], [bad.id, 1]]);
    asUser(user);
    const result = await submitOrder();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.invalidProductIds).toEqual([bad.id]);
    expect(await db.order.count()).toBe(0);
    expect(await db.cartItem.count()).toBe(2); // cart untouched
  });

  test("double submit: second call finds an empty cart and no-ops", async () => {
    const user = await makeUser("CLEANER");
    const a = await makeProduct();
    await cartFor(user.id, [[a.id, 1]]);
    asUser(user);
    expect((await submitOrder()).ok).toBe(true);
    const second = await submitOrder();
    expect(second.ok).toBe(false);
    expect(await db.order.count()).toBe(1);
  });

  test("C-09: disabled cleaner cannot submit", async () => {
    const user = await makeUser("CLEANER", { disabled: true });
    const a = await makeProduct();
    await cartFor(user.id, [[a.id, 1]]);
    asUser(user);
    await expect(submitOrder()).rejects.toThrow(/disabled/i);
  });

  test("order numbers increment from the sequence", async () => {
    const u1 = await makeUser("CLEANER");
    const u2 = await makeUser("CLEANER");
    const a = await makeProduct();
    await cartFor(u1.id, [[a.id, 1]]);
    await cartFor(u2.id, [[a.id, 1]]);
    asUser(u1);
    expect((await submitOrder())).toEqual({ ok: true, orderNumber: "OR-00001" });
    asUser(u2);
    expect((await submitOrder())).toEqual({ ok: true, orderNumber: "OR-00002" });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:int` — Expected: cart tests pass, submit tests FAIL (module not found).

- [ ] **Step 3: Implement**

Create `src/actions/orders.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { cartTotalCents, findInvalidLines } from "@/lib/cart";
import { formatOrderNumber } from "@/lib/format";
import { guardAction } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export type SubmitResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string; invalidProductIds?: string[] };

async function notifyTeam(orderNumber: string): Promise<void> {
  // Replaced with real email in the email task.
  console.log(`[email stub] new order ${orderNumber}`);
}

export async function submitOrder(): Promise<SubmitResult> {
  const user = await guardAction(["CLEANER"]);

  const outcome = await prisma.$transaction(async (tx) => {
    const cart = await tx.cartItem.findMany({
      where: { userId: user.id }, include: { product: true },
    });
    if (cart.length === 0) {
      return { ok: false as const, error: "Your cart is empty." };
    }
    const invalid = findInvalidLines(
      cart.map((c) => ({ productId: c.productId })),
      cart.map((c) => ({ id: c.product.id, active: c.product.active })),
    );
    if (invalid.length > 0) {
      return {
        ok: false as const,
        error: "Some items are no longer available. Please remove them and try again.",
        invalidProductIds: invalid,
      };
    }
    const [{ nextval }] = await tx.$queryRaw<[{ nextval: bigint }]>`SELECT nextval('order_number_seq')`;
    const orderNumber = formatOrderNumber(Number(nextval));
    const totalCents = cartTotalCents(
      cart.map((c) => ({ productId: c.productId, quantity: c.quantity, priceCents: c.product.priceCents })),
    );
    await tx.order.create({
      data: {
        orderNumber, userId: user.id, status: "SUBMITTED", totalCents,
        items: {
          create: cart.map((c) => ({
            productId: c.productId,
            nameSnapshot: c.product.name,
            variantSnapshot: c.product.variantName,
            priceCentsSnapshot: c.product.priceCents,
            quantity: c.quantity,
          })),
        },
        events: { create: { toStatus: "SUBMITTED", actorId: user.id } },
      },
    });
    await tx.cartItem.deleteMany({ where: { userId: user.id } });
    return { ok: true as const, orderNumber };
  });

  if (outcome.ok) {
    try { await notifyTeam(outcome.orderNumber); }
    catch (e) { console.error("order email failed", e); }
    revalidatePath("/supplies", "layout");
  }
  return outcome;
}
```

- [ ] **Step 4: Run tests, commit**

Run: `npm run test:int` — Expected: PASS (11 tests total).

```bash
git add -A && git commit -m "feat: transactional order submission with snapshots and sequence numbering"
```

---

### Task 9: Order email — React Email + Resend with capture mode

**Files:**
- Create: `src/lib/email/OrderSubmittedEmail.tsx`, `src/lib/email/send.ts`, `tests/unit/email.test.ts`
- Modify: `src/actions/orders.ts` (replace `notifyTeam` stub)

**Interfaces:**
- Consumes: `formatAud`
- Produces:
  - `OrderSubmittedEmail(props: { orderNumber: string; workerName: string; workerEmail: string; items: Array<{ name: string; variant: string | null; quantity: number; priceCents: number }>; totalCents: number }): JSX element`
  - `sendOrderSubmittedEmail(props: OrderSubmittedEmailProps): Promise<void>` — `EMAIL_MODE=capture` renders HTML and writes `{ to, subject, html, props }` JSON to `.email-capture/<orderNumber>.json`; otherwise sends via Resend to `TEAM_INBOX`.

- [ ] **Step 1: Write failing test**

Create `tests/unit/email.test.ts`:

```ts
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { sendOrderSubmittedEmail } from "../../src/lib/email/send";

describe("SM-06 basis: order email", () => {
  test("capture mode writes subject, html and props to disk", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "email-"));
    process.env.EMAIL_MODE = "capture";
    process.env.EMAIL_CAPTURE_DIR = dir;
    process.env.TEAM_INBOX = "team@example.com";

    await sendOrderSubmittedEmail({
      orderNumber: "OR-00042", workerName: "Cara Cleaner", workerEmail: "cara@x.test",
      items: [{ name: "Glass Cleaner", variant: "5L", quantity: 2, priceCents: 1895 }],
      totalCents: 3790,
    });

    const captured = JSON.parse(readFileSync(path.join(dir, "OR-00042.json"), "utf8"));
    expect(captured.to).toBe("team@example.com");
    expect(captured.subject).toContain("OR-00042");
    expect(captured.html).toContain("Glass Cleaner");
    expect(captured.html).toContain("$37.90");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/email.test.ts` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement template and sender**

Create `src/lib/email/OrderSubmittedEmail.tsx`:

```tsx
import { Body, Container, Head, Heading, Html, Row, Column, Section, Text } from "@react-email/components";
import { formatAud } from "@/lib/format";

export type OrderSubmittedEmailProps = {
  orderNumber: string;
  workerName: string;
  workerEmail: string;
  items: Array<{ name: string; variant: string | null; quantity: number; priceCents: number }>;
  totalCents: number;
};

export function OrderSubmittedEmail(p: OrderSubmittedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", color: "#18181b" }}>
        <Container>
          <Heading as="h2">New supply order {p.orderNumber}</Heading>
          <Text>{p.workerName} ({p.workerEmail}) submitted a supply request.</Text>
          <Section>
            {p.items.map((i, idx) => (
              <Row key={idx}>
                <Column>{i.name}{i.variant ? ` — ${i.variant}` : ""} × {i.quantity}</Column>
                <Column align="right">{formatAud(i.priceCents * i.quantity)}</Column>
              </Row>
            ))}
            <Row>
              <Column><strong>Total</strong></Column>
              <Column align="right"><strong>{formatAud(p.totalCents)}</strong></Column>
            </Row>
          </Section>
          <Text>Contact the worker to confirm the order and arrange payment.</Text>
        </Container>
      </Body>
    </Html>
  );
}
```

Create `src/lib/email/send.ts`:

```ts
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { render } from "@react-email/components";
import { Resend } from "resend";
import { OrderSubmittedEmail, type OrderSubmittedEmailProps } from "./OrderSubmittedEmail";

export type { OrderSubmittedEmailProps };

export async function sendOrderSubmittedEmail(props: OrderSubmittedEmailProps): Promise<void> {
  const to = process.env.TEAM_INBOX ?? "";
  const subject = `New supply order ${props.orderNumber} from ${props.workerName}`;
  const html = await render(OrderSubmittedEmail(props));

  if (process.env.EMAIL_MODE === "capture") {
    const dir = process.env.EMAIL_CAPTURE_DIR ?? path.join(process.cwd(), ".email-capture");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${props.orderNumber}.json`),
      JSON.stringify({ to, subject, html, props }, null, 2));
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({ from: "supplies@notifications.local", to, subject, html });
}
```

- [ ] **Step 4: Wire into submitOrder**

In `src/actions/orders.ts`, delete the `notifyTeam` stub, add `import { sendOrderSubmittedEmail } from "@/lib/email/send";`, and change the transaction's success branch to also return the email payload. Replace the `ok: true` return inside the transaction with:

```ts
    return {
      ok: true as const, orderNumber,
      email: {
        orderNumber, workerName: user.name, workerEmail: user.email,
        items: cart.map((c) => ({
          name: c.product.name, variant: c.product.variantName,
          quantity: c.quantity, priceCents: c.product.priceCents,
        })),
        totalCents,
      },
    };
```

And replace the post-commit block with:

```ts
  if (outcome.ok) {
    try { await sendOrderSubmittedEmail(outcome.email); }
    catch (e) { console.error("order email failed", e); }
    revalidatePath("/supplies", "layout");
    return { ok: true, orderNumber: outcome.orderNumber };
  }
  return outcome;
```

(`SubmitResult` type is unchanged — the `email` field never leaves the function.)

- [ ] **Step 5: Run all tests, commit**

Run: `npm test && npm run test:int` — Expected: all PASS.

```bash
git add -A && git commit -m "feat: order-submitted email via resend with capture mode"
```

---

### Task 10: Status updates + internal notes (TDD)

**Files:**
- Modify: `src/actions/orders.ts` (add `updateOrderStatus`)
- Create: `tests/integration/status.test.ts`

**Interfaces:**
- Consumes: `guardAction`, `prisma`
- Produces: `updateOrderStatus(orderId: string, toStatus: OrderStatus, note?: string): Promise<void>` — SUPPLY_MANAGER/ADMIN only; any status settable; appends `OrderEvent` with `fromStatus`, optional trimmed note, `actorId`.

- [ ] **Step 1: Write failing tests**

Create `tests/integration/status.test.ts`:

```ts
import { beforeEach, describe, expect, test } from "vitest";
import { asUser, db, makeProduct, makeUser, resetDb } from "./helpers";
import { updateOrderStatus } from "../../src/actions/orders";

async function makeOrder(userId: string) {
  return db.order.create({
    data: {
      orderNumber: `OR-0000${await db.order.count() + 1}`, userId,
      status: "SUBMITTED", totalCents: 1000,
      events: { create: { toStatus: "SUBMITTED" } },
    },
  });
}

describe("updateOrderStatus", () => {
  beforeEach(resetDb);

  test("SM-05: supply manager sets status with a note; history records it", async () => {
    const cleaner = await makeUser("CLEANER");
    const sm = await makeUser("SUPPLY_MANAGER");
    const order = await makeOrder(cleaner.id);
    asUser(sm);
    await updateOrderStatus(order.id, "CONTACTED", "Called, confirming Tuesday");
    const updated = await db.order.findUnique({
      where: { id: order.id }, include: { events: { orderBy: { createdAt: "asc" } } },
    });
    expect(updated?.status).toBe("CONTACTED");
    const evt = updated?.events.at(-1);
    expect(evt?.fromStatus).toBe("SUBMITTED");
    expect(evt?.toStatus).toBe("CONTACTED");
    expect(evt?.note).toBe("Called, confirming Tuesday");
    expect(evt?.actorId).toBe(sm.id);
  });

  test("A-02 basis: admin can update status too", async () => {
    const cleaner = await makeUser("CLEANER");
    const admin = await makeUser("ADMIN");
    const order = await makeOrder(cleaner.id);
    asUser(admin);
    await updateOrderStatus(order.id, "CANCELLED");
    expect((await db.order.findUnique({ where: { id: order.id } }))?.status).toBe("CANCELLED");
  });

  test("C-08 basis: cleaners cannot update status", async () => {
    const cleaner = await makeUser("CLEANER");
    const order = await makeOrder(cleaner.id);
    asUser(cleaner);
    await expect(updateOrderStatus(order.id, "PAID")).rejects.toThrow(/not allowed/i);
  });

  test("rejects unknown order ids", async () => {
    const sm = await makeUser("SUPPLY_MANAGER");
    asUser(sm);
    await expect(updateOrderStatus("nope", "PAID")).rejects.toThrow(/not found/i);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:int` — Expected: new file FAILS (export missing).

- [ ] **Step 3: Implement**

Append to `src/actions/orders.ts`:

```ts
import { OrderStatus } from "@prisma/client"; // add to existing imports
import { z } from "zod";                       // add to existing imports

const statusSchema = z.nativeEnum(OrderStatus);

export async function updateOrderStatus(
  orderId: string, toStatus: OrderStatus, note?: string,
): Promise<void> {
  const actor = await guardAction(["SUPPLY_MANAGER", "ADMIN"]);
  const target = statusSchema.parse(toStatus);
  const trimmedNote = note?.trim() || null;

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found.");
    await tx.order.update({ where: { id: order.id }, data: { status: target } });
    await tx.orderEvent.create({
      data: {
        orderId: order.id, fromStatus: order.status, toStatus: target,
        note: trimmedNote, actorId: actor.id,
      },
    });
  });
  revalidatePath("/admin/orders", "layout");
  revalidatePath("/supplies", "layout");
}
```

- [ ] **Step 4: Run tests, commit**

Run: `npm run test:int` — Expected: PASS.

```bash
git add -A && git commit -m "feat: order status updates with notes and event history"
```

---

### Task 11: Product CRUD + audit events (TDD)

**Files:**
- Create: `src/actions/products.ts`, `src/lib/product-schema.ts`, `tests/integration/products.test.ts`

**Interfaces:**
- Consumes: `guardAction`, `prisma`
- Produces:
  - `productInputSchema` (Zod, in `src/lib/product-schema.ts` — shared with the admin form): `{ name: string (min 1), variantName?: string, category?: string, description?: string, imageUrl?: string, priceCents: number int ≥ 0, sku?: string, unitSize?: string, productUrl?: string, active: boolean }`; empty strings → `null`
  - `type ProductInput = z.infer<typeof productInputSchema>`
  - `createProduct(input: ProductInput): Promise<string>` (returns id; `source: MANUAL`; AuditEvent CREATED)
  - `updateProduct(id: string, input: ProductInput): Promise<void>` (AuditEvent UPDATED; plus ACTIVATED/DEACTIVATED when the flag flips; PriceHistory row when price changes)

- [ ] **Step 1: Shared schema**

Create `src/lib/product-schema.ts`:

```ts
import { z } from "zod";

const opt = z.string().trim().transform((s) => (s === "" ? null : s)).nullish()
  .transform((v) => v ?? null);

export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  variantName: opt,
  category: opt,
  description: opt,
  imageUrl: opt,
  priceCents: z.number().int().min(0),
  sku: opt,
  unitSize: opt,
  productUrl: opt,
  active: z.boolean(),
});

export type ProductInput = z.infer<typeof productInputSchema>;
```

- [ ] **Step 2: Write failing tests**

Create `tests/integration/products.test.ts`:

```ts
import { beforeEach, describe, expect, test } from "vitest";
import { asUser, db, makeProduct, makeUser, resetDb } from "./helpers";
import { createProduct, updateProduct } from "../../src/actions/products";

const base = { name: "Bucket", variantName: null, category: null, description: null,
  imageUrl: null, priceCents: 500, sku: null, unitSize: null, productUrl: null, active: true };

describe("product management", () => {
  beforeEach(resetDb);

  test("SM-08: manual create records product and audit entry", async () => {
    const sm = await makeUser("SUPPLY_MANAGER");
    asUser(sm);
    const id = await createProduct(base);
    const product = await db.product.findUnique({ where: { id } });
    expect(product?.source).toBe("MANUAL");
    const audit = await db.auditEvent.findFirst({ where: { entityId: id } });
    expect(audit?.action).toBe("CREATED");
    expect(audit?.actorId).toBe(sm.id);
  });

  test("SM-09: edit records audit; price change appends PriceHistory", async () => {
    const sm = await makeUser("SUPPLY_MANAGER");
    const p = await makeProduct({ priceCents: 500 });
    asUser(sm);
    await updateProduct(p.id, { ...base, priceCents: 750 });
    expect((await db.product.findUnique({ where: { id: p.id } }))?.priceCents).toBe(750);
    expect(await db.priceHistory.count({ where: { productId: p.id } })).toBe(1);
    expect(await db.auditEvent.count({ where: { entityId: p.id, action: "UPDATED" } })).toBe(1);
  });

  test("SM-10: deactivation flips flag and records DEACTIVATED audit", async () => {
    const sm = await makeUser("SUPPLY_MANAGER");
    const p = await makeProduct();
    asUser(sm);
    await updateProduct(p.id, { ...base, active: false });
    expect((await db.product.findUnique({ where: { id: p.id } }))?.active).toBe(false);
    expect(await db.auditEvent.count({ where: { entityId: p.id, action: "DEACTIVATED" } })).toBe(1);
  });

  test("cleaners cannot manage products", async () => {
    const cleaner = await makeUser("CLEANER");
    asUser(cleaner);
    await expect(createProduct(base)).rejects.toThrow(/not allowed/i);
  });

  test("validation: empty name rejected", async () => {
    const sm = await makeUser("SUPPLY_MANAGER");
    asUser(sm);
    await expect(createProduct({ ...base, name: " " })).rejects.toThrow();
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm run test:int` — Expected: new file FAILS (module not found).

- [ ] **Step 4: Implement**

Create `src/actions/products.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { guardAction } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { productInputSchema, type ProductInput } from "@/lib/product-schema";

export async function createProduct(input: ProductInput): Promise<string> {
  const actor = await guardAction(["SUPPLY_MANAGER", "ADMIN"]);
  const data = productInputSchema.parse(input);
  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({ data: { ...data, source: "MANUAL" } });
    await tx.auditEvent.create({
      data: { actorId: actor.id, entity: "Product", entityId: created.id, action: "CREATED", details: data },
    });
    await tx.priceHistory.create({ data: { productId: created.id, priceCents: data.priceCents } });
    return created;
  });
  revalidatePath("/admin/catalogue", "layout");
  return product.id;
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  const actor = await guardAction(["SUPPLY_MANAGER", "ADMIN"]);
  const data = productInputSchema.parse(input);
  await prisma.$transaction(async (tx) => {
    const before = await tx.product.findUnique({ where: { id } });
    if (!before) throw new Error("Product not found.");
    await tx.product.update({ where: { id }, data });
    await tx.auditEvent.create({
      data: { actorId: actor.id, entity: "Product", entityId: id, action: "UPDATED", details: data },
    });
    if (before.active !== data.active) {
      await tx.auditEvent.create({
        data: { actorId: actor.id, entity: "Product", entityId: id,
          action: data.active ? "ACTIVATED" : "DEACTIVATED" },
      });
    }
    if (before.priceCents !== data.priceCents) {
      await tx.priceHistory.create({ data: { productId: id, priceCents: data.priceCents } });
    }
  });
  revalidatePath("/admin/catalogue", "layout");
  revalidatePath("/supplies", "layout");
}
```

- [ ] **Step 5: Run tests, commit**

Run: `npm run test:int` — Expected: PASS.

```bash
git add -A && git commit -m "feat: product create/edit with audit events and price history"
```

---

### Task 12: Catalogue sync action (TDD)

**Files:**
- Create: `src/actions/sync.ts`, `src/lib/sync/apply.ts`, `tests/integration/sync.test.ts`

**Interfaces:**
- Consumes: `fetchAllCatalogueLines`, `CatalogueLine`, `guardAction`, `prisma`
- Produces:
  - `applyCatalogueLines(lines: CatalogueLine[]): Promise<{ added: number; updated: number; deactivated: number }>` (pure-ish DB apply, testable without HTTP) in `src/lib/sync/apply.ts`
  - `refreshCatalogue(): Promise<{ ok: boolean; message: string }>` in `src/actions/sync.ts` — guard, advisory lock `pg_try_advisory_lock(823451)`, ImportRun RUNNING→SUCCEEDED/FAILED, fetch from `process.env.CATALOGUE_BASE_URL`

- [ ] **Step 1: Write failing tests**

Create `tests/integration/sync.test.ts`:

```ts
import { beforeEach, describe, expect, test } from "vitest";
import { asUser, db, makeUser, resetDb } from "./helpers";
import { applyCatalogueLines } from "../../src/lib/sync/apply";
import type { CatalogueLine } from "../../src/lib/sync/shopify";

const line = (id: string, over: Partial<CatalogueLine> = {}): CatalogueLine => ({
  shopifyVariantId: id, name: `P${id}`, variantName: null, category: null,
  description: null, imageUrl: null, priceCents: 1000, sku: null,
  productUrl: "https://x/products/p", ...over,
});

describe("applyCatalogueLines", () => {
  beforeEach(resetDb);

  test("S-01: new lines are added as active SYNCED products", async () => {
    const r = await applyCatalogueLines([line("1"), line("2")]);
    expect(r).toEqual({ added: 2, updated: 0, deactivated: 0 });
    const products = await db.product.findMany();
    expect(products.every((p) => p.active && p.source === "SYNCED")).toBe(true);
  });

  test("S-02: price change updates product and appends PriceHistory", async () => {
    await applyCatalogueLines([line("1", { priceCents: 1000 })]);
    const r = await applyCatalogueLines([line("1", { priceCents: 1200 })]);
    expect(r.updated).toBe(1);
    const p = await db.product.findUnique({ where: { shopifyVariantId: "1" } });
    expect(p?.priceCents).toBe(1200);
    expect(await db.priceHistory.count({ where: { productId: p!.id } })).toBe(2);
  });

  test("S-03: missing SYNCED products are deactivated, never deleted", async () => {
    await applyCatalogueLines([line("1"), line("2")]);
    const r = await applyCatalogueLines([line("1")]);
    expect(r.deactivated).toBe(1);
    const gone = await db.product.findUnique({ where: { shopifyVariantId: "2" } });
    expect(gone?.active).toBe(false);
  });

  test("S-04: returning products are reactivated and updated", async () => {
    await applyCatalogueLines([line("1")]);
    await applyCatalogueLines([]);            // deactivates 1
    const r = await applyCatalogueLines([line("1", { priceCents: 900 })]);
    expect(r.updated).toBe(1);
    const p = await db.product.findUnique({ where: { shopifyVariantId: "1" } });
    expect(p?.active).toBe(true);
    expect(p?.priceCents).toBe(900);
  });

  test("MANUAL products are never touched by sync", async () => {
    const sm = await makeUser("SUPPLY_MANAGER");
    asUser(sm);
    await db.product.create({ data: { name: "Manual", priceCents: 1, active: true, source: "MANUAL" } });
    await applyCatalogueLines([]);
    const manual = await db.product.findFirst({ where: { source: "MANUAL" } });
    expect(manual?.active).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:int` — Expected: new file FAILS (module not found).

- [ ] **Step 3: Implement apply + action**

Create `src/lib/sync/apply.ts`:

```ts
import { prisma } from "@/lib/prisma";
import type { CatalogueLine } from "./shopify";

export async function applyCatalogueLines(
  lines: CatalogueLine[],
): Promise<{ added: number; updated: number; deactivated: number }> {
  let added = 0, updated = 0;
  const seen: string[] = [];

  for (const l of lines) {
    seen.push(l.shopifyVariantId);
    const existing = await prisma.product.findUnique({
      where: { shopifyVariantId: l.shopifyVariantId },
    });
    if (!existing) {
      const created = await prisma.product.create({
        data: { ...l, active: true, source: "SYNCED" },
      });
      await prisma.priceHistory.create({ data: { productId: created.id, priceCents: l.priceCents } });
      added += 1;
    } else {
      await prisma.product.update({
        where: { id: existing.id }, data: { ...l, active: true },
      });
      if (existing.priceCents !== l.priceCents) {
        await prisma.priceHistory.create({ data: { productId: existing.id, priceCents: l.priceCents } });
      }
      updated += 1;
    }
  }

  const { count: deactivated } = await prisma.product.updateMany({
    where: { source: "SYNCED", active: true, shopifyVariantId: { notIn: seen } },
    data: { active: false },
  });
  return { added, updated, deactivated };
}
```

Create `src/actions/sync.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { guardAction } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { applyCatalogueLines } from "@/lib/sync/apply";
import { fetchAllCatalogueLines } from "@/lib/sync/shopify";

const LOCK_KEY = 823451;

export async function refreshCatalogue(): Promise<{ ok: boolean; message: string }> {
  await guardAction(["SUPPLY_MANAGER", "ADMIN"]);

  const [{ locked }] = await prisma.$queryRaw<[{ locked: boolean }]>
    `SELECT pg_try_advisory_lock(${LOCK_KEY}) AS locked`;
  if (!locked) return { ok: false, message: "A catalogue refresh is already in progress." };

  const run = await prisma.importRun.create({ data: { status: "RUNNING" } });
  try {
    const baseUrl = process.env.CATALOGUE_BASE_URL ?? "https://cleanersgallery.com.au";
    const lines = await fetchAllCatalogueLines(baseUrl);
    const counts = await applyCatalogueLines(lines);
    await prisma.importRun.update({
      where: { id: run.id },
      data: { status: "SUCCEEDED", finishedAt: new Date(), ...counts },
    });
    revalidatePath("/admin", "layout");
    revalidatePath("/supplies", "layout");
    return { ok: true, message: `Added ${counts.added}, updated ${counts.updated}, deactivated ${counts.deactivated}.` };
  } catch (e) {
    await prisma.importRun.update({
      where: { id: run.id },
      data: { status: "FAILED", finishedAt: new Date(), errorMessage: e instanceof Error ? e.message : String(e) },
    });
    return { ok: false, message: "Catalogue refresh failed. See import history." };
  } finally {
    await prisma.$queryRaw`SELECT pg_advisory_unlock(${LOCK_KEY})`;
  }
}
```

- [ ] **Step 4: Run tests, commit**

Run: `npm run test:int` — Expected: PASS (all integration tests).

```bash
git add -A && git commit -m "feat: catalogue sync with import runs and advisory lock"
```

---

### Task 13: App shells — layouts, nav, guards, shared UI

**Files:**
- Create: `src/app/(worker)/layout.tsx`, `src/app/(admin)/layout.tsx`, `src/components/StatusBadge.tsx`, `src/components/EmptyState.tsx`, `src/components/CartBadge.tsx`, `src/components/MotionProvider.tsx`, `src/app/(admin)/admin/settings/page.tsx`, placeholder pages `src/app/(admin)/admin/bookings/page.tsx`, `.../customers/page.tsx`, `.../payouts/page.tsx`, `src/actions/settings.ts`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `requireRole`, `supplyEnabled`, `auth`, `signOutAction`, `STATUS_LABELS`, `STATUS_COLORS`
- Produces: guarded worker shell with header nav (Supplies, Catalogue, Cart w/ `CartBadge` — element id `cart-badge` used by the flight animation in Task 14); guarded admin shell with sidebar (Order requests, Product catalogue, Import history, Settings; ADMIN additionally sees Bookings/Customers/Payouts placeholders — SM-02/A-03); `<StatusBadge status />`; `toggleSupplyAction()` (ADMIN only).

- [ ] **Step 1: Root layout with MotionConfig**

Create `src/components/MotionProvider.tsx`:

```tsx
"use client";

import { MotionConfig } from "motion/react";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
```

Modify `src/app/layout.tsx` to wrap `{children}` with `<MotionProvider>…</MotionProvider>` inside `<body>` (keep the scaffold's fonts/globals).

- [ ] **Step 2: Shared components**

Create `src/components/StatusBadge.tsx`:

```tsx
import type { OrderStatus } from "@prisma/client";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/statuses";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
```

Create `src/components/EmptyState.tsx`:

```tsx
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center text-zinc-500">
      <p className="font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm">{hint}</p>}
    </div>
  );
}
```

Create `src/components/CartBadge.tsx` (client — animated count):

```tsx
"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";

export function CartBadge({ count }: { count: number }) {
  return (
    <Link href="/supplies/cart" id="cart-badge" className="relative rounded p-2" aria-label={`Cart, ${count} items`}>
      🛒
      <AnimatePresence mode="popLayout">
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-xs font-bold text-white"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
```

- [ ] **Step 3: Worker layout**

Create `src/app/(worker)/layout.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guards";
import { supplyEnabled } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { CartBadge } from "@/components/CartBadge";
import { signOutAction } from "@/actions/auth";

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("CLEANER");
  if (!(await supplyEnabled())) notFound(); // C-02 / M-02 behaviour: feature hidden
  const cartCount = await prisma.cartItem.count({ where: { userId: user.id } });

  return (
    <div className="mx-auto max-w-3xl">
      <header className="flex items-center justify-between border-b p-4">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/supplies">Supplies</Link>
          <Link href="/supplies/catalogue">Catalogue</Link>
        </nav>
        <div className="flex items-center gap-2">
          <CartBadge count={cartCount} />
          <form action={signOutAction}><button className="text-sm text-zinc-500">Sign out</button></form>
        </div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Admin layout, settings, placeholders**

Create `src/actions/settings.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setSupplyEnabled, supplyEnabled } from "@/lib/settings";

/** ADMIN only. Deliberately does NOT use guardAction: the toggle must work while the feature is off. */
export async function toggleSupplyAction(): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in.");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "ADMIN" || user.disabled) throw new Error("Not allowed.");
  await setSupplyEnabled(!(await supplyEnabled()));
  revalidatePath("/", "layout");
}
```

Create `src/app/(admin)/layout.tsx`:

```tsx
import Link from "next/link";
import { requireRole } from "@/lib/guards";
import { supplyEnabled } from "@/lib/settings";
import { signOutAction } from "@/actions/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("SUPPLY_MANAGER", "ADMIN");
  const enabled = await supplyEnabled();
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r p-4">
        <p className="mb-4 text-xs font-semibold uppercase text-zinc-400">Supply</p>
        <nav className="flex flex-col gap-2 text-sm">
          {enabled ? (
            <>
              <Link href="/admin/orders">Order requests</Link>
              <Link href="/admin/catalogue">Product catalogue</Link>
              <Link href="/admin/imports">Import history</Link>
            </>
          ) : (
            <p className="text-zinc-400">Supply ordering is disabled.</p>
          )}
          {isAdmin && (
            <>
              <p className="mt-4 text-xs font-semibold uppercase text-zinc-400">Platform</p>
              <Link href="/admin/bookings">Bookings</Link>
              <Link href="/admin/customers">Customers</Link>
              <Link href="/admin/payouts">Payouts</Link>
              <Link href="/admin/settings">Settings</Link>
            </>
          )}
        </nav>
        <form action={signOutAction} className="mt-8">
          <button className="text-sm text-zinc-500">Sign out</button>
        </form>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

Note: the admin layout intentionally renders (with supply nav hidden) when the feature is off — staff must reach Settings to re-enable it. Supply **pages** under it are still blocked because each supply page calls `supplyEnabled()` and 404s (added per page in Tasks 16–18).

Create `src/app/(admin)/admin/settings/page.tsx`:

```tsx
import { requireRole } from "@/lib/guards";
import { supplyEnabled } from "@/lib/settings";
import { toggleSupplyAction } from "@/actions/settings";

export default async function SettingsPage() {
  await requireRole("ADMIN");
  const enabled = await supplyEnabled();
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Settings</h1>
      <form action={toggleSupplyAction}>
        <p className="mb-2 text-sm">Supply ordering is <strong>{enabled ? "enabled" : "disabled"}</strong>.</p>
        <button className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white">
          {enabled ? "Disable" : "Enable"} supply ordering
        </button>
      </form>
    </div>
  );
}
```

Create the three placeholders — same body, different titles. `src/app/(admin)/admin/bookings/page.tsx`:

```tsx
import { requireRole } from "@/lib/guards";

export default async function BookingsPage() {
  await requireRole("ADMIN");
  return <p className="text-zinc-500">Bookings — coming soon.</p>;
}
```

(Repeat for `customers/page.tsx` and `payouts/page.tsx`, changing the component name and text.)

- [ ] **Step 5: Verify manually, commit**

Run: `npm run dev`. Check: supply manager sees no Bookings/Customers/Payouts (SM-02); admin sees them (A-03); manager login lands on `/` (M-01); direct `/admin/orders` as manager redirects (M-02).

```bash
git add -A && git commit -m "feat: worker and admin shells with role-guarded navigation"
```

---

### Task 14: Cleaner catalogue UI — grid, search, filter, detail, add-to-cart flight

**Files:**
- Create: `src/app/(worker)/supplies/catalogue/page.tsx`, `src/app/(worker)/supplies/catalogue/[id]/page.tsx`, `src/app/(worker)/supplies/catalogue/loading.tsx`, `src/components/ProductGrid.tsx`, `src/components/CategoryFilter.tsx`, `src/components/AddToCartButton.tsx`, `src/components/Skeleton.tsx`

**Interfaces:**
- Consumes: `requireRole`, `prisma`, `formatAud`, `addToCart` action, `#cart-badge` element (Task 13)
- Produces: `/supplies/catalogue?q=&category=` (server-filtered, active only) and `/supplies/catalogue/[id]` with quantity stepper + external store link. Exposes `data-testid="product-card"` on cards and `data-testid="add-to-cart"` on the button (E2E hooks).

- [ ] **Step 1: Catalogue page (server)**

Create `src/app/(worker)/supplies/catalogue/page.tsx`:

```tsx
import Form from "next/form";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProductGrid } from "@/components/ProductGrid";
import { EmptyState } from "@/components/EmptyState";

export default async function CataloguePage({
  searchParams,
}: { searchParams: Promise<{ q?: string; category?: string }> }) {
  await requireRole("CLEANER");
  const { q = "", category = "" } = await searchParams;

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        active: true,
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.product.findMany({
      where: { active: true, category: { not: null } },
      distinct: ["category"], select: { category: true }, orderBy: { category: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Product catalogue</h1>
      <Form action="/supplies/catalogue" className="mb-3 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Search products…"
          className="w-full rounded border p-2 text-sm" />
        {category && <input type="hidden" name="category" value={category} />}
        <button className="rounded bg-zinc-900 px-3 text-sm text-white">Search</button>
      </Form>
      <CategoryFilter categories={categories.map((c) => c.category!)} active={category} q={q} />
      {products.length === 0
        ? <EmptyState title="No products found" hint="Try a different search or category." />
        : <ProductGrid products={products} />}
    </div>
  );
}
```

- [ ] **Step 2: Grid + category chips (client, animated)**

Create `src/components/ProductGrid.tsx`:

```tsx
"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { Product } from "@prisma/client";
import { formatAud } from "@/lib/format";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {products.map((p, i) => (
        <motion.li
          key={p.id}
          data-testid="product-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i, 12) * 0.06, duration: 0.25 }}
        >
          <Link href={`/supplies/catalogue/${p.id}`} className="block rounded-lg border p-3 hover:shadow-md">
            <motion.img
              layoutId={`product-image-${p.id}`}
              src={p.imageUrl ?? "/placeholder.svg"}
              alt="" className="mb-2 aspect-square w-full rounded object-cover bg-zinc-100"
            />
            <p className="text-sm font-medium">{p.name}</p>
            {p.variantName && <p className="text-xs text-zinc-500">{p.variantName}</p>}
            <p className="mt-1 text-sm font-semibold">{formatAud(p.priceCents)}</p>
          </Link>
        </motion.li>
      ))}
    </ul>
  );
}
```

Create `src/components/CategoryFilter.tsx` (sliding active pill):

```tsx
"use client";

import Link from "next/link";
import { motion } from "motion/react";

export function CategoryFilter({ categories, active, q }:
  { categories: string[]; active: string; q: string }) {
  const chips = ["", ...categories];
  const href = (c: string) =>
    `/supplies/catalogue?${new URLSearchParams({ ...(q && { q }), ...(c && { category: c }) })}`;
  return (
    <div className="mb-4 flex flex-wrap gap-1">
      {chips.map((c) => {
        const isActive = c === active;
        return (
          <Link key={c || "all"} href={href(c)}
            className="relative rounded-full px-3 py-1 text-sm">
            {isActive && (
              <motion.span layoutId="category-pill"
                className="absolute inset-0 rounded-full bg-zinc-900"
                transition={{ type: "spring", stiffness: 400, damping: 30 }} />
            )}
            <span className={`relative ${isActive ? "text-white" : "text-zinc-600"}`}>
              {c || "All"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Product detail + AddToCartButton with flight animation**

Create `src/app/(worker)/supplies/catalogue/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formatAud } from "@/lib/format";
import { AddToCartButton } from "@/components/AddToCartButton";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("CLEANER");
  const { id } = await params;
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p || !p.active) notFound(); // cleaners never see inactive products

  return (
    <article className="mx-auto max-w-md">
      <img src={p.imageUrl ?? "/placeholder.svg"} alt={p.name}
        className="mb-4 aspect-square w-full rounded-lg object-cover bg-zinc-100"
        id="product-hero" />
      <h1 className="text-xl font-semibold">{p.name}</h1>
      {p.variantName && <p className="text-zinc-500">{p.variantName}</p>}
      {p.category && <p className="text-xs uppercase text-zinc-400">{p.category}</p>}
      <p className="my-2 text-lg font-bold">{formatAud(p.priceCents)}</p>
      {p.description && <p className="mb-4 text-sm text-zinc-600">{p.description}</p>}
      <AddToCartButton productId={p.id} imageUrl={p.imageUrl} />
      {p.productUrl && (
        <a href={p.productUrl} target="_blank" rel="noreferrer"
          className="mt-3 block text-sm text-blue-600 underline">
          View on cleanersgallery.com.au
        </a>
      )}
    </article>
  );
}
```

Create `src/components/AddToCartButton.tsx` — quantity stepper + image ghost flying to `#cart-badge`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/actions/cart";

type Flight = { fromX: number; fromY: number; toX: number; toY: number };

export function AddToCartButton({ productId, imageUrl }:
  { productId: string; imageUrl: string | null }) {
  const [qty, setQty] = useState(1);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [pending, start] = useTransition();
  const reduced = useReducedMotion();
  const router = useRouter();

  function launch(e: React.MouseEvent<HTMLButtonElement>) {
    const badge = document.getElementById("cart-badge");
    if (badge && !reduced) {
      const from = e.currentTarget.getBoundingClientRect();
      const to = badge.getBoundingClientRect();
      setFlight({
        fromX: from.left + from.width / 2, fromY: from.top,
        toX: to.left + to.width / 2, toY: to.top + to.height / 2,
      });
    }
    start(async () => {
      await addToCart(productId, qty);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded border">
        <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-1.5" aria-label="Decrease">−</button>
        <span className="min-w-8 text-center text-sm" data-testid="qty">{qty}</span>
        <button onClick={() => setQty((q) => Math.min(999, q + 1))} className="px-3 py-1.5" aria-label="Increase">+</button>
      </div>
      <motion.button
        data-testid="add-to-cart"
        whileTap={{ scale: 0.95 }}
        disabled={pending}
        onClick={launch}
        className="flex-1 rounded bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add to cart"}
      </motion.button>

      <AnimatePresence>
        {flight && (
          <motion.img
            src={imageUrl ?? "/placeholder.svg"} alt=""
            className="pointer-events-none fixed z-50 h-10 w-10 rounded-full object-cover"
            style={{ left: 0, top: 0 }}
            initial={{ x: flight.fromX - 20, y: flight.fromY - 20, scale: 1, opacity: 1 }}
            animate={{ x: flight.toX - 20, y: flight.toY - 20, scale: 0.3, opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeIn" }}
            onAnimationComplete={() => setFlight(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 4: Loading skeleton + placeholder asset**

Create `src/components/Skeleton.tsx`:

```tsx
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-zinc-200 ${className}`} />;
}
```

Create `src/app/(worker)/supplies/catalogue/loading.tsx`:

```tsx
import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
    </div>
  );
}
```

Create `public/placeholder.svg` (any simple neutral square, e.g.):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e4e4e7"/></svg>
```

- [ ] **Step 5: Verify manually, commit**

Run: `npm run dev` as cleaner. Check: search + category chips filter via URL; inactive seed product ("Retired Mop") absent (C-03); detail shows price/description/external link (C-04); add-to-cart flies to badge and count increments.

```bash
git add -A && git commit -m "feat: cleaner catalogue with search, filters and add-to-cart flight"
```

---

### Task 15: Cart UI — layout animations, animated total, submit sequence

**Files:**
- Create: `src/app/(worker)/supplies/cart/page.tsx`, `src/components/CartView.tsx`, `src/components/AnimatedMoney.tsx`, `src/app/(worker)/supplies/cart/submitted/page.tsx`, `src/components/SubmittedCheck.tsx`

**Interfaces:**
- Consumes: `setCartQuantity`, `removeFromCart`, `submitOrder` (`SubmitResult`), `cartTotalCents`, `formatAud`
- Produces: `/supplies/cart` (line steppers, animated removal, animated total, submit button morph, invalid-line shake on C-06) and `/supplies/cart/submitted?orderNumber=OR-00001` confirmation with drawn checkmark. Test hooks: `data-testid="cart-line"`, `data-testid="submit-order"`, `data-testid="cart-total"`.

- [ ] **Step 1: Cart page (server) and AnimatedMoney**

Create `src/app/(worker)/supplies/cart/page.tsx`:

```tsx
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { CartView } from "@/components/CartView";
import { EmptyState } from "@/components/EmptyState";

export default async function CartPage() {
  const user = await requireRole("CLEANER");
  const items = await prisma.cartItem.findMany({
    where: { userId: user.id }, include: { product: true }, orderBy: { id: "asc" },
  });
  if (items.length === 0) {
    return <EmptyState title="Your cart is empty" hint="Browse the catalogue to add supplies." />;
  }
  return (
    <CartView
      lines={items.map((i) => ({
        productId: i.productId, name: i.product.name, variantName: i.product.variantName,
        imageUrl: i.product.imageUrl, priceCents: i.product.priceCents,
        quantity: i.quantity, active: i.product.active,
      }))}
    />
  );
}
```

Create `src/components/AnimatedMoney.tsx` (ticking total):

```tsx
"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { formatAud } from "@/lib/format";

export function AnimatedMoney({ cents }: { cents: number }) {
  const raw = useMotionValue(cents);
  const spring = useSpring(raw, { stiffness: 200, damping: 30 });
  const text = useTransform(spring, (v) => formatAud(Math.round(v)));
  useEffect(() => { raw.set(cents); }, [cents, raw]);
  return <motion.span data-testid="cart-total">{text}</motion.span>;
}
```

- [ ] **Step 2: CartView (client)**

Create `src/components/CartView.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { removeFromCart, setCartQuantity } from "@/actions/cart";
import { submitOrder } from "@/actions/orders";
import { cartTotalCents } from "@/lib/cart";
import { formatAud } from "@/lib/format";
import { AnimatedMoney } from "@/components/AnimatedMoney";

type Line = {
  productId: string; name: string; variantName: string | null; imageUrl: string | null;
  priceCents: number; quantity: number; active: boolean;
};

export function CartView({ lines }: { lines: Line[] }) {
  const [pending, start] = useTransition();
  const [invalid, setInvalid] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const total = cartTotalCents(lines);

  const act = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });

  function submit() {
    start(async () => {
      const result = await submitOrder();
      if (result.ok) {
        router.push(`/supplies/cart/submitted?orderNumber=${result.orderNumber}`);
      } else {
        setError(result.error);
        setInvalid(result.invalidProductIds ?? []);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Cart</h1>
      <ul>
        <AnimatePresence initial={false}>
          {lines.map((l) => (
            <motion.li
              key={l.productId}
              data-testid="cart-line"
              layout
              exit={{ opacity: 0, x: -40 }}
              animate={invalid.includes(l.productId)
                ? { x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.4 } }
                : {}}
              className={`flex items-center gap-3 border-b py-3 ${invalid.includes(l.productId) ? "rounded bg-red-50 px-2" : ""}`}
            >
              <img src={l.imageUrl ?? "/placeholder.svg"} alt="" className="h-12 w-12 rounded object-cover bg-zinc-100" />
              <div className="flex-1">
                <p className="text-sm font-medium">{l.name}{l.variantName ? ` — ${l.variantName}` : ""}</p>
                <p className="text-xs text-zinc-500">{formatAud(l.priceCents)} each</p>
                {invalid.includes(l.productId) && (
                  <p className="text-xs font-medium text-red-600">No longer available — please remove</p>
                )}
              </div>
              <div className="flex items-center rounded border">
                <button disabled={pending} onClick={() => act(() => setCartQuantity(l.productId, l.quantity - 1))} className="px-2" aria-label="Decrease">−</button>
                <span className="min-w-7 text-center text-sm">{l.quantity}</span>
                <button disabled={pending} onClick={() => act(() => setCartQuantity(l.productId, l.quantity + 1))} className="px-2" aria-label="Increase">+</button>
              </div>
              <p className="w-20 text-right text-sm font-semibold">{formatAud(l.priceCents * l.quantity)}</p>
              <button disabled={pending} onClick={() => act(() => removeFromCart(l.productId))}
                className="text-sm text-red-500" aria-label={`Remove ${l.name}`}>✕</button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-zinc-500">Estimated total</p>
        <p className="text-lg font-bold"><AnimatedMoney cents={total} /></p>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}

      <motion.button
        data-testid="submit-order"
        whileTap={{ scale: 0.97 }}
        disabled={pending}
        onClick={submit}
        className="mt-4 w-full rounded bg-emerald-600 py-3 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit request"}
      </motion.button>
      <p className="mt-2 text-center text-xs text-zinc-500">
        No payment is taken in the app. The operations team will contact you to confirm and arrange payment.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Confirmation page with drawn checkmark**

Create `src/components/SubmittedCheck.tsx`:

```tsx
"use client";

import { motion } from "motion/react";

export function SubmittedCheck({ orderNumber }: { orderNumber: string }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <motion.svg width="72" height="72" viewBox="0 0 72 72" className="mb-4">
        <motion.circle cx="36" cy="36" r="32" fill="none" stroke="#059669" strokeWidth="4"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />
        <motion.path d="M22 37 L32 47 L51 27" fill="none" stroke="#059669" strokeWidth="5" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.35 }} />
      </motion.svg>
      <motion.h1
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="text-xl font-semibold" data-testid="order-number"
      >
        Request {orderNumber} submitted
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        className="mt-2 max-w-sm text-sm text-zinc-600"
      >
        The operations team will contact you to confirm your order and arrange payment.
      </motion.p>
    </div>
  );
}
```

Create `src/app/(worker)/supplies/cart/submitted/page.tsx`:

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/guards";
import { SubmittedCheck } from "@/components/SubmittedCheck";

export default async function SubmittedPage({
  searchParams,
}: { searchParams: Promise<{ orderNumber?: string }> }) {
  await requireRole("CLEANER");
  const { orderNumber } = await searchParams;
  if (!orderNumber) redirect("/supplies");
  return (
    <div>
      <SubmittedCheck orderNumber={orderNumber} />
      <Link href="/supplies" className="block text-center text-sm text-blue-600 underline">
        Back to my orders
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Verify manually, commit**

Run: `npm run dev` as cleaner: change quantities (total ticks), remove a line (slides out, others glide up), submit (confirmation + checkmark, C-05). Deactivate a carted product in Prisma Studio, submit again — line shakes red (C-06).

```bash
git add -A && git commit -m "feat: animated cart and submit confirmation flow"
```

---

### Task 16: Cleaner orders — home list, order detail, status timeline

**Files:**
- Create: `src/app/(worker)/supplies/page.tsx`, `src/app/(worker)/supplies/orders/[orderNumber]/page.tsx`, `src/components/StatusTimeline.tsx`, `src/app/(worker)/template.tsx`

**Interfaces:**
- Consumes: `requireRole`, `prisma`, `StatusBadge`, `formatAud`, `STATUS_LABELS`
- Produces: `/supplies` (own orders, newest first, New order CTA — `data-testid="order-card"`); `/supplies/orders/[orderNumber]` (snapshot items, read-only, `<StatusTimeline events />` where `events: Array<{ id: string; toStatus: OrderStatus; note: string | null; createdAt: Date; showNotes: boolean }>` — worker view passes `showNotes: false`); worker-portal page fade via `template.tsx`.

- [ ] **Step 1: Supplies home**

Create `src/app/(worker)/supplies/page.tsx`:

```tsx
import Link from "next/link";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formatAud } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";

export default async function SuppliesHome() {
  const user = await requireRole("CLEANER");
  const orders = await prisma.order.findMany({
    where: { userId: user.id }, orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">My supply orders</h1>
        <Link href="/supplies/catalogue"
          className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white">
          New order
        </Link>
      </div>
      {orders.length === 0
        ? <EmptyState title="No orders yet" hint="Start a new order from the catalogue." />
        : (
          <ul className="flex flex-col gap-2">
            {orders.map((o) => (
              <li key={o.id} data-testid="order-card">
                <Link href={`/supplies/orders/${o.orderNumber}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:shadow-sm">
                  <div>
                    <p className="font-medium">{o.orderNumber}</p>
                    <p className="text-xs text-zinc-500">{o.createdAt.toLocaleDateString("en-AU")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={o.status} />
                    <p className="text-sm font-semibold">{formatAud(o.totalCents)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
```

- [ ] **Step 2: StatusTimeline (client, staggered reveal)**

Create `src/components/StatusTimeline.tsx`:

```tsx
"use client";

import { motion } from "motion/react";
import type { OrderStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/statuses";

export type TimelineEvent = {
  id: string; toStatus: OrderStatus; note: string | null; createdAt: Date | string;
};

export function StatusTimeline({ events, showNotes }:
  { events: TimelineEvent[]; showNotes: boolean }) {
  return (
    <motion.ol
      initial="hidden" animate="show"
      variants={{ show: { transition: { staggerChildren: 0.12 } } }}
      className="relative ml-2 border-l-2 border-zinc-200 pl-4"
      data-testid="status-timeline"
    >
      {events.map((e) => (
        <motion.li key={e.id}
          variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
          className="relative mb-4"
        >
          <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-emerald-600" />
          <p className="text-sm font-medium">{STATUS_LABELS[e.toStatus]}</p>
          <p className="text-xs text-zinc-500">{new Date(e.createdAt).toLocaleString("en-AU")}</p>
          {showNotes && e.note && <p className="mt-1 text-xs text-zinc-600">{e.note}</p>}
        </motion.li>
      ))}
    </motion.ol>
  );
}
```

- [ ] **Step 3: Order detail (own orders only) + page transition**

Create `src/app/(worker)/supplies/orders/[orderNumber]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formatAud } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";

export default async function OrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const user = await requireRole("CLEANER");
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!order || order.userId !== user.id) notFound(); // C-07: own orders only

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{order.orderNumber}</h1>
        <StatusBadge status={order.status} />
      </div>
      <table className="mb-6 w-full text-sm">
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id} className="border-b">
              <td className="py-2">{i.nameSnapshot}{i.variantSnapshot ? ` — ${i.variantSnapshot}` : ""}</td>
              <td className="text-center">× {i.quantity}</td>
              <td className="text-right">{formatAud(i.priceCentsSnapshot * i.quantity)}</td>
            </tr>
          ))}
          <tr>
            <td className="py-2 font-semibold">Total</td><td />
            <td className="text-right font-semibold">{formatAud(order.totalCents)}</td>
          </tr>
        </tbody>
      </table>
      <h2 className="mb-2 text-sm font-semibold text-zinc-500">History</h2>
      <StatusTimeline events={order.events} showNotes={false} />
    </div>
  );
}
```

Create `src/app/(worker)/template.tsx` (portal page fade):

```tsx
"use client";

import { motion } from "motion/react";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}>
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 4: Verify manually, commit**

Run: `npm run dev` as cleaner: home lists own orders newest-first (C-07), detail shows snapshots + timeline without notes (C-08), pages fade on navigation.

```bash
git add -A && git commit -m "feat: cleaner order history with animated status timeline"
```

---

### Task 17: Admin orders — table, filters, detail, status update form

**Files:**
- Create: `src/app/(admin)/admin/orders/page.tsx`, `src/app/(admin)/admin/orders/[orderNumber]/page.tsx`, `src/components/StatusUpdateForm.tsx`, `src/app/(admin)/admin/orders/error.tsx`

**Interfaces:**
- Consumes: `requireRole`, `supplyEnabled`, `prisma`, `updateOrderStatus`, `StatusTimeline` (`showNotes: true`), `StatusBadge`, `formatAud`, `STATUS_ORDER`, `STATUS_LABELS`
- Produces: `/admin/orders?q=&status=&sort=` (all workers' requests — SM-03) and `/admin/orders/[orderNumber]` with worker contact card and status+note form (SM-04/SM-05). Test hooks: `data-testid="admin-order-row"`, `data-testid="status-select"`, `data-testid="status-note"`, `data-testid="save-status"`.

- [ ] **Step 1: Orders table page**

Create `src/app/(admin)/admin/orders/page.tsx`:

```tsx
import Form from "next/form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import { requireRole } from "@/lib/guards";
import { supplyEnabled } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { formatAud } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/statuses";
import { EmptyState } from "@/components/EmptyState";

export default async function AdminOrdersPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; status?: string; sort?: string }> }) {
  await requireRole("SUPPLY_MANAGER", "ADMIN");
  if (!(await supplyEnabled())) notFound();
  const { q = "", status = "", sort = "newest" } = await searchParams;

  const orders = await prisma.order.findMany({
    where: {
      ...(status && STATUS_ORDER.includes(status as OrderStatus)
        ? { status: status as OrderStatus } : {}),
      ...(q ? {
        OR: [
          { orderNumber: { contains: q, mode: "insensitive" } },
          { user: { name: { contains: q, mode: "insensitive" } } },
        ],
      } : {}),
    },
    include: { user: { select: { name: true } } },
    orderBy: sort === "total" ? { totalCents: "desc" }
      : sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Order requests</h1>
      <Form action="/admin/orders" className="mb-4 flex gap-2 text-sm">
        <input name="q" defaultValue={q} placeholder="Search order # or worker…"
          className="rounded border p-2" />
        <select name="status" defaultValue={status} className="rounded border p-2">
          <option value="">All statuses</option>
          {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select name="sort" defaultValue={sort} className="rounded border p-2">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="total">Highest total</option>
        </select>
        <button className="rounded bg-zinc-900 px-3 text-white">Apply</button>
      </Form>
      {orders.length === 0 ? <EmptyState title="No matching orders" /> : (
        <table className="w-full text-sm">
          <thead className="text-left text-zinc-500">
            <tr><th className="py-2">Order</th><th>Worker</th><th>Status</th><th>Date</th><th className="text-right">Total</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} data-testid="admin-order-row" className="border-t hover:bg-zinc-50">
                <td className="py-2">
                  <Link href={`/admin/orders/${o.orderNumber}`} className="font-medium text-blue-700 underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td>{o.user.name}</td>
                <td><StatusBadge status={o.status} /></td>
                <td>{o.createdAt.toLocaleDateString("en-AU")}</td>
                <td className="text-right">{formatAud(o.totalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Status update form (client)**

Create `src/components/StatusUpdateForm.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import type { OrderStatus } from "@prisma/client";
import { updateOrderStatus } from "@/actions/orders";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/statuses";

export function StatusUpdateForm({ orderId, current }:
  { orderId: string; current: OrderStatus }) {
  const [status, setStatus] = useState<OrderStatus>(current);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function save() {
    setError(null);
    start(async () => {
      try {
        await updateOrderStatus(orderId, status, note);
        setNote("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Update failed.");
      }
    });
  }

  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-2 text-sm font-semibold">Update status</h2>
      <select data-testid="status-select" value={status}
        onChange={(e) => setStatus(e.target.value as OrderStatus)}
        className="mb-2 w-full rounded border p-2 text-sm">
        {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>
      <textarea data-testid="status-note" value={note} onChange={(e) => setNote(e.target.value)}
        placeholder="Internal note (optional)" rows={2}
        className="mb-2 w-full rounded border p-2 text-sm" />
      {error && <p role="alert" className="mb-2 text-sm text-red-600">{error}</p>}
      <motion.button data-testid="save-status" whileTap={{ scale: 0.97 }} disabled={pending}
        onClick={save}
        className="w-full rounded bg-zinc-900 py-2 text-sm font-medium text-white disabled:opacity-60">
        {pending ? "Saving…" : "Save"}
      </motion.button>
    </div>
  );
}
```

- [ ] **Step 3: Order detail page + error boundary**

Create `src/app/(admin)/admin/orders/[orderNumber]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guards";
import { supplyEnabled } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { formatAud } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { StatusUpdateForm } from "@/components/StatusUpdateForm";

export default async function AdminOrderPage({ params }:
  { params: Promise<{ orderNumber: string }> }) {
  await requireRole("SUPPLY_MANAGER", "ADMIN");
  if (!(await supplyEnabled())) notFound();
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) notFound();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-4 flex items-center gap-3">
          <h1 className="text-xl font-semibold">{order.orderNumber}</h1>
          <StatusBadge status={order.status} />
        </div>
        <div className="mb-4 rounded-lg border p-4 text-sm">
          <p className="font-medium">{order.user.name}</p>
          <p className="text-zinc-500">{order.user.email}{order.user.phone ? ` · ${order.user.phone}` : ""}</p>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id} className="border-b">
                <td className="py-2">{i.nameSnapshot}{i.variantSnapshot ? ` — ${i.variantSnapshot}` : ""}</td>
                <td className="text-center">× {i.quantity}</td>
                <td className="text-right">{formatAud(i.priceCentsSnapshot * i.quantity)}</td>
              </tr>
            ))}
            <tr>
              <td className="py-2 font-semibold">Total</td><td />
              <td className="text-right font-semibold">{formatAud(order.totalCents)}</td>
            </tr>
          </tbody>
        </table>
        <h2 className="mb-2 mt-6 text-sm font-semibold text-zinc-500">History</h2>
        <StatusTimeline events={order.events} showNotes={true} />
      </div>
      <StatusUpdateForm orderId={order.id} current={order.status} />
    </div>
  );
}
```

Create `src/app/(admin)/admin/orders/error.tsx`:

```tsx
"use client";

export default function OrdersError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded border border-red-200 bg-red-50 p-6 text-center">
      <p className="mb-2 font-medium text-red-700">Something went wrong loading orders.</p>
      <button onClick={reset} className="rounded bg-red-700 px-3 py-1.5 text-sm text-white">Try again</button>
    </div>
  );
}
```

- [ ] **Step 4: Verify manually, commit**

Run: `npm run dev` as supply manager: list shows all workers' orders with working filters (SM-03), detail shows contact + items (SM-04), saving a status+note appends to the timeline live (SM-05).

```bash
git add -A && git commit -m "feat: admin order requests with status updates and notes"
```

---

### Task 18: Admin catalogue — table, product form, import history

**Files:**
- Create: `src/app/(admin)/admin/catalogue/page.tsx`, `src/app/(admin)/admin/catalogue/new/page.tsx`, `src/app/(admin)/admin/catalogue/[id]/edit/page.tsx`, `src/components/ProductForm.tsx`, `src/app/(admin)/admin/imports/page.tsx`, `src/components/RefreshCatalogueButton.tsx`

**Interfaces:**
- Consumes: `requireRole`, `supplyEnabled`, `prisma`, `createProduct`, `updateProduct`, `productInputSchema`/`ProductInput`, `refreshCatalogue`, `formatAud`
- Produces: `/admin/catalogue?q=&state=&sort=` (active + inactive — SM-07); `/admin/catalogue/new` and `/admin/catalogue/[id]/edit` sharing `<ProductForm>`; `/admin/imports` with `<RefreshCatalogueButton>`. Test hooks: `data-testid="admin-product-row"`, `data-testid="product-form"`, `data-testid="refresh-catalogue"`, `data-testid="import-row"`.

- [ ] **Step 1: Catalogue table**

Create `src/app/(admin)/admin/catalogue/page.tsx`:

```tsx
import Form from "next/form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guards";
import { supplyEnabled } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { formatAud } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

export default async function AdminCataloguePage({
  searchParams,
}: { searchParams: Promise<{ q?: string; state?: string; sort?: string }> }) {
  await requireRole("SUPPLY_MANAGER", "ADMIN");
  if (!(await supplyEnabled())) notFound();
  const { q = "", state = "", sort = "name" } = await searchParams;

  const products = await prisma.product.findMany({
    where: {
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(state === "active" ? { active: true } : state === "inactive" ? { active: false } : {}),
    },
    orderBy: sort === "price" ? { priceCents: "asc" }
      : sort === "category" ? { category: "asc" } : { name: "asc" },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Product catalogue</h1>
        <Link href="/admin/catalogue/new"
          className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white">New product</Link>
      </div>
      <Form action="/admin/catalogue" className="mb-4 flex gap-2 text-sm">
        <input name="q" defaultValue={q} placeholder="Search products…" className="rounded border p-2" />
        <select name="state" defaultValue={state} className="rounded border p-2">
          <option value="">All</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
        <select name="sort" defaultValue={sort} className="rounded border p-2">
          <option value="name">Name</option><option value="category">Category</option><option value="price">Price</option>
        </select>
        <button className="rounded bg-zinc-900 px-3 text-white">Apply</button>
      </Form>
      {products.length === 0 ? <EmptyState title="No products found" /> : (
        <table className="w-full text-sm">
          <thead className="text-left text-zinc-500">
            <tr><th className="py-2">Name</th><th>Variant</th><th>Category</th><th>Source</th><th>State</th><th className="text-right">Price</th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} data-testid="admin-product-row" className="border-t hover:bg-zinc-50">
                <td className="py-2">
                  <Link href={`/admin/catalogue/${p.id}/edit`} className="font-medium text-blue-700 underline">
                    {p.name}
                  </Link>
                </td>
                <td>{p.variantName ?? "—"}</td>
                <td>{p.category ?? "—"}</td>
                <td>{p.source === "SYNCED" ? "Synced" : "Manual"}</td>
                <td>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${p.active ? "bg-green-100 text-green-800" : "bg-zinc-200 text-zinc-600"}`}>
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="text-right">{formatAud(p.priceCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: ProductForm (client, shared by new/edit)**

Create `src/components/ProductForm.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { productInputSchema, type ProductInput } from "@/lib/product-schema";
import { createProduct, updateProduct } from "@/actions/products";

type Props = { productId?: string; initial?: Partial<ProductInput> };

export function ProductForm({ productId, initial = {} }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function submit(formData: FormData) {
    setError(null);
    const parsed = productInputSchema.safeParse({
      name: formData.get("name"),
      variantName: formData.get("variantName"),
      category: formData.get("category"),
      description: formData.get("description"),
      imageUrl: formData.get("imageUrl"),
      priceCents: Math.round(Number(formData.get("price") || 0) * 100),
      sku: formData.get("sku"),
      unitSize: formData.get("unitSize"),
      productUrl: formData.get("productUrl"),
      active: formData.get("active") === "on",
    });
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    start(async () => {
      try {
        if (productId) await updateProduct(productId, parsed.data);
        else await createProduct(parsed.data);
        router.push("/admin/catalogue");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed.");
      }
    });
  }

  const i = initial;
  return (
    <form action={submit} data-testid="product-form" className="grid max-w-lg gap-3 text-sm">
      <input name="name" defaultValue={i.name ?? ""} placeholder="Name *" required className="rounded border p-2" />
      <div className="grid grid-cols-2 gap-3">
        <input name="variantName" defaultValue={i.variantName ?? ""} placeholder="Variant" className="rounded border p-2" />
        <input name="category" defaultValue={i.category ?? ""} placeholder="Category" className="rounded border p-2" />
      </div>
      <textarea name="description" defaultValue={i.description ?? ""} placeholder="Description" rows={3} className="rounded border p-2" />
      <div className="grid grid-cols-3 gap-3">
        <input name="price" type="number" step="0.01" min="0" required
          defaultValue={i.priceCents != null ? (i.priceCents / 100).toFixed(2) : ""}
          placeholder="Price (AUD) *" className="rounded border p-2" />
        <input name="sku" defaultValue={i.sku ?? ""} placeholder="SKU" className="rounded border p-2" />
        <input name="unitSize" defaultValue={i.unitSize ?? ""} placeholder="Unit size" className="rounded border p-2" />
      </div>
      <input name="imageUrl" defaultValue={i.imageUrl ?? ""} placeholder="Image URL" className="rounded border p-2" />
      <input name="productUrl" defaultValue={i.productUrl ?? ""} placeholder="Product page URL" className="rounded border p-2" />
      <label className="flex items-center gap-2">
        <input name="active" type="checkbox" defaultChecked={i.active ?? true} /> Active
      </label>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      <button disabled={pending} className="rounded bg-zinc-900 py-2 font-medium text-white disabled:opacity-60">
        {pending ? "Saving…" : "Save product"}
      </button>
    </form>
  );
}
```

Create `src/app/(admin)/admin/catalogue/new/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guards";
import { supplyEnabled } from "@/lib/settings";
import { ProductForm } from "@/components/ProductForm";

export default async function NewProductPage() {
  await requireRole("SUPPLY_MANAGER", "ADMIN");
  if (!(await supplyEnabled())) notFound();
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">New product</h1>
      <ProductForm />
    </div>
  );
}
```

Create `src/app/(admin)/admin/catalogue/[id]/edit/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guards";
import { supplyEnabled } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("SUPPLY_MANAGER", "ADMIN");
  if (!(await supplyEnabled())) notFound();
  const { id } = await params;
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) notFound();
  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Edit product</h1>
      {p.source === "SYNCED" && (
        <p className="mb-4 text-xs text-amber-700">
          Synced from the external store — the next catalogue refresh will reassert store data.
        </p>
      )}
      <ProductForm productId={p.id} initial={{
        name: p.name, variantName: p.variantName, category: p.category,
        description: p.description, imageUrl: p.imageUrl, priceCents: p.priceCents,
        sku: p.sku, unitSize: p.unitSize, productUrl: p.productUrl, active: p.active,
      }} />
    </div>
  );
}
```

- [ ] **Step 3: Import history + refresh button**

Create `src/components/RefreshCatalogueButton.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { refreshCatalogue } from "@/actions/sync";

export function RefreshCatalogueButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div className="mb-4 flex items-center gap-3">
      <motion.button data-testid="refresh-catalogue" whileTap={{ scale: 0.97 }} disabled={pending}
        onClick={() => start(async () => {
          const r = await refreshCatalogue();
          setMessage(r.message);
          router.refresh();
        })}
        className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60">
        {pending ? "Refreshing…" : "Refresh catalogue"}
      </motion.button>
      {message && <p className="text-sm text-zinc-600">{message}</p>}
    </div>
  );
}
```

Create `src/app/(admin)/admin/imports/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guards";
import { supplyEnabled } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { RefreshCatalogueButton } from "@/components/RefreshCatalogueButton";
import { EmptyState } from "@/components/EmptyState";

export default async function ImportsPage() {
  await requireRole("SUPPLY_MANAGER", "ADMIN");
  if (!(await supplyEnabled())) notFound();
  const runs = await prisma.importRun.findMany({ orderBy: { startedAt: "desc" }, take: 50 });
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Catalogue import history</h1>
      <RefreshCatalogueButton />
      {runs.length === 0 ? <EmptyState title="No imports yet" /> : (
        <table className="w-full text-sm">
          <thead className="text-left text-zinc-500">
            <tr><th className="py-2">Started</th><th>Status</th><th>Added</th><th>Updated</th><th>Deactivated</th><th>Error</th></tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id} data-testid="import-row" className="border-t">
                <td className="py-2">{r.startedAt.toLocaleString("en-AU")}</td>
                <td>{r.status}</td>
                <td>{r.added}</td><td>{r.updated}</td><td>{r.deactivated}</td>
                <td className="text-red-600">{r.errorMessage ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify manually, commit**

Run: `npm run dev` as supply manager: catalogue shows active + inactive (SM-07); create + edit products (SM-08/SM-09); deactivate one and confirm it vanishes from the cleaner catalogue (SM-10); hit "Refresh catalogue" against the real store and check an ImportRun row appears with counts (S-01).

```bash
git add -A && git commit -m "feat: admin catalogue management and import history"
```

---

### Task 19: Playwright E2E — harness + spec scenarios

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/global-setup.ts`, `tests/e2e/fixture-server.mjs`, `tests/e2e/helpers.ts`, `tests/e2e/cleaner.spec.ts`, `tests/e2e/supply-manager.spec.ts`, `tests/e2e/access.spec.ts`, `tests/e2e/sync.spec.ts`

**Interfaces:**
- Consumes: seeded users from `prisma/seed.ts` (all `password123`), test ids from Tasks 13–18, `EMAIL_MODE=capture`
- Produces: `npm run test:e2e` covering C-01…C-10, SM-01…SM-11, A-01…A-03, M-01…M-02, U-01, plus an S-01 smoke against the fixture server (S-01…S-04 logic is already covered at integration level in Task 12).

Notes for the implementer:
- Tests run serially (`workers: 1`) because the feature toggle and shared DB are global state.
- The e2e DB is reset + reseeded in global setup; tests that need orders create them through the UI.

- [ ] **Step 1: Config, fixture server, global setup, login helper**

Create `playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";

const E2E_DB = "postgresql://supply:supply@localhost:5432/supply_e2e";

export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,
  timeout: 45_000,
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "next dev",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    env: {
      DATABASE_URL: E2E_DB,
      AUTH_SECRET: "e2e-secret",
      EMAIL_MODE: "capture",
      EMAIL_CAPTURE_DIR: ".email-capture-e2e",
      TEAM_INBOX: "team@example.com",
      CATALOGUE_BASE_URL: "http://localhost:3100",
    },
  },
});
```

Create `tests/e2e/fixture-server.mjs` (serves the Task 5 fixture as page 1, empty after):

```js
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const fixture = readFileSync(new URL("../fixtures/shopify-page.json", import.meta.url), "utf8");

createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const page = Number(url.searchParams.get("page") ?? "1");
  res.setHeader("content-type", "application/json");
  res.end(page === 1 ? fixture : JSON.stringify({ products: [] }));
}).listen(3100, () => console.log("fixture catalogue on :3100"));
```

Create `tests/e2e/global-setup.ts`:

```ts
import { execSync, spawn } from "node:child_process";
import { rmSync } from "node:fs";

const E2E_DB = "postgresql://supply:supply@localhost:5432/supply_e2e";

export default async function globalSetup() {
  rmSync(".email-capture-e2e", { recursive: true, force: true });
  execSync("npx prisma migrate reset --force --skip-generate", {
    env: { ...process.env, DATABASE_URL: E2E_DB }, stdio: "inherit",
  });
  // migrate reset runs prisma/seed.ts automatically when package.json has a "prisma": { "seed": ... } entry — add it:
  // "prisma": { "seed": "tsx prisma/seed.ts" }
  const server = spawn("node", ["tests/e2e/fixture-server.mjs"], { stdio: "ignore", detached: true });
  server.unref();
  process.env.FIXTURE_PID = String(server.pid);
}
```

Also add to `package.json` (top level): `"prisma": { "seed": "tsx prisma/seed.ts" }`.

Create `tests/e2e/helpers.ts`:

```ts
import { expect, type Page } from "@playwright/test";

export async function login(page: Page, email: string, password = "password123") {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click("button:has-text('Sign in')");
  await page.waitForLoadState("networkidle");
}

export async function setFeature(page: Page, enabled: boolean) {
  await login(page, "admin@example.com");
  await page.goto("/admin/settings");
  const current = (await page.textContent("form p"))?.includes("enabled");
  if (current !== enabled) await page.click("form button");
  await expect(page.locator("form p")).toContainText(enabled ? "enabled" : "disabled");
  await page.context().clearCookies();
}
```

- [ ] **Step 2: Cleaner scenarios**

Create `tests/e2e/cleaner.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { login, setFeature } from "./helpers";

test.describe.configure({ mode: "serial" });

test("C-01: cleaner with feature enabled sees Supplies", async ({ page }) => {
  await setFeature(page, true);
  await login(page, "cleaner@example.com");
  await expect(page).toHaveURL(/\/supplies/);
  await expect(page.locator("nav")).toContainText("Supplies");
});

test("C-02: feature disabled hides Supplies", async ({ page }) => {
  await setFeature(page, false);
  await login(page, "cleaner@example.com");
  await page.goto("/supplies");
  await expect(page.locator("body")).toContainText(/not.*found|404/i);
  await setFeature(page, true);
});

test("C-03: catalogue lists only active products with search and category filter", async ({ page }) => {
  await login(page, "cleaner@example.com");
  await page.goto("/supplies/catalogue");
  await expect(page.getByTestId("product-card").first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Retired Mop"); // inactive seed
  await page.fill('input[name="q"]', "Glass");
  await page.click("button:has-text('Search')");
  await expect(page.getByTestId("product-card")).toHaveCount(1);
});

test("C-04: product detail shows price, description, external link", async ({ page }) => {
  await login(page, "cleaner@example.com");
  await page.goto("/supplies/catalogue");
  await page.getByTestId("product-card").first().click();
  await expect(page.locator("body")).toContainText("$");
  const link = page.locator("a:has-text('cleanersgallery.com.au')");
  await expect(link).toHaveAttribute("href", /cleanersgallery\.com\.au/);
});

test("C-05 + C-10: cart persists across navigation; submit creates SUBMITTED order with confirmation", async ({ page }) => {
  await login(page, "cleaner@example.com");
  await page.goto("/supplies/catalogue");
  await page.getByTestId("product-card").first().click();
  await page.getByTestId("add-to-cart").click();
  await page.goto("/supplies/catalogue");           // C-10: navigate away
  await page.goto("/supplies/cart");
  await expect(page.getByTestId("cart-line")).toHaveCount(1);
  await page.getByTestId("submit-order").click();
  await expect(page.getByTestId("order-number")).toContainText(/OR-\d{5}/);
});

test("C-07 + C-08: own orders only; detail shows snapshots and history without editing", async ({ page }) => {
  await login(page, "cleaner@example.com");
  await page.goto("/supplies");
  await expect(page.getByTestId("order-card").first()).toBeVisible();
  await page.getByTestId("order-card").first().click();
  await expect(page.getByTestId("status-timeline")).toBeVisible();
  await expect(page.getByTestId("status-select")).toHaveCount(0); // no editing UI
  // other worker sees nothing
  await page.context().clearCookies();
  await login(page, "cleaner2@example.com");
  await page.goto("/supplies");
  await expect(page.getByTestId("order-card")).toHaveCount(0);
});

test("C-09: disabled cleaner cannot submit", async ({ page }) => {
  await login(page, "disabled@example.com");
  await page.goto("/supplies/catalogue");
  await page.getByTestId("product-card").first().click();
  await page.getByTestId("add-to-cart").click();
  await page.goto("/supplies/cart");
  await page.getByTestId("submit-order").click();
  await expect(page.locator("body")).toContainText(/disabled/i);
});
```

(C-06 is covered at integration level in Task 8 — deactivating a carted product mid-test requires DB access; the shake UI was verified manually in Task 15. If desired, add a `db` import to flip `active` here too.)

- [ ] **Step 3: Supply manager + admin/access scenarios**

Create `tests/e2e/supply-manager.spec.ts`:

```ts
import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe.configure({ mode: "serial" });

test("SM-01 + SM-02: supply nav present; platform admin areas absent", async ({ page }) => {
  await login(page, "supply@example.com");
  await expect(page).toHaveURL(/\/admin\/orders/);
  await expect(page.locator("aside")).toContainText("Order requests");
  await expect(page.locator("aside")).toContainText("Product catalogue");
  await expect(page.locator("aside")).not.toContainText("Bookings");
  await expect(page.locator("aside")).not.toContainText("Payouts");
});

test("SM-03 + SM-04 + SM-05: order list, detail, status update with note", async ({ page }) => {
  await login(page, "supply@example.com");
  await page.goto("/admin/orders");
  await expect(page.getByTestId("admin-order-row").first()).toBeVisible();
  await page.getByTestId("admin-order-row").first().locator("a").click();
  await expect(page.locator("body")).toContainText("@"); // worker email visible
  await page.getByTestId("status-select").selectOption("CONTACTED");
  await page.getByTestId("status-note").fill("Called worker");
  await page.getByTestId("save-status").click();
  await expect(page.getByTestId("status-timeline")).toContainText("Contacted");
  await expect(page.getByTestId("status-timeline")).toContainText("Called worker");
});

test("SM-06: submitted order produced a captured email", async () => {
  const files = readdirSync(".email-capture-e2e");
  expect(files.length).toBeGreaterThan(0);
  const email = JSON.parse(readFileSync(`.email-capture-e2e/${files[0]}`, "utf8"));
  expect(email.to).toBe("team@example.com");
  expect(email.subject).toMatch(/OR-\d{5}/);
});

test("SM-07 + SM-08 + SM-09 + SM-10: catalogue admin, create, edit, deactivate", async ({ page }) => {
  await login(page, "supply@example.com");
  await page.goto("/admin/catalogue");
  await expect(page.locator("body")).toContainText("Retired Mop"); // SM-07: inactive visible
  // SM-08: create
  await page.click("a:has-text('New product')");
  await page.fill('input[name="name"]', "Test Bucket");
  await page.fill('input[name="price"]', "12.50");
  await page.click("button:has-text('Save product')");
  await expect(page.locator("body")).toContainText("Test Bucket");
  // SM-09: edit price
  await page.click("a:has-text('Test Bucket')");
  await page.fill('input[name="price"]', "13.00");
  await page.click("button:has-text('Save product')");
  await expect(page.locator("body")).toContainText("$13.00");
  // SM-10: deactivate → hidden from cleaner
  await page.click("a:has-text('Test Bucket')");
  await page.uncheck('input[name="active"]');
  await page.click("button:has-text('Save product')");
  await page.context().clearCookies();
  await login(page, "cleaner@example.com");
  await page.goto("/supplies/catalogue");
  await expect(page.locator("body")).not.toContainText("Test Bucket");
});
```

Create `tests/e2e/access.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("A-01 + A-03: admin sees supply screens plus platform areas", async ({ page }) => {
  await login(page, "admin@example.com");
  await expect(page).toHaveURL(/\/admin\/orders/);
  await expect(page.locator("aside")).toContainText("Order requests");
  await expect(page.locator("aside")).toContainText("Bookings");
  await page.goto("/admin/bookings");
  await expect(page.locator("body")).toContainText(/coming soon/i);
});

test("A-02: admin can open order detail and update status", async ({ page }) => {
  await login(page, "admin@example.com");
  await page.goto("/admin/orders");
  await page.getByTestId("admin-order-row").first().locator("a").click();
  await page.getByTestId("status-select").selectOption("PAID");
  await page.getByTestId("save-status").click();
  await expect(page.getByTestId("status-timeline")).toContainText("Paid");
});

test("M-01 + M-02: manager has no supply nav and direct URLs are denied", async ({ page }) => {
  await login(page, "manager@example.com");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("body")).not.toContainText("Order requests");
  await page.goto("/admin/orders");
  await expect(page).not.toHaveURL(/\/admin\/orders/); // redirected
  await page.goto("/supplies");
  await expect(page).not.toHaveURL(/\/supplies$/);
});

test("U-01: customer sees no supply ordering", async ({ page }) => {
  await login(page, "customer@example.com");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("body")).not.toContainText("Supplies");
});

test("SM-01 disabled variant: staff lose supply screens when feature is off", async ({ page }) => {
  const { setFeature } = await import("./helpers");
  await setFeature(page, false);
  await login(page, "supply@example.com");
  await expect(page.locator("aside")).not.toContainText("Order requests");
  await setFeature(page, true);
});
```

Create `tests/e2e/sync.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("S-01 smoke: refresh imports products from the (mock) store", async ({ page }) => {
  await login(page, "supply@example.com");
  await page.goto("/admin/imports");
  await page.getByTestId("refresh-catalogue").click();
  await expect(page.locator("body")).toContainText(/Added \d+, updated \d+/);
  await expect(page.getByTestId("import-row").first()).toContainText("SUCCEEDED");
  await page.goto("/admin/catalogue");
  await expect(page.locator("body")).toContainText("Pro Mop"); // from fixture
});
```

- [ ] **Step 4: Run the suite, commit**

Run: `npm run test:e2e`
Expected: all E2E tests PASS. (First run: `docker compose up -d` must be active.)

```bash
git add -A && git commit -m "test: playwright e2e suite covering spec scenarios"
```

---

### Task 20: Full verification sweep

**Files:**
- Modify: `package.json` (add `check` script)

- [ ] **Step 1: Add the aggregate script**

```json
"check": "npm run lint && npm run typecheck && npm test && npm run test:int && npm run test:e2e"
```

- [ ] **Step 2: Run everything**

Run: `npm run check`
Expected: lint clean, typecheck clean, all unit + integration + E2E tests pass.

- [ ] **Step 3: Manual smoke of the real store sync**

Run: `npm run dev`, sign in as `supply@example.com`, Import history → Refresh catalogue (env default hits the live store). Expected: SUCCEEDED run with several hundred added products; cleaner catalogue shows them grouped/filterable.

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "chore: aggregate check script; full suite green"
```

---

## Plan Self-Review Notes

- **Spec coverage:** C-01…C-10 (C-06 at integration level + manual UI shake), SM-01…SM-11 (SM-11 = S-03 integration test + SM-10 E2E visibility), A-01…A-03, M-01/M-02, U-01, S-01…S-04 (integration; S-01 E2E smoke) — all mapped. Feature toggle (Task 6 guards, Task 13 settings page, E2E disabled variants). Price history (Tasks 11, 12). Audit for manual products (Task 11). Import history screen (Task 18).
- **Type consistency:** `guardAction(roles: Role[])` throws / `requireRole(...roles)` redirects — distinct on purpose; `SubmitResult`, `CatalogueLine`, `ProductInput`, `TimelineEvent` are each defined once and imported everywhere else.
- **Known deviation from design doc:** JWT sessions instead of Prisma-adapter DB sessions (credentials provider constraint); noted in Task 6. `guardAction` intentionally bypassed in `toggleSupplyAction` so admins can re-enable a disabled feature — documented in Task 13.









