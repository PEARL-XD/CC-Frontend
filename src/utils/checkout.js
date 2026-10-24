import { validateLivePayment } from './cashfree.js';

const orderIdPattern = /^[a-f0-9]{24}$/;
const onlineMethods = new Set(['upi', 'card', 'netbanking']);

export const paymentMethods = [
  { id: 'upi', title: 'UPI', description: 'Choose a UPI app through Cashfree', badge: 'Recommended' },
  { id: 'card', title: 'Credit or debit card', description: 'Pay securely using Cashfree' },
  { id: 'netbanking', title: 'Net banking', description: 'Supported banks through Cashfree' },
  { id: 'more', title: 'More payment options', description: 'Cashfree or Razorpay' },
  { id: 'cod', title: 'Cash on delivery', description: 'Pay when your order arrives', badge: 'No online payment' },
];

export function paymentChoice(method, provider = 'cashfree') {
  if (!paymentMethods.some((item) => item.id === method)) throw new Error('Choose a supported payment method.');
  if (method === 'more' && !['cashfree', 'razorpay'].includes(provider)) throw new Error('Choose a supported payment provider.');
  return { method, provider: method === 'cod' ? 'cod' : method === 'more' ? provider : 'cashfree' };
}

export function checkoutPayload({ cartItems, schedule, silentDelivery, couponCode, locationKey, choice }) {
  if (!cartItems?.length) throw new Error('Your cart is empty. Return to your cart to add items.');
  const selected = paymentChoice(choice.method, choice.provider);
  if (silentDelivery && selected.method === 'cod') throw new Error('Cash on delivery is unavailable with silent delivery.');
  return {
    cartItems: cartItems.map((item) => ({
      _id: item._id, selectedSize: Number(item.selectedSize), quantity: Number(item.quantity),
      cutInstruction: item.cutInstruction,
    })),
    schedule, silentDelivery: silentDelivery === true, couponCode: couponCode || undefined,
    locationKey: locationKey || '', paymentMethod: selected.method === 'cod' ? 'COD' : 'ONLINE',
    ...(selected.provider !== 'cod' ? { paymentProvider: selected.provider } : {}),
    ...(selected.provider === 'cashfree' ? { checkoutMethod: onlineMethods.has(selected.method) ? selected.method : 'all' } : {}),
  };
}

export function cashfreePayloadForRetry(storage, userId, payload) {
  try {
    const saved = JSON.parse(storage.getItem(`cashfree_checkout_${userId}`));
    if (!/^[a-f0-9-]{36}$/i.test(saved?.requestId || '')) return payload;
    const previous = JSON.parse(saved.payload);
    if (previous.checkoutMethod !== undefined || previous.paymentProvider !== 'cashfree' || previous.paymentMethod !== 'ONLINE') return payload;
    const fingerprint = (value) => JSON.stringify({
      cartItems: value.cartItems.map((item) => ({ _id: item._id, selectedSize: item.selectedSize,
        quantity: item.quantity, cutInstruction: item.cutInstruction || '' })),
      schedule: value.schedule || '', silentDelivery: value.silentDelivery === true,
      couponCode: (value.couponCode || '').trim().toUpperCase(), locationKey: value.locationKey || '',
    });
    // Preserve an in-flight checkout from the former UI before adding a method-specific identity.
    return fingerprint(previous) === fingerprint(payload) ? previous : payload;
  } catch { return payload; }
}

export function validateCreatedOrder(data, choice) {
  if (choice.provider === 'cashfree') return validateLivePayment(data);
  if (data?.success !== true || !orderIdPattern.test(data.localOrderId) || data.currency !== 'INR' ||
      !Number.isSafeInteger(data.amount) || data.amount <= 0) throw new Error('Order details could not be verified. Check My Orders before trying again.');
  if (choice.provider === 'cod') {
    if (data.paymentMethod !== 'COD' || data.requiresPayment !== false) throw new Error('Cash on delivery was not confirmed. Check My Orders.');
  } else if (data.paymentMethod !== 'ONLINE' || data.requiresPayment !== true ||
      (data.paymentProvider && data.paymentProvider !== 'razorpay') ||
      !/^rzp_(live|test)_\w+$/.test(data.razorpayKeyId || '') || !/^order_\w+$/.test(data.razorpayOrderId || '')) {
    throw new Error('Razorpay details could not be verified. Check My Orders before trying again.');
  }
  return { ...data, paymentProvider: choice.provider, paid: false, orderStatus: 'PLACED', paymentStatus: 'PENDING' };
}

export function validateRazorpayOrder(order, expected) {
  if (order?._id !== expected.localOrderId || order.paymentProvider === 'cashfree' ||
      order.razorpayOrderId !== expected.razorpayOrderId || order.paymentMethod !== 'ONLINE' ||
      typeof order.totalAmount !== 'number' || Math.round(order.totalAmount * 100) !== expected.amount ||
      !['PENDING', 'PAID', 'FAILED', 'CANCELLED'].includes(order.paymentStatus) ||
      !['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(order.orderStatus)) {
    throw new Error('Payment confirmation could not be verified. Check My Orders before paying again.');
  }
  return { ...expected, orderStatus: order.orderStatus, paymentStatus: order.paymentStatus,
    paid: order.paymentStatus === 'PAID', refundStatus: order.refundStatus };
}

export function readPendingCheckout(storage, key) {
  try {
    const pending = JSON.parse(storage.getItem(key));
    if (pending?.version !== 1 || !pending.payload || !['creating', 'ready'].includes(pending.stage)) return null;
    if (pending.stage === 'ready' && !pending.order) return null;
    const choice = paymentChoice(pending.choice?.method, pending.choice?.provider);
    if (pending.order) validateCreatedOrder(pending.order, choice);
    return { ...pending, choice };
  } catch { return null; }
}
