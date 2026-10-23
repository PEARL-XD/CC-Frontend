# Google Ads website tag

The owner supplied tag ID `AW-18474051740` from the CleanChops Google Ads
installation screen on 23 October 2026. The shared `index.html` installs it once
for the React website, including guest, login, checkout and policy pages.
No new Render environment variable or JavaScript dependency is required.

The external script loads asynchronously; sign-in, catalogue and checkout never
wait for it. Blocked advertising requests must not block the application.
No Flutter, API, payment verification or campaign bidding settings are changed.

## Privacy defaults

This initial installation denies `ad_storage`, `analytics_storage`,
`ad_user_data` and `ad_personalization` before configuring the tag. Advertising
data redaction is enabled and personalisation signals are disabled.
Google can still send limited cookieless measurement pings (advanced consent
mode); this is not a zero-network-request implementation.

This patch does not introduce a consent banner, assume consent from login or
automatically grant any consent. Cookie-based measurement stays disabled.
If the business later enables consent-based measurement, implement an explicit
visitor choice, persistence, revocation and consent updates before enabling it.
Review the public privacy disclosure and business consent requirements before
publishing. Consent mode alone does not establish legal compliance.

## Purchase events

The owner supplied the Purchase action on 23 October 2026. Its visible Google
Ads details were read directly to confirm the exact, case-sensitive label:

- Conversion ID: `18474051740`
- Conversion label: `25hhCMi89YQdEJzRjulE`
- Destination: `AW-18474051740/25hhCMi89YQdEJzRjulE`

`src/utils/googleAds.js` observes successful checkout API responses from
`PaymentPage`. A production Cashfree order must be backend-confirmed as PAID,
have a valid matching order ID and INR amount, and be CONFIRMED, PACKED,
OUT_FOR_DELIVERY or DELIVERED without a refund. Session retrieval, payment
verification and an idempotent creation retry can confirm the same purchase.
Gateway callbacks alone, pending/failed payments and cancelled/refunded orders
do not count. Opening a payment or order-history page never counts.

The owner chose to include successfully placed COD orders. The reporter also
accepts a successful `/orders/create` response only when both the request and
response explicitly identify COD and no online payment is required. This does
not change the order's PENDING payment state or claim cash was collected.
The current React payment UI only creates ONLINE/Cashfree orders; no COD choice
is added by this tracking patch. COD response handling is ready for a future
web COD flow, but it does not track native-app COD orders or backfill old orders.

Events contain only destination, order ID, server amount converted from paise
to INR, and currency. Per-tab deduplication is bounded at 256 orders and uses no
advertising cookies or persistent storage. Reloads/tabs can send the same ID
again; Google Ads deduplicates the Purchase action by `transaction_id`.
Queuing is not proof that Google received or attributed an event. Blockers,
network failures and consent restrictions can limit measurement.

Reporting failures are caught and never delay checkout, change payment status,
or prevent cart cleanup. Native Android/iOS purchase analytics, cross-device
attribution and refund conversion adjustments are separate work, not enabled
by installing the website tag.

## Deployment and verification

1. Run `npm test` and `npm run build`, then deploy the React static site.
2. Open `https://cleanchops.in` with an advertising blocker disabled for the test.
3. Use Google Ads **Test connection**, or connect Google Tag Assistant to the site.
4. Confirm `AW-18474051740` is detected and the four consent defaults are denied.
5. Confirm home, login and checkout still work if the Google tag request is blocked.
6. With Tag Assistant connected, complete an authorised website test purchase.
   Verify one Purchase event with the exact destination, actual INR value and
   order ID. Checking the same order again must not queue another event in the
   same tab. Do not submit fake conversion events to the production account.
7. Confirm cancelling checkout and checking unpaid/cancelled orders do not emit
   a purchase. Test live detection and attribution separately from local mocks.

A successful local build is not proof of live detection. Google Ads diagnostics
may need time to refresh; deployment and verification are still required. This
change requires a website deployment, not an App Store or Play Store release.

References:
- https://developers.google.com/tag-platform/gtagjs
- https://developers.google.com/tag-platform/security/guides/consent
- https://developers.google.com/tag-platform/devguides/conversions
- https://support.google.com/google-ads/answer/6386790
