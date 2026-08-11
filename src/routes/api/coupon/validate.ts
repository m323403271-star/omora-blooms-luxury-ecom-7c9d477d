import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/coupon/validate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { code?: string; amount?: number };
        try {
          body = await request.json();
        } catch {
          return Response.json({ valid: false, reason: "Invalid request" }, { status: 400 });
        }
        const { validateCoupon } = await import("@/lib/coupon.server");
        const result = await validateCoupon(String(body.code ?? ""), Number(body.amount ?? 0));
        return Response.json(result);
      },
    },
  },
});
