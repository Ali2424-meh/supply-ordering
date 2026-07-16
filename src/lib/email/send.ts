import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { render } from "@react-email/components";
import { Resend } from "resend";
import {
  OrderSubmittedEmail,
  type OrderSubmittedEmailProps,
} from "./OrderSubmittedEmail";

export type { OrderSubmittedEmailProps };

export async function sendOrderSubmittedEmail(
  props: OrderSubmittedEmailProps,
): Promise<void> {
  const to = process.env.TEAM_INBOX?.trim();
  if (!to) throw new Error("TEAM_INBOX is not configured.");
  const subject = `New supply order ${props.orderNumber} from ${props.workerName}`;
  const html = await render(OrderSubmittedEmail(props));

  if (process.env.EMAIL_MODE === "capture") {
    const dir =
      process.env.EMAIL_CAPTURE_DIR ?? path.join(process.cwd(), ".email-capture");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, `${props.orderNumber}.json`),
      JSON.stringify({ to, subject, html, props }, null, 2),
    );
    return;
  }

  const from = process.env.EMAIL_FROM?.trim();
  if (!from) throw new Error("EMAIL_FROM is not configured.");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  });
  if (error) throw new Error(`Order email failed: ${error.message}`);
}
