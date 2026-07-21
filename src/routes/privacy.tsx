import { createFileRoute } from "@tanstack/react-router";
import { PolicyLayout } from "./shipping";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — OMORA BLOOMS" }] }),
  component: () => (
    <PolicyLayout eyebrow="Policy" title="Privacy Policy">
      <p>Your trust is essential to us. This policy explains what information we collect, how we use it and your rights.</p>
      <h2>What we collect</h2>
      <p>We collect information you voluntarily provide — name, email, phone number, delivery address and order details — as well as anonymized analytics to improve the site.</p>
      <h2>How we use it</h2>
      <p>To process orders, communicate with you, personalize your experience and improve our services. We never sell your data.</p>
      <h2>Third-party services</h2>
      <p>Payment processing (Razorpay), shipping (DHL/FedEx/local couriers) and analytics providers receive only what's necessary to fulfill their function.</p>
      <h2>Your rights</h2>
      <p>You can request access, correction or deletion of your data by writing to hello@omorablooms.com.</p>
    </PolicyLayout>
  ),
});
