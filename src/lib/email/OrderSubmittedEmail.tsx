import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { formatAud } from "@/lib/format";

export type OrderSubmittedEmailProps = {
  orderNumber: string;
  workerName: string;
  workerEmail: string;
  items: Array<{
    name: string;
    variant: string | null;
    quantity: number;
    priceCents: number;
  }>;
  totalCents: number;
};

export function OrderSubmittedEmail(props: OrderSubmittedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", color: "#18181b" }}>
        <Container>
          <Heading as="h2">New supply order {props.orderNumber}</Heading>
          <Text>
            {props.workerName} ({props.workerEmail}) submitted a supply request.
          </Text>
          <Section>
            {props.items.map((item, index) => (
              <Row key={index}>
                <Column>
                  {item.name}
                  {item.variant ? ` — ${item.variant}` : ""} × {item.quantity}
                </Column>
                <Column align="right">
                  {formatAud(item.priceCents * item.quantity)}
                </Column>
              </Row>
            ))}
            <Row>
              <Column>
                <strong>Total</strong>
              </Column>
              <Column align="right">
                <strong>{formatAud(props.totalCents)}</strong>
              </Column>
            </Row>
          </Section>
          <Text>Contact the worker to confirm the order and arrange payment.</Text>
        </Container>
      </Body>
    </Html>
  );
}
