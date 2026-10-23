import { validateLivePayment } from './cashfree.js';

export const PURCHASE_DESTINATION = 'AW-18474051740/25hhCMi89YQdEJzRjulE';
const orderIdPattern = /^[a-f0-9]{24}$/;
const acceptedOrderStatuses = new Set(['CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED']);

function purchaseFromResponse(path, response, requestBody) {
  const paymentRequest = path.match(/^\/payments\/cashfree\/orders\/([a-f0-9]{24})\/(?:session|verify)$/);
  const creation = path === '/orders/create';
  if (!creation && !paymentRequest) return null;

  const cod = creation && requestBody.paymentMethod === 'COD';
  if (cod) {
    if (response?.success !== true || response.paymentMethod !== 'COD' || response.requiresPayment !== false ||
        !orderIdPattern.test(response.localOrderId) || response.currency !== 'INR' ||
        !Number.isSafeInteger(response.amount) || response.amount < 100 ||
        (response.orderStatus != null && response.orderStatus !== 'PLACED' && !acceptedOrderStatuses.has(response.orderStatus))) return null;
  } else {
    if (creation && requestBody.paymentMethod !== 'ONLINE') return null;
    validateLivePayment(response, paymentRequest?.[1]);
    if (response.paid !== true || !acceptedOrderStatuses.has(response.orderStatus) || response.refundStatus) return null;
  }

  return { transaction_id: response.localOrderId, value: response.amount / 100, currency: 'INR' };
}

export function createPurchaseReporter(getWindow = () => window) {
  const queuedOrders = new Set();
  return function reportCheckoutPurchase(path, response, requestBody = {}) {
    try {
      const purchase = purchaseFromResponse(path, response, requestBody);
      if (!purchase || queuedOrders.has(purchase.transaction_id)) return false;
      const browser = getWindow();
      if (typeof browser?.gtag !== 'function') return false;

      // Never await advertising delivery or let it change the payment result.
      browser.gtag('event', 'conversion', { send_to: PURCHASE_DESTINATION, ...purchase });
      queuedOrders.add(purchase.transaction_id);
      // Keep only tab-local deduplication; Google also deduplicates transaction IDs.
      if (queuedOrders.size > 256) queuedOrders.delete(queuedOrders.values().next().value);
      return true;
    } catch {
      return false;
    }
  };
}

export const reportCheckoutPurchase = createPurchaseReporter();
