/* global process */
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const env = process.env;
const playwright = await import(env.PLAYWRIGHT_MODULE ? pathToFileURL(env.PLAYWRIGHT_MODULE).href : 'playwright').catch(() => null);
const options = { skip: !playwright && 'Install Playwright or set PLAYWRIGHT_MODULE to run browser checks.' };
const baseURL = env.POLICY_TEST_BASE_URL || 'https://localhost:5177';
const id = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const item = { _id: 'bbbbbbbbbbbbbbbbbbbbbbbb', name: 'Fresh boneless chicken - cleaned and cut', category: 'Uncooked', selectedSize: 500, quantity: 2, price: 125.5 };
let browser;
before(async () => { if (playwright) browser = await playwright.chromium.launch({ headless: true, channel: env.PW_BROWSER_CHANNEL || 'chrome' }); });
after(async () => { await browser?.close(); });

async function checkout(config = {}) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: config.width || 390, height: 844 } });
  const page = await context.newPage();
  const calls = [];
  const errors = [];
  let clears = 0;
  let paid = false;
  let cart = [item];
  let createAttempts = 0;
  let quoteAttempts = 0;
  let latestChoice;
  if (config.legacyReference) await context.addInitScript(({ id, item }) => {
    const payload = { cartItems: [{ _id: item._id, selectedSize: item.selectedSize, quantity: item.quantity }], schedule: null, silentDelivery: false, paymentMethod: 'ONLINE', paymentProvider: 'cashfree', locationKey: 'home' };
    localStorage.setItem(`cashfree_checkout_${id}`, JSON.stringify({ payload: JSON.stringify(payload), requestId: 'd543c8bf-80e2-4ad0-a510-599100946d60' }));
  }, { id, item });
  const legacy = { success: true, localOrderId: id, amount: 25900, currency: 'INR', paymentMethod: 'ONLINE', requiresPayment: true, razorpayKeyId: 'rzp_live_fixture', razorpayOrderId: 'order_fixture' };
  const cashfree = () => ({ success: true, localOrderId: id, cashfreeOrderId: `cc_${id}`, paymentProvider: 'cashfree', environment: 'production', currency: 'INR', amount: 25900, paid, paymentStatus: paid ? 'PAID' : 'PENDING', orderStatus: paid ? 'CONFIRMED' : 'PLACED', cashfreeStatus: paid ? 'PAID' : 'ACTIVE', paymentSessionId: 'session_fixture', checkoutMethod: latestChoice?.checkoutMethod || 'all' });
  const order = () => ({ _id: id, totalAmount: 259, razorpayOrderId: 'order_fixture', paymentMethod: latestChoice?.paymentMethod || 'ONLINE', paymentStatus: paid ? 'PAID' : 'PENDING', orderStatus: paid ? 'CONFIRMED' : 'PLACED', items: [item], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  page.on('pageerror', (error) => errors.push(error.message));
  await context.route(/googletagmanager\.com|googleadservices\.com|googlesyndication\.com/, (route) => route.abort());
  await context.route('https://sdk.cashfree.com/**', (route) => route.abort());
  await context.addInitScript(({ mode, noSDK }) => {
    window.__checkoutCalls = [];
    if (!noSDK) window.Cashfree = (settings) => ({ checkout: async (input) => {
      window.__checkoutCalls.push({ provider: 'cashfree', settings, input });
      if (mode === 'sdk-error') throw new Error('Fixture checkout error');
      return { paymentDetails: 'Fixture only' };
    } });
    window.Razorpay = class {
      constructor(settings) { this.settings = settings; }
      open() {
        window.__checkoutCalls.push({ provider: 'razorpay', input: { key: this.settings.key, order_id: this.settings.order_id, amount: this.settings.amount } });
        if (mode === 'pending') this.settings.modal.ondismiss();
        else this.settings.handler({ razorpay_order_id: 'order_fixture', razorpay_payment_id: 'pay_fixture', razorpay_signature: 'signature_fixture' });
      }
    };
  }, { mode: config.mode || 'paid', noSDK: config.noSDK });
  await context.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^.*\/api/, '');
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': baseURL, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' } });
    const body = request.postDataJSON() || {};
    calls.push({ path, body });
    const respond = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': baseURL, 'Access-Control-Allow-Credentials': 'true' }, body: JSON.stringify(data) });
    if (path === '/refresh-token') return respond({ accessToken: 'fixture-token' });
    if (path === '/me') return respond({ user: { _id: id, name: 'Checkout Tester', role: 'user', phone: '9876543210', deliveryLocation: { locationKey: 'home', serviceable: true } } });
    if (path === '/cart') return respond({ cart });
    if (path === '/storefront') {
      quoteAttempts++;
      if (config.feesFail && quoteAttempts <= 2) return respond({ error: 'Fixture unavailable' }, 503);
      return respond({ settings: { packagingFee: 5, platformFee: 3 } });
    }
    if (path === '/coupons/validate') return respond({ success: true, coupon: { code: 'SAVE10' }, discountAmount: 10, finalSubtotal: 241 });
    if (path === '/cart/clear') {
      clears++;
      if (config.clearFails) return respond({ error: 'Fixture cart failure' }, 503);
      cart = [];
      return respond({ success: true, cart });
    }
    if (path === '/orders/create') {
      createAttempts++;
      latestChoice = body;
      if (config.creationError && createAttempts === 1) return route.abort();
      if (body.paymentMethod === 'COD') return respond({ success: true, localOrderId: id, amount: 25900, currency: 'INR', paymentMethod: 'COD', requiresPayment: false });
      return respond(body.paymentProvider === 'cashfree' ? cashfree() : legacy);
    }
    if (path === `/payments/cashfree/orders/${id}/session`) return respond(cashfree());
    if (path === `/payments/cashfree/orders/${id}/verify`) {
      paid = !['pending', 'sdk-error'].includes(config.mode);
      if (config.verifyFails) return respond({ error: 'Fixture verification unavailable' }, 503);
      return respond(cashfree());
    }
    if (path === '/orders/verify') {
      if (config.verifyFails) return respond({ error: 'Fixture signature rejected' }, 400);
      paid = true;
      return respond({ success: true, order: order() });
    }
    if (path === '/orders/me') return respond({ orders: createAttempts ? [order()] : [] });
    return respond({});
  });
  await page.goto(`${baseURL}/cart`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Decline optional', exact: true }).click();
  await page.getByRole('button', { name: 'Checkout', exact: true }).waitFor();
  if (config.silent) await page.getByRole('button', { name: 'Silent delivery', exact: true }).click();
  await page.getByRole('button', { name: 'Checkout', exact: true }).click();
  await page.getByRole('heading', { name: 'Payment', exact: true }).waitFor();
  return { context, page, calls, errors, get clears() { return clears; }, get creates() { return createAttempts; } };
}

for (const [title, method] of [['UPI', 'upi'], ['Credit or debit card', 'card'], ['Net banking', 'netbanking'], ['More payment options', 'all']]) {
  test(`${title}: selecting only selects, one Continue opens Cashfree and verifies payment`, options, async () => {
    const f = await checkout();
    try {
      await f.page.getByRole('radio', { name: title, exact: true }).check();
      assert.equal(f.creates, 0);
      assert.equal(await f.page.getByText('Review final total', { exact: true }).count(), 0);
      assert.equal(await f.page.evaluate(() => window.__checkoutCalls.length), 0);
      await f.page.getByRole('button', { name: /Continue securely/ }).click();
      await f.page.waitForURL('**/orderspage');
      assert.equal(f.creates, 1);
      assert.equal(f.calls.find((call) => call.path === '/orders/create').body.checkoutMethod, method);
      assert.equal(f.clears, 1);
      const sdk = await f.page.evaluate(() => window.__checkoutCalls);
      assert.equal(sdk.length, 1);
      assert.equal(sdk[0].settings.mode, 'production');
      assert.equal(sdk[0].input.paymentSessionId, 'session_fixture');
      const events = await f.page.evaluate(() => window.dataLayer.filter((entry) => entry[0] === 'event' && entry[1] === 'conversion').map((entry) => entry[2]));
      assert.equal(events.length, 1);
      assert.equal(events[0].value, 259);
      assert.deepEqual(f.errors, []);
    } finally { await f.context.close(); }
  });
}

test('More offers Razorpay, labels it accurately, and verifies with the backend before clearing', options, async () => {
  const f = await checkout();
  try {
    await f.page.getByRole('radio', { name: 'More payment options', exact: true }).check();
    await f.page.getByRole('radio', { name: 'Razorpay', exact: true }).check();
    assert.equal(f.creates, 0);
    assert.ok(await f.page.getByText('Final payment is handled securely by Razorpay.', { exact: true }).isVisible());
    await f.page.getByRole('button', { name: /Continue securely/ }).click();
    await f.page.waitForURL('**/orderspage');
    assert.equal(f.calls.find((call) => call.path === '/orders/create').body.paymentProvider, 'razorpay');
    assert.equal(f.calls.filter((call) => call.path === '/orders/verify').length, 1);
    assert.equal(f.clears, 1);
    const events = await f.page.evaluate(() => window.dataLayer.filter((entry) => entry[0] === 'event' && entry[1] === 'conversion'));
    assert.equal(events.length, 1);
    assert.deepEqual(f.errors, []);
  } finally { await f.context.close(); }
});

test('choosing a direct method after Razorpay resets the provider to Cashfree', options, async () => {
  const f = await checkout();
  try {
    await f.page.getByRole('radio', { name: 'More payment options', exact: true }).check();
    await f.page.getByRole('radio', { name: 'Razorpay', exact: true }).check();
    await f.page.getByRole('radio', { name: 'Credit or debit card', exact: true }).check();
    assert.ok(await f.page.getByText('Final payment is handled securely by Cashfree.', { exact: true }).isVisible());
    await f.page.getByRole('button', { name: /Continue securely/ }).click();
    await f.page.waitForURL('**/orderspage');
    assert.equal(f.calls.find((call) => call.path === '/orders/create').body.paymentProvider, 'cashfree');
  } finally { await f.context.close(); }
});

test('COD creates one confirmed placement without opening either online gateway', options, async () => {
  const f = await checkout();
  try {
    await f.page.getByRole('radio', { name: 'Cash on delivery', exact: true }).check();
    await f.page.getByRole('button', { name: /Place order/ }).click();
    await f.page.waitForURL('**/orderspage');
    assert.equal(f.calls.find((call) => call.path === '/orders/create').body.paymentMethod, 'COD');
    assert.equal(await f.page.evaluate(() => window.__checkoutCalls.length), 0);
    assert.equal(f.clears, 1);
    assert.equal(await f.page.evaluate(() => window.dataLayer.filter((entry) => entry[0] === 'event' && entry[1] === 'conversion').length), 1);
  } finally { await f.context.close(); }
});

test('silent delivery disables COD and survives the request payload', options, async () => {
  const f = await checkout({ silent: true });
  try {
    assert.ok(await f.page.getByRole('radio', { name: 'Cash on delivery', exact: true }).isDisabled());
    await f.page.getByRole('button', { name: /Continue securely/ }).click();
    await f.page.waitForURL('**/orderspage');
    assert.equal(f.calls.find((call) => call.path === '/orders/create').body.silentDelivery, true);
  } finally { await f.context.close(); }
});

for (const provider of ['cashfree', 'razorpay']) {
  test(`${provider} cancellation keeps the cart and reuses the same order after reload`, options, async () => {
    const f = await checkout({ mode: 'pending' });
    try {
      if (provider === 'razorpay') {
        await f.page.getByRole('radio', { name: 'More payment options', exact: true }).check();
        await f.page.getByRole('radio', { name: 'Razorpay', exact: true }).check();
      }
      await f.page.getByRole('button', { name: /Continue securely/ }).click();
      await f.page.getByRole('button', { name: /Continue payment/ }).waitFor();
      assert.equal(f.clears, 0);
      await f.page.reload();
      await f.page.getByRole('button', { name: /Continue payment/ }).click();
      await f.page.getByRole('button', { name: /Continue payment/ }).waitFor();
      assert.equal(f.creates, 1);
      assert.equal(f.clears, 0);
      assert.equal(await f.page.evaluate(() => window.__checkoutCalls.at(-1).provider), provider);
      assert.equal(await f.page.evaluate(() => window.dataLayer.filter((entry) => entry[0] === 'event' && entry[1] === 'conversion').length), 0);
    } finally { await f.context.close(); }
  });
}

test('Cashfree network retry retains the same request ID rather than creating a second payment identity', options, async () => {
  const f = await checkout({ creationError: true });
  try {
    await f.page.getByRole('button', { name: /Continue securely/ }).click();
    await f.page.getByRole('alert').waitFor();
    await f.page.getByRole('button', { name: /Continue securely/ }).click();
    await f.page.waitForURL('**/orderspage');
    const creations = f.calls.filter((call) => call.path === '/orders/create');
    assert.equal(creations.length, 2);
    assert.equal(creations[0].body.requestId, creations[1].body.requestId);
  } finally { await f.context.close(); }
});

test('uncertain COD submission cannot silently place the order again, including after reload', options, async () => {
  const f = await checkout({ creationError: true });
  try {
    await f.page.getByRole('radio', { name: 'Cash on delivery', exact: true }).check();
    await f.page.getByRole('button', { name: /Place order/ }).click();
    await f.page.getByRole('alert').waitFor();
    assert.ok(await f.page.getByRole('button', { name: /Place order/ }).isDisabled());
    await f.page.reload();
    await f.page.getByRole('heading', { name: 'Payment', exact: true }).waitFor();
    assert.ok(await f.page.getByRole('button', { name: /Place order/ }).isDisabled());
    assert.equal(f.creates, 1);
  } finally { await f.context.close(); }
});

test('failed server verification never clears the cart or reports a purchase', options, async () => {
  const f = await checkout({ verifyFails: true });
  try {
    await f.page.getByRole('radio', { name: 'More payment options', exact: true }).check();
    await f.page.getByRole('radio', { name: 'Razorpay', exact: true }).check();
    await f.page.getByRole('button', { name: /Continue securely/ }).click();
    await f.page.getByRole('alert').waitFor();
    assert.equal(f.clears, 0);
    assert.equal(await f.page.evaluate(() => window.dataLayer.filter((entry) => entry[0] === 'event' && entry[1] === 'conversion').length), 0);
  } finally { await f.context.close(); }
});

test('SDK loading failure does not create an unpaid order', options, async () => {
  const f = await checkout({ noSDK: true });
  try {
    await f.page.getByRole('button', { name: /Continue securely/ }).click();
    await f.page.getByRole('alert').waitFor();
    assert.equal(f.creates, 0);
    assert.equal(f.clears, 0);
  } finally { await f.context.close(); }
});

test('charges load before Continue, and a quote failure can be retried without creating an order', options, async () => {
  const f = await checkout({ feesFail: true });
  try {
    await f.page.getByRole('button', { name: 'Retry charges', exact: true }).waitFor();
    assert.ok(await f.page.getByRole('button', { name: /Continue securely/ }).isDisabled());
    await f.page.getByRole('button', { name: 'Retry charges', exact: true }).click();
    await f.page.getByRole('button', { name: 'Continue securely | Rs 259.00', exact: true }).waitFor();
    assert.equal(f.creates, 0);
  } finally { await f.context.close(); }
});

test('coupon savings update the total before the single checkout action', options, async () => {
  const f = await checkout();
  try {
    await f.page.getByLabel('Coupon code', { exact: true }).fill('save10');
    await f.page.getByRole('button', { name: 'Apply', exact: true }).click();
    await f.page.getByRole('button', { name: 'Continue securely | Rs 249.00', exact: true }).waitFor();
    assert.equal(f.creates, 0);
    assert.equal(f.calls.find((call) => call.path === '/coupons/validate').body.code, 'save10');
  } finally { await f.context.close(); }
});

test('checkout from the former Cashfree-only page resumes its saved request instead of duplicating the order', options, async () => {
  const f = await checkout({ legacyReference: true });
  try {
    await f.page.getByRole('button', { name: /Continue securely/ }).click();
    await f.page.waitForURL('**/orderspage');
    const body = f.calls.find((call) => call.path === '/orders/create').body;
    assert.equal(body.requestId, 'd543c8bf-80e2-4ad0-a510-599100946d60');
    assert.equal('checkoutMethod' in body, false);
    assert.equal(f.creates, 1);
  } finally { await f.context.close(); }
});

test('a cart clear failure after COD can be retried without placing another order', options, async () => {
  const f = await checkout({ clearFails: true });
  try {
    await f.page.getByRole('radio', { name: 'Cash on delivery', exact: true }).check();
    await f.page.getByRole('button', { name: /Place order/ }).click();
    await f.page.getByRole('alert').waitFor();
    await f.page.getByRole('button', { name: 'View confirmed order', exact: true }).click();
    await f.page.getByRole('alert').waitFor();
    assert.equal(f.creates, 1);
    assert.equal(f.clears, 2);
  } finally { await f.context.close(); }
});

test('resuming from My Orders loads the server total and preserves a separate current cart', options, async () => {
  const f = await checkout();
  try {
    await f.page.goto(`${baseURL}/paymentpage?orderId=${id}`, { waitUntil: 'domcontentloaded' });
    await f.page.getByRole('button', { name: 'Continue payment | Rs 259.00', exact: true }).waitFor();
    assert.equal(await f.page.getByText(item.name, { exact: true }).count(), 0, 'do not show new cart items as part of an older order');
    assert.equal(await f.page.evaluate(() => window.__checkoutCalls.length), 0, 'loading an existing order must not open its gateway');
    await f.page.getByRole('button', { name: 'Continue payment | Rs 259.00', exact: true }).click();
    await f.page.waitForURL('**/orderspage');
    assert.equal(f.creates, 0);
    assert.equal(f.clears, 0, 'paying an older order must not empty the new cart');
  } finally { await f.context.close(); }
});

for (const width of [320, 390, 768, 1440]) {
  test(`checkout and provider options fit ${width}px with an accessible Continue button`, options, async () => {
    const f = await checkout({ width });
    try {
      await f.page.getByRole('radio', { name: 'More payment options', exact: true }).check();
      await f.page.getByRole('button', { name: /Continue securely/ }).waitFor();
      await f.page.getByRole('button', { name: /Continue securely/ }).isEnabled();
      assert.ok(await f.page.evaluate(() => Array.from(document.querySelectorAll('main label, main input, main footer')).every((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= window.innerWidth;
      })));
      await f.page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
      await f.page.screenshot({ path: join(tmpdir(), `cleanchops-checkout-${width}.png`), fullPage: true });
      assert.deepEqual(f.errors, []);
    } finally { await f.context.close(); }
  });
}
