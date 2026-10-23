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

## Purchases are not configured yet

The base tag is not a purchase conversion. No conversion events are emitted and
no purchase conversion label has been supplied. Obtain the Purchase conversion
event snippet from this Google Ads account before implementing that event.
Do not mark payment-page visits, order-history visits, gateway launches or
unverified client callbacks as purchases.

Future purchase measurement must use the backend-confirmed order result, the
correct INR amount and a stable transaction/order ID to avoid duplicate counts.
Decide separately whether confirmed COD orders count. Website installation does
not track purchases made inside the native Android/iOS apps.

## Deployment and verification

1. Run `npm test` and `npm run build`, then deploy the React static site.
2. Open `https://cleanchops.in` with an advertising blocker disabled for the test.
3. Use Google Ads **Test connection**, or connect Google Tag Assistant to the site.
4. Confirm `AW-18474051740` is detected and the four consent defaults are denied.
5. Confirm home, login and checkout still work if the Google tag request is blocked.

A successful local build is not proof of live detection. Google Ads diagnostics
may need time to refresh; conversion setup can remain incomplete until its event
is configured and verified. This change requires a website deployment, not an
App Store or Play Store release.

References:
- https://developers.google.com/tag-platform/gtagjs
- https://developers.google.com/tag-platform/security/guides/consent
- https://developers.google.com/tag-platform/devguides/conversions
