import { createFileRoute } from "@tanstack/react-router";
import { PolicyLayout } from "./shipping";

export const Route = createFileRoute("/returns")({
  head: () => ({ meta: [{ title: "Returns — OMORA BLOOMS" }] }),
  component: () => (
    <PolicyLayout eyebrow="Policy" title="Return Policy">
      <p>Every OMORA BLOOMS piece is handmade to order with love. Because of the personal nature of our craft, we handle returns on a case-by-case basis.</p>
      <h2>Damaged in transit</h2>
      <p>If your order arrives damaged, contact us within 24 hours of delivery with photos. We'll replace or refund at no cost to you.</p>
      <h2>Made-to-order items</h2>
      <p>Custom bouquets, personalized items and bespoke orders are non-returnable and non-refundable once production has begun.</p>
      <h2>Cancellations</h2>
      <p>You may cancel a standard order within 12 hours of placement for a full refund. After production begins, cancellations may not be accepted.</p>
    </PolicyLayout>
  ),
});
