import test from 'node:test';
import assert from 'node:assert/strict';
import { cashfreePayloadForRetry, paymentChoice, checkoutPayload, validateCreatedOrder, validateRazorpayOrder, readPendingCheckout } from '../src/utils/checkout.js';
import { checkoutReference } from '../src/utils/cashfree.js';
import { openRazorpay } from '../src/utils/razorpay.js';

const id = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const cartItems = [{ _id: 'product', selectedSize: '500', quantity: '2', price: 0.01, cutInstruction: 'Curry cut' }];
const legacy = { success: true, localOrderId: id, amount: 25900, currency: 'INR', paymentMethod: 'ONLINE', requiresPayment: true, razorpayKeyId: 'rzp_live_fixture', razorpayOrderId: 'order_fixture' };

test('UPI, cards and netbanking default to Cashfree even after choosing Razorpay', () => {
  for (const method of ['upi', 'card', 'netbanking']) {
    const choice = paymentChoice(method, 'razorpay');
    assert.equal(choice.provider, 'cashfree');
    const body = checkoutPayload({ cartItems, choice, schedule: 'Evening 6-8 PM', silentDelivery: true, couponCode: 'SAVE10', locationKey: 'home' });
    assert.equal(body.checkoutMethod, method);
    assert.equal(body.paymentProvider, 'cashfree');
    assert.equal(body.paymentMethod, 'ONLINE');
    assert.equal(body.silentDelivery, true);
    assert.equal(body.schedule, 'Evening 6-8 PM');
    assert.equal(body.couponCode, 'SAVE10');
    assert.equal(body.cartItems[0].quantity, 2);
    assert.equal('price' in body.cartItems[0], false, 'only the backend determines the charge');
  }
});

test('More offers Cashfree all-method checkout or the existing Razorpay contract', () => {
  const cashfree = checkoutPayload({ cartItems, choice: paymentChoice('more') });
  assert.equal(cashfree.checkoutMethod, 'all');
  const razorpay = checkoutPayload({ cartItems, choice: paymentChoice('more', 'razorpay') });
  assert.equal(razorpay.paymentProvider, 'razorpay');
  assert.equal('checkoutMethod' in razorpay, false);
  assert.throws(() => paymentChoice('more', 'untrusted'));
  assert.throws(() => paymentChoice('unknown'));
});

test('an unpaid checkout created by the old UI keeps its original Cashfree identity', () => {
  const previous = { cartItems: [{ _id: 'product', selectedSize: 500, quantity: 2 }], schedule: null, silentDelivery: false, paymentMethod: 'ONLINE', paymentProvider: 'cashfree', locationKey: 'home' };
  const requestId = 'd543c8bf-80e2-4ad0-a510-599100946d60';
  const saved = { requestId, payload: JSON.stringify(previous) };
  const storage = { getItem: () => JSON.stringify(saved), setItem() { throw new Error('Must not replace an old in-flight request'); } };
  const payload = checkoutPayload({ cartItems: previous.cartItems, choice: paymentChoice('upi'), locationKey: 'home' });
  const recovered = cashfreePayloadForRetry(storage, id, payload);
  assert.deepEqual(recovered, previous);
  assert.equal(checkoutReference(storage, id, recovered).requestId, requestId);
  const changed = { ...payload, locationKey: 'office' };
  assert.equal(cashfreePayloadForRetry(storage, id, changed), changed);
});

test('COD never opens an online provider and silent delivery rejects COD', () => {
  const body = checkoutPayload({ cartItems, choice: paymentChoice('cod') });
  assert.equal(body.paymentMethod, 'COD');
  assert.equal('paymentProvider' in body, false);
  assert.equal('checkoutMethod' in body, false);
  assert.throws(() => checkoutPayload({ cartItems, choice: paymentChoice('cod'), silentDelivery: true }));
  assert.throws(() => checkoutPayload({ cartItems: [], choice: paymentChoice('upi') }));
});

test('legacy and COD order responses must be successful server contracts', () => {
  assert.equal(validateCreatedOrder(legacy, paymentChoice('more', 'razorpay')).paymentProvider, 'razorpay');
  for (const changes of [{ success: false }, { localOrderId: 'bad' }, { amount: 1.5 }, { currency: 'USD' }, { razorpayOrderId: 'bad' }, { razorpayKeyId: 'bad' }, { requiresPayment: false }, { paymentProvider: 'cashfree' }]) {
    assert.throws(() => validateCreatedOrder({ ...legacy, ...changes }, paymentChoice('more', 'razorpay')));
  }
  const cod = { success: true, localOrderId: id, amount: 800, currency: 'INR', paymentMethod: 'COD', requiresPayment: false };
  assert.equal(validateCreatedOrder(cod, paymentChoice('cod')).paid, false);
  assert.throws(() => validateCreatedOrder({ ...cod, requiresPayment: true }, paymentChoice('cod')));
});

test('Razorpay success requires a matching paid backend order, not just an SDK callback', () => {
  const order = { _id: id, razorpayOrderId: legacy.razorpayOrderId, totalAmount: 259, paymentMethod: 'ONLINE', paymentStatus: 'PAID', orderStatus: 'CONFIRMED' };
  assert.equal(validateRazorpayOrder(order, legacy).paid, true);
  for (const changes of [{ _id: 'other' }, { totalAmount: 1 }, { totalAmount: '259' }, { razorpayOrderId: 'other' }, { paymentProvider: 'cashfree' }, { paymentMethod: 'COD' }, { paymentStatus: 'success' }]) {
    assert.throws(() => validateRazorpayOrder({ ...order, ...changes }, legacy));
  }
});

test('pending checkouts restore their provider but reject corrupt local state', () => {
  const saved = { version: 1, stage: 'ready', choice: paymentChoice('more', 'razorpay'), payload: { cartItems }, order: legacy };
  assert.equal(readPendingCheckout({ getItem: () => JSON.stringify(saved) }, 'key').order.localOrderId, id);
  for (const value of ['broken', '{}', JSON.stringify({ ...saved, order: { ...legacy, amount: 0 } })]) {
    assert.equal(readPendingCheckout({ getItem: () => value }, 'key'), null);
  }
});

test('Razorpay wrapper settles once and passes only the server order to checkout', async () => {
  let options;
  class Razorpay { constructor(input) { options = input; } open() { options.handler({ razorpay_payment_id: 'pay_fixture' }); options.modal.ondismiss(); } }
  assert.deepEqual(await openRazorpay(Razorpay, legacy, { name: 'Test' }), { razorpay_payment_id: 'pay_fixture' });
  assert.equal(options.order_id, legacy.razorpayOrderId);
  assert.equal(options.amount, legacy.amount);
  assert.equal(await openRazorpay(class { constructor(input) { this.options = input; } open() { this.options.modal.ondismiss(); } }, legacy), null);
  await assert.rejects(openRazorpay(class { open() { throw new Error('SDK failed'); } }, legacy), /SDK failed/);
});
