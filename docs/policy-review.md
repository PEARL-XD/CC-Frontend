# Public policies and app verification

## Deploy the React website first

The combined policy page remains at https://cleanchops.in/info. Existing
/info#privacy, /info#terms and /info#delivery links continue to work.

Public links for the same policy content:

- https://cleanchops.in/privacy-policy
- https://cleanchops.in/terms-and-conditions
- https://cleanchops.in/refund-cancellation-policy
- https://cleanchops.in/shipping-delivery-policy
- https://cleanchops.in/contact-us

These pages do not require login and do not wait for the authentication backend.
Keep the existing static-site rewrite to /index.html so direct links work.

Before publishing, confirm the policy content with the business owner. In
particular, delivery remains 60-90 minutes, quality issues should be reported
within 2 hours, and eligible prepaid cancellation refunds are normally initiated
within 24-48 hours (bank credit is separate). These values reflect existing
app/backend text, not new gateway guarantees.

The owner supplied the business name CleanChops, operator name PEARL, and business
address on 17 October 2026. These appear in the public policy content. No PAN
number, GST number or other registration identifier has been provided or added.
Do not invent these details or publish placeholder values.

## Google Play and Cashfree are separate from website deployment

Updating this repository does not update the Google Play listing or the Flutter
app's built-in policy text.

After deployment, open the privacy policy URL in an incognito browser. In Google
Play Console, open the app's App content page and update the Privacy policy URL
to https://cleanchops.in/privacy-policy, then save and submit the listing change
as instructed by Play Console.

For Cashfree re-verification, provide the existing Android Play Store listing
and the public combined policy link, and specify the individual policy links
if requested. Approval is decided by Cashfree. A website edit alone does not
establish that their in-app policy requirements have been satisfied. The current
Flutter /legal route is public, but its built-in content is separate from this
website and does not yet include these additional refund/contact sections.

## Verification

Run npm test for policy data/routing and existing payment utility tests.
Optional real-browser tests require Playwright, a browser installation and a
running site. Set POLICY_TEST_BASE_URL to the site's URL; the default local test
URL is https://localhost:5177. PW_BROWSER_CHANNEL can select msedge or chrome.
PLAYWRIGHT_MODULE can point to an external Playwright index.mjs installation.
Browser checks explicitly report skipped if Playwright is unavailable.

Browser tests use isolated sessions and mock API responses. They cover guests,
stalled session refresh, authenticated viewing, protected profile navigation,
existing fragments and 320/390/1440px layouts. They do not place live orders.

References:
- https://support.google.com/googleplay/android-developer/answer/9859455
- https://www.cashfree.com/tnc
