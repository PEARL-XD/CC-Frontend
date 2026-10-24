# React checkout

The React payment choices mirror the Flutter payment-options page:

- UPI, credit/debit card and net banking default to Cashfree. The existing
  backend's `checkoutMethod` selects the corresponding hosted payment methods.
- More payment options exposes Cashfree (all methods) and Razorpay.
- COD places an order without launching a gateway. Silent delivery disables COD.
- Choosing an option does not create an order. Continue securely creates or
  resumes the order and opens the selected provider without a review-total step.

Totals include the public storefront's packaging/platform charges and validated
coupon savings. The backend remains authoritative for product prices, fees,
coupon eligibility, payment status and the actual gateway charge. The gateways,
not the React page, collect card or UPI details. No new environment keys or
backend/Flutter changes are required by this frontend patch.

## Recovery and compatibility

Cashfree keeps its persistent idempotency reference. Matching pending requests
from the former Cashfree-only page are reused without changing their original
fingerprint. Method-specific identity is used for new checkouts.

Pending checkout metadata is scoped to the signed-in user in session storage;
Cashfree session tokens and Razorpay signatures are not stored there. Retry uses
the same known order, not another create request. Ambiguous legacy/COD create
failures require reviewing My Orders before explicitly resetting checkout.
Those older backend routes do not have Cashfree's server-side idempotency.

Only backend-confirmed payments or successful COD creation clear the cart.
Resuming an older order from My Orders does not clear the customer's current cart.
Google Ads measurement retains the existing Cashfree/COD behavior and includes
live server-verified Razorpay payments, never SDK success callbacks alone.

## Verification

`npm test` includes unit checks and optional Playwright browser checks. Install
Playwright locally or set `PLAYWRIGHT_MODULE` to its `index.mjs`, run Vite on
`https://localhost:5177`, and set `PW_BROWSER_CHANNEL=chrome` to use installed
Chrome. `POLICY_TEST_BASE_URL` can override the test origin. These browser tests
mock all backend and gateway calls and block Google advertising requests; they
do not place real orders or send fake production conversions.

Before production sign-off, test each provider on the deployed, whitelisted
domain with an authorised transaction. Local mocks cannot confirm merchant
activation, domain approval, device UPI apps or actual bank settlement.
