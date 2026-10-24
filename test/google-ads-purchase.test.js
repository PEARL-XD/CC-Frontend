import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createPurchaseReporter, PURCHASE_DESTINATION } from '../src/utils/googleAds.js';

const id = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const secondId = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const path = `/payments/cashfree/orders/${id}/verify`;
const paid = {
  localOrderId: id, cashfreeOrderId: `cc_${id}`, paymentProvider: 'cashfree',
  environment: 'production', currency: 'INR', amount: 12345, paid: true,
  paymentStatus: 'PAID', orderStatus: 'CONFIRMED', refundStatus: null,
};
const cod = { success: true, localOrderId: id, paymentMethod: 'COD', requiresPayment: false, amount: 800, currency: 'INR' };

function setup() {
  const calls = [];
  const browser = { gtag: (...args) => calls.push(args) };
  return { calls, browser, report: createPurchaseReporter(() => browser) };
}

test('confirmed production payment reports the exact Purchase label, INR value and order ID', () => {
  const { report, calls } = setup();
  assert.equal(report(path, paid), true);
  assert.deepEqual(calls, [['event', 'conversion', {
    send_to: 'AW-18474051740/25hhCMi89YQdEJzRjulE', value: 123.45,
    currency: 'INR', transaction_id: id,
  }]]);
  assert.equal(PURCHASE_DESTINATION, calls[0][2].send_to);
});

test('session, verification and repeated checks queue the same order only once per tab', () => {
  const { report, calls } = setup();
  assert.equal(report(`/payments/cashfree/orders/${id}/session`, paid), true);
  assert.equal(report(path, paid), false);
  assert.equal(report('/orders/create', paid, { paymentMethod: 'ONLINE' }), false);
  assert.equal(calls.length, 1);
  assert.equal(report(`/payments/cashfree/orders/${secondId}/verify`, {
    ...paid, localOrderId: secondId, cashfreeOrderId: `cc_${secondId}`,
  }), true);
  assert.equal(calls.length, 2);
});

test('a reload uses the same transaction ID so Google can deduplicate without advertising storage', () => {
  const calls = [];
  const browser = { gtag: (...args) => calls.push(args) };
  assert.equal(createPurchaseReporter(() => browser)(path, paid), true);
  assert.equal(createPurchaseReporter(() => browser)(path, paid), true);
  assert.equal(calls[0][2].transaction_id, calls[1][2].transaction_id);
});

test('pending, cancelled, failed, refunded, sandbox and inconsistent payments never count', () => {
  for (const changes of [
    { paid: false, paymentStatus: 'PENDING' }, { paid: false, paymentStatus: 'FAILED' },
    { orderStatus: 'CANCELLED' }, { orderStatus: 'PLACED' }, { orderStatus: undefined },
    { paymentStatus: 'PENDING' }, { paid: 'true' }, { environment: 'sandbox' },
    { refundStatus: 'SUCCESS' }, { currency: 'USD' }, { paymentProvider: 'razorpay' },
    { amount: 0 }, { amount: -100 }, { amount: 1.5 }, { amount: '800' }, { amount: NaN },
    { amount: Infinity }, { amount: Number.MAX_SAFE_INTEGER + 1 },
    { localOrderId: secondId }, { localOrderId: 'email@example.com' },
    { cashfreeOrderId: 'unrelated' },
  ]) {
    const { report, calls } = setup();
    assert.equal(report(path, { ...paid, ...changes }), false, JSON.stringify(changes));
    assert.equal(calls.length, 0);
    assert.equal(report(path, paid), true, 'invalid data must not mark the order reported');
  }
});

test('only known checkout responses count, never page loads, lists or gateway callbacks', () => {
  const { report, calls } = setup();
  for (const endpoint of ['/paymentpage', '/orderspage', '/orders/me', '/admin/orders',
    '/orders/verify', `/payments/cashfree/orders/${id}/diagnostics`, '/cashfree/callback', `${path}?paid=true`]) {
    assert.equal(report(endpoint, paid), false, endpoint);
  }
  assert.equal(report('/orders/create', paid), false);
  assert.equal(calls.length, 0);
});

test('accepted order statuses still use a paid server response', () => {
  for (const orderStatus of ['CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED']) {
    const { report } = setup();
    assert.equal(report(path, { ...paid, orderStatus }), true);
  }
});

test('successful COD creation counts at placement, without claiming it has been paid', () => {
  const { report, calls } = setup();
  assert.equal(report('/orders/create', cod, { paymentMethod: 'COD' }), true);
  assert.equal(report('/orders/create', cod, { paymentMethod: 'COD' }), false);
  assert.equal(calls[0][2].value, 8);
  assert.equal(calls[0][2].transaction_id, id);
  assert.equal('paid' in calls[0][2], false);
});

test('restored Razorpay checkout counts only a matching live server-verified payment', () => {
  const checkoutOrder = { localOrderId: id, amount: 800, currency: 'INR', razorpayOrderId: 'order_fixture', razorpayKeyId: 'rzp_live_fixture' };
  const body = { localOrderId: id, razorpay_order_id: 'order_fixture', checkoutOrder };
  const verified = { success: true, order: { _id: id, totalAmount: 8, razorpayOrderId: 'order_fixture', paymentMethod: 'ONLINE', paymentStatus: 'PAID', orderStatus: 'CONFIRMED' } };
  const { report, calls } = setup();
  assert.equal(report('/orders/verify', verified, body), true);
  assert.equal(report('/orders/verify', verified, body), false);
  assert.equal(calls[0][2].value, 8);
  assert.equal(calls[0][2].transaction_id, id);
  assert.equal(setup().report('/orders/verify', verified, { ...body, checkoutOrder: { ...checkoutOrder, razorpayKeyId: 'rzp_test_fixture' } }), false);
  assert.equal(setup().report('/orders/verify', verified, { ...body, localOrderId: secondId }), false);
  assert.equal(setup().report('/orders/verify', verified, { ...body, razorpay_order_id: 'order_other' }), false);
  for (const changes of [{ paymentStatus: 'PENDING' }, { orderStatus: 'CANCELLED' }, { totalAmount: 9 }, { refundStatus: 'SUCCESS' }, { _id: secondId }]) {
    assert.equal(setup().report('/orders/verify', { ...verified, order: { ...verified.order, ...changes } }, body), false);
  }
});

test('failed COD creation, wrong request method, invalid amount and cancellations cannot count', () => {
  for (const changes of [{ success: false }, { success: undefined }, { paymentMethod: 'ONLINE' },
    { requiresPayment: true }, { amount: 0 }, { amount: '800' }, { currency: 'USD' },
    { localOrderId: 'invalid' }, { orderStatus: 'CANCELLED' }]) {
    const { report, calls } = setup();
    assert.equal(report('/orders/create', { ...cod, ...changes }, { paymentMethod: 'COD' }), false);
    assert.equal(calls.length, 0);
  }
  assert.equal(setup().report('/orders/create', cod, { paymentMethod: 'ONLINE' }), false);
  assert.equal(setup().report('/orders/me', cod, { paymentMethod: 'COD' }), false);
});

test('tag absence, exceptions and unavailable browser storage cannot break checkout', () => {
  for (const getWindow of [() => undefined, () => ({}), () => { throw new Error('no browser'); },
    () => ({ gtag() { throw new Error('blocked'); } })]) {
    assert.equal(createPurchaseReporter(getWindow)(path, paid), false);
  }
  const { report, browser, calls } = setup();
  delete browser.gtag;
  assert.equal(report(path, paid), false);
  browser.gtag = (...args) => calls.push(args);
  Object.defineProperty(browser, 'localStorage', { get() { throw new Error('storage denied'); } });
  assert.equal(report(path, paid), true);
  assert.equal(calls.length, 1);
});

test('event payload only contains measurement fields and never customer or gateway secrets', () => {
  const { report, calls } = setup();
  report(path, { ...paid, name: 'Private', email: 'private@example.com', phone: '9999999999',
    deliveryAddress: { latitude: 28 }, paymentSessionId: 'secret', card: 'secret' });
  assert.deepEqual(Object.keys(calls[0][2]).sort(), ['currency', 'send_to', 'transaction_id', 'value']);
});

test('a confirmed response queues after the base tag even while the remote script is unavailable', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const bootstrap = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const browser = {};
  const context = { window: browser };
  runInNewContext(bootstrap, context);
  browser.gtag = context.gtag;
  assert.equal(createPurchaseReporter(() => browser)(path, paid), true);
  const events = browser.dataLayer.map((entry) => Array.from(entry));
  assert.deepEqual(events[0].slice(0, 2), ['consent', 'default']);
  assert.equal(events.at(-1)[2].send_to, PURCHASE_DESTINATION);
  assert.equal(events.at(-1)[2].transaction_id, id);
});
