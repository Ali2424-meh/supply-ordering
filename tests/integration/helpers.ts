import { vi } from "vitest";
import { PrismaClient, Role, User } from "@prisma/client";
import bcrypt from "bcryptjs";

export const db = new PrismaClient();

const authState = vi.hoisted(() => ({ currentUser: null as User | null }));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () =>
    authState.currentUser
      ? {
          user: {
            id: authState.currentUser.id,
            name: authState.currentUser.name,
            email: authState.currentUser.email,
            role: authState.currentUser.role,
          },
        }
      : null,
  ),
  homeFor: vi.fn(() => "/"),
}));

// Cache invalidation requires a live Next.js request store, which Vitest does
// not provide. The database and all cart behavior remain real in these tests.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

export function asUser(user: User | null) {
  authState.currentUser = user;
}

export async function resetDb() {
  await db.$executeRawUnsafe(
    `TRUNCATE "OrderEvent","OrderItem","Order","CartItem","PriceHistory","AuditEvent","ImportRun","Product","User","Setting" CASCADE`,
  );
  await db.$executeRawUnsafe(`ALTER SEQUENCE order_number_seq RESTART WITH 1`);
  await db.setting.create({
    data: { key: "supplyOrderingEnabled", value: "true" },
  });
  authState.currentUser = null;
}

const hash = bcrypt.hashSync("password123", 4);
let n = 0;

export async function makeUser(role: Role, overrides: Partial<User> = {}) {
  n += 1;
  return db.user.create({
    data: {
      name: `User ${n}`,
      email: `u${n}@t.test`,
      passwordHash: hash,
      role,
      ...overrides,
    },
  });
}

export async function makeProduct(overrides: Record<string, unknown> = {}) {
  n += 1;
  return db.product.create({
    data: {
      name: `Product ${n}`,
      priceCents: 1000,
      active: true,
      source: "MANUAL",
      ...overrides,
    },
  });
}
