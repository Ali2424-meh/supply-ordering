import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { sendOrderSubmittedEmail } from "../../src/lib/email/send";

describe("SM-06 basis: order email", () => {
  afterEach(() => vi.unstubAllEnvs());

  test("capture mode writes subject, html and props to disk", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "email-"));
    vi.stubEnv("EMAIL_MODE", "capture");
    vi.stubEnv("EMAIL_CAPTURE_DIR", dir);
    vi.stubEnv("TEAM_INBOX", "team@example.com");

    await sendOrderSubmittedEmail({
      orderNumber: "OR-00042",
      workerName: "Cara Cleaner",
      workerEmail: "cara@x.test",
      items: [
        {
          name: "Glass Cleaner",
          variant: "5L",
          quantity: 2,
          priceCents: 1895,
        },
      ],
      totalCents: 3790,
    });

    const captured = JSON.parse(
      readFileSync(path.join(dir, "OR-00042.json"), "utf8"),
    );
    expect(captured.to).toBe("team@example.com");
    expect(captured.subject).toContain("OR-00042");
    expect(captured.html).toContain("Glass Cleaner");
    expect(captured.html).toContain("$37.90");
    expect(captured.props.totalCents).toBe(3790);
  });
});
