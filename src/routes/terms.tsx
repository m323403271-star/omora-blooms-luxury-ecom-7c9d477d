import { createFileRoute } from "@tanstack/react-router";
import { PolicyLayout } from "./shipping";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms & Conditions — OMORA BLOOMS" }] }),
  component: () => (
    <PolicyLayout eyebrow="Policy" title="Terms & Conditions">
      <p>By using this website and placing an order with OMORA BLOOMS, you agree to the following terms.</p>
      <h2>Products</h2>
      <p>All products are handmade. Slight variations in color, size and finish are inherent to handcraft and are not defects.</p>
      <h2>Pricing</h2>
      <p>All prices are in Indian Rupees (INR) and inclusive of applicable taxes unless noted. International orders may incur additional duties.</p>
      <h2>Orders</h2>
      <p>Orders are confirmed once payment is received. Custom orders begin production only after design approval.</p>
      <h2>Intellectual property</h2>
      <p>All content, imagery, designs and the OMORA BLOOMS logo are protected. Reproduction or reuse is not permitted without written consent.</p>
      <h2>Liability</h2>
      <p>OMORA BLOOMS is not liable for delivery delays caused by third-party couriers or events outside our reasonable control.</p>
    </PolicyLayout>
  ),
});
