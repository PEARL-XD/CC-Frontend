let sdkPromise;

export function loadCashfree() {
  if (window.Cashfree) return Promise.resolve(window.Cashfree);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timer = setTimeout(() => { script.remove(); reject(new Error('Payment service timed out. Please retry.')); }, 20000);
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => {
      clearTimeout(timer);
      if (window.Cashfree) resolve(window.Cashfree);
      else { script.remove(); reject(new Error('Payment service unavailable.')); }
    };
    script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('Payment service could not load.')); };
    document.head.appendChild(script);
  }).catch((error) => { sdkPromise = null; throw error; });
  return sdkPromise;
}

export function validateLivePayment(data, expectedId) {
  if (data?.paymentProvider !== 'cashfree' || data.environment !== 'production' || data.currency !== 'INR' ||
      !/^[a-f0-9]{24}$/.test(data.localOrderId) || (expectedId && data.localOrderId !== expectedId) ||
      data.cashfreeOrderId !== `cc_${data.localOrderId}` || !Number.isSafeInteger(data.amount) || data.amount < 100 ||
      typeof data.paid !== 'boolean' || data.paid !== (data.paymentStatus === 'PAID')) {
    throw new Error('Payment details could not be verified. Check your orders before paying again.');
  }
  return data;
}

export function checkoutReference(storage, userId, payload, randomId = () => crypto.randomUUID()) {
  const key = `cashfree_checkout_${userId}`;
  let saved;
  try { saved = JSON.parse(storage.getItem(key)); } catch { /* Replace invalid local state only. */ }
  const serialized = JSON.stringify(payload);
  if (saved?.payload === serialized && typeof saved.requestId === 'string') return saved;
  const result = { payload: serialized, requestId: randomId() };
  storage.setItem(key, JSON.stringify(result));
  return result;
}
