import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLivePayment, checkoutReference } from '../src/utils/cashfree.js';

const id = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const response = { localOrderId: id, cashfreeOrderId: `cc_${id}`, paymentProvider: 'cashfree', environment: 'production', currency: 'INR', amount: 28000, paid: false, paymentStatus: 'PENDING' };

test('web checkout rejects sandbox, changed identity, client success and invalid amounts', () => {
  assert.equal(validateLivePayment(response, id), response);
  for (const changes of [{ environment: 'sandbox' }, { amount: 0 }, { amount: 1.5 }, { currency: 'USD' }, { paid: true }, { cashfreeOrderId: 'other' }]) {
    assert.throws(() => validateLivePayment({ ...response, ...changes }, id));
  }
  assert.throws(() => validateLivePayment(response, 'bbbbbbbbbbbbbbbbbbbbbbbb'));
});

test('web retries persist one request; changed cart/account get separate references', () => {
  const map = new Map();
  const storage = { getItem: (key) => map.get(key), setItem: (key, value) => map.set(key, value) };
  let n = 0;
  const next = () => `request-${++n}`;
  const first = checkoutReference(storage, id, { cartItems: [1], locationKey: 'home' }, next);
  assert.deepEqual(checkoutReference(storage, id, { cartItems: [1], locationKey: 'home' }, next), first);
  assert.notEqual(checkoutReference(storage, 'other', { cartItems: [1], locationKey: 'home' }, next).requestId, first.requestId);
  assert.notEqual(checkoutReference(storage, id, { cartItems: [1], locationKey: 'office' }, next).requestId, first.requestId);
});

test('storage failure stops checkout instead of losing its retry reference', () => {
  assert.throws(() => checkoutReference({ getItem() {}, setItem() { throw new Error('storage blocked'); } }, id, {}, () => 'test'), /storage blocked/);
});
