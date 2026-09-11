# Fix Razorpay domain mismatch

## Changes
- Add one shared payment-origin check using the live OMORA BLOOMS domains.
- Pass the browser origin to both cart and direct-product order creation requests and validate it server-side.
- Prevent Razorpay from opening on editor/preview domains; send customers to the matching live product page instead with a clear message.
- Return detailed payment-start errors rather than hiding gateway configuration failures.
- Verify both checkout paths and document the exact Razorpay website and webhook URLs that must be registered.

## Technical details
- Live checkout origins: `https://omorablooms.in` and `https://www.omorablooms.in`.
- Webhook URL: `https://omorablooms.in/api/public/razorpay-webhook` (or the chosen primary `www` equivalent).
- Razorpay’s website allowlist is enforced against the actual browser origin; an order payload cannot override it.
