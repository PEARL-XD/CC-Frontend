import React, { useState, useRef, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon, CreditCardIcon, LibraryIcon, DotsHorizontalIcon,
  TruckIcon, ShieldCheckIcon, CheckCircleIcon, CashIcon,
} from '@heroicons/react/outline';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { loadCashfree, validateLivePayment, checkoutReference } from '../utils/cashfree';
import { loadRazorpay, openRazorpay } from '../utils/razorpay';
import { cashfreePayloadForRetry, checkoutPayload, paymentChoice, paymentMethods, readPendingCheckout, validateCreatedOrder, validateRazorpayOrder } from '../utils/checkout';
import { reportCheckoutPurchase } from '../utils/googleAds';
import { packDisplayText } from '../utils/packPricing';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const methodIcons = { upi: CashIcon, card: CreditCardIcon, netbanking: LibraryIcon, more: DotsHorizontalIcon, cod: TruckIcon };
const money = (amount) => `Rs ${Number(amount).toFixed(2)}`;

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, user } = useContext(AuthContext);
  const { clearCart, cartItems: currentCart } = useCart();
  const resumeId = new URLSearchParams(location.search).get('orderId');
  const storageKey = `cleanchops_checkout_${user?._id}`;
  const [pending, setPending] = useState(() => {
    try {
      const saved = readPendingCheckout(sessionStorage, storageKey);
      return !resumeId || saved?.order?.localOrderId === resumeId ? saved : null;
    } catch { return null; }
  });
  const [choice, setChoice] = useState(pending?.choice || paymentChoice('upi'));
  const [payment, setPayment] = useState(pending?.order || null);
  const [busy, setBusy] = useState(false);
  const [resuming, setResuming] = useState(Boolean(resumeId));
  const [error, setError] = useState('');
  const [fees, setFees] = useState(null);
  const [feeError, setFeeError] = useState('');
  const [feeRetry, setFeeRetry] = useState(0);
  const [couponCode, setCouponCode] = useState(location.state?.couponCode || '');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const active = useRef(false);
  const cartCleared = useRef(false);
  const cartItems = resumeId ? [] : location.state?.cartItems || currentCart || [];
  const { schedule, silentDelivery = false } = location.state || {};
  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const displayTotal = payment ? payment.amount / 100 : Math.max(0, subtotal - (coupon?.discountAmount || 0)) + (fees?.packagingFee || 0) + (fees?.platformFee || 0);
  const hasTotal = Boolean(payment || (!resumeId && cartItems.length && fees));
  const completed = payment?.orderStatus !== 'CANCELLED' && (payment?.paid || payment?.paymentProvider === 'cod');
  const locked = busy || Boolean(pending) || Boolean(resumeId) || applyingCoupon;
  const providerName = choice.provider === 'razorpay' ? 'Razorpay' : 'Cashfree';
  const canContinue = Boolean(user?._id && accessToken && payment?.orderStatus !== 'CANCELLED' &&
    (payment || resumeId || (cartItems.length && fees && !feeError)) &&
    !(pending?.stage === 'creating' && pending.choice.provider !== 'cashfree'));

  useEffect(() => {
    const controller = new AbortController();
    setFeeError('');
    axios.get(`${API_BASE_URL}/api/storefront`, { signal: controller.signal, timeout: 15000 })
      .then(({ data }) => {
        const { packagingFee = 0, platformFee = 0 } = data.settings || {};
        if (!data.settings || ![packagingFee, platformFee].every((value) => Number.isFinite(Number(value)) && Number(value) >= 0)) {
          throw new Error('Order charges are unavailable. Please retry.');
        }
        setFees({ packagingFee: Number(packagingFee), platformFee: Number(platformFee) });
      })
      .catch(() => { if (!controller.signal.aborted) setFeeError('Could not load order charges. Please retry.'); });
    return () => controller.abort();
  }, [feeRetry]);

  useEffect(() => {
    if (!resumeId || !accessToken) return;
    if (!/^[a-f0-9]{24}$/.test(resumeId)) {
      setError('Invalid order reference. Open the order from My Orders.');
      setResuming(false);
      return;
    }
    const controller = new AbortController();
    setResuming(true);
    axios.post(`${API_BASE_URL}/api/payments/cashfree/orders/${resumeId}/session`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` }, signal: controller.signal, timeout: 30000,
    }).then(({ data }) => {
      validateLivePayment(data, resumeId);
      setPayment(data);
      setChoice(paymentChoice(['upi', 'card', 'netbanking'].includes(data.checkoutMethod) ? data.checkoutMethod : 'more'));
      reportCheckoutPurchase(`/payments/cashfree/orders/${resumeId}/session`, data);
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.response?.data?.error || failure.message || 'Could not load this payment. Retry or view My Orders.');
    }).finally(() => { if (!controller.signal.aborted) setResuming(false); });
    return () => controller.abort();
  }, [resumeId, accessToken]);

  function remember(record) {
    sessionStorage.setItem(storageKey, JSON.stringify(record));
    setPending(record);
  }

  async function request(path, data = {}, checkoutOrder) {
    const response = await axios.post(`${API_BASE_URL}/api${path}`, data, {
      headers: { Authorization: `Bearer ${accessToken}` }, timeout: 30000,
    });
    reportCheckoutPurchase(path, response.data, checkoutOrder ? { ...data, checkoutOrder } : data);
    return response.data;
  }

  async function finishOrder(data) {
    if (data.orderStatus === 'CANCELLED' || (!data.paid && data.paymentProvider !== 'cod')) return;
    if (!resumeId && !cartCleared.current) {
      if (await clearCart() === false) throw new Error('Order confirmed. Cart refresh failed; view My Orders before purchasing again.');
      cartCleared.current = true;
    }
    if (!resumeId || pending?.order?.localOrderId === data.localOrderId) sessionStorage.removeItem(storageKey);
    if (!resumeId && choice.provider === 'cashfree') localStorage.removeItem(`cashfree_checkout_${user._id}`);
    navigate('/orderspage', { replace: true });
  }

  async function legacyStatus(data) {
    const response = await axios.get(`${API_BASE_URL}/api/orders/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }, timeout: 30000,
    });
    const order = response.data.orders?.find((item) => item._id === data.localOrderId);
    return validateRazorpayOrder(order, data);
  }

  async function proceed(openCheckout = true) {
    if (active.current || !accessToken || !user?._id) return;
    active.current = true;
    setBusy(true);
    setError('');
    try {
      if (pending?.stage === 'creating' && pending.choice.provider !== 'cashfree') {
        throw new Error('The previous order request could not be confirmed. Check My Orders before placing another order.');
      }
      let selected = pending?.choice || choice;
      // Load the selected SDK before creating an order; selection alone never starts payment.
      const SDK = openCheckout && !completed
        ? selected.provider === 'cashfree' ? await loadCashfree()
          : selected.provider === 'razorpay' ? await loadRazorpay() : null
        : null;
      let data = payment;
      const existing = Boolean(data);
      let sessionLoaded = false;
      if (resumeId && !data) {
        if (!/^[a-f0-9]{24}$/.test(resumeId)) throw new Error('Invalid order reference. Open the order from My Orders.');
        data = validateLivePayment(await request(`/payments/cashfree/orders/${resumeId}/session`), resumeId);
        sessionLoaded = true;
      } else if (!data) {
        let payload = pending?.payload || checkoutPayload({ cartItems, schedule, silentDelivery,
          couponCode: coupon?.coupon?.code || couponCode, choice: selected, locationKey: user.deliveryLocation?.locationKey });
        if (selected.provider === 'cashfree') {
          payload = cashfreePayloadForRetry(localStorage, user._id, payload);
          if (payload.checkoutMethod === undefined) {
            selected = paymentChoice('more');
            setChoice(selected);
          }
        }
        const body = selected.provider === 'cashfree'
          ? { ...payload, requestId: checkoutReference(localStorage, user._id, payload).requestId } : payload;
        const record = { version: 1, stage: 'creating', choice: selected, payload };
        remember(record);
        try {
          data = validateCreatedOrder(await request('/orders/create', body), selected);
          sessionLoaded = selected.provider === 'cashfree';
        } catch (failure) {
          if (failure.response?.status >= 400 && failure.response.status < 500 && ![408, 409].includes(failure.response.status)) {
            sessionStorage.removeItem(storageKey);
            setPending(null);
          }
          throw failure;
        }
        setPayment(data);
        remember({ ...record, stage: 'ready', order: { ...data, paymentSessionId: undefined } });
      }
      setPayment(data);
      if (selected.provider === 'cod') {
        await finishOrder(data);
        return;
      }
      if (data.paymentProvider === 'cashfree') {
        if (!openCheckout || !sessionLoaded) {
          data = validateLivePayment(await request(`/payments/cashfree/orders/${data.localOrderId}/${openCheckout ? 'session' : 'verify'}`), data.localOrderId);
        }
        setPayment(data);
        if (openCheckout && !data.paid && data.orderStatus !== 'CANCELLED' && data.cashfreeStatus === 'ACTIVE') {
          if (!data.paymentSessionId) throw new Error('Payment session is unavailable. Retry this order or check payment status.');
          let launchError;
          try { await SDK({ mode: 'production' }).checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: '_modal' }); }
          catch (failure) { launchError = failure; }
          data = validateLivePayment(await request(`/payments/cashfree/orders/${data.localOrderId}/verify`), data.localOrderId);
          setPayment(data);
          if (launchError && !data.paid) throw new Error('Cashfree could not complete checkout. Check payment status before trying again.');
        }
      } else {
        if (existing || !openCheckout) {
          data = await legacyStatus(data);
          setPayment(data);
        }
        if (openCheckout && !data.paid && !['CANCELLED', 'FAILED'].includes(data.paymentStatus) && data.orderStatus !== 'CANCELLED') {
          const result = await openRazorpay(SDK, data, user);
          if (result) {
            const verified = await request('/orders/verify', { localOrderId: data.localOrderId,
              razorpay_order_id: result.razorpay_order_id, razorpay_payment_id: result.razorpay_payment_id,
              razorpay_signature: result.razorpay_signature }, data);
            if (verified.success !== true) throw new Error('Payment is not confirmed. Check My Orders before trying again.');
            data = validateRazorpayOrder(verified.order, data);
          } else data = await legacyStatus(data);
          setPayment(data);
        }
      }
      await finishOrder(data);
    } catch (failure) {
      setError(failure.response?.data?.error || failure.message || 'Unable to verify payment. Check My Orders before paying again.');
    } finally { active.current = false; setBusy(false); }
  }

  async function applyCoupon(event) {
    event.preventDefault();
    if (locked || applyingCoupon) return;
    setApplyingCoupon(true);
    setCouponError('');
    try {
      const data = await request('/coupons/validate', { code: couponCode.trim(), subtotalAmount: subtotal });
      if (data.success !== true || !data.coupon?.code || !Number.isFinite(data.discountAmount) || data.discountAmount < 0) {
        throw new Error('This coupon could not be verified.');
      }
      setCoupon(data);
      setCouponCode(data.coupon.code);
    } catch (failure) {
      setCoupon(null);
      setCouponError(failure.response?.data?.error || failure.message || 'Could not apply coupon.');
    } finally { setApplyingCoupon(false); }
  }

  function selectMethod(method) {
    if (locked || (method === 'cod' && silentDelivery)) return;
    setChoice(paymentChoice(method));
    setError('');
  }

  const orderSummary = <>
    <h2 className="font-extrabold">Order summary</h2>
    <ul className="mt-4 space-y-4">{cartItems.map((item) => (
      <li key={`${item._id}-${item.selectedSize}`} className="flex items-start justify-between gap-4 text-sm">
        <div className="min-w-0"><p className="break-words font-semibold">{item.name}</p><p className="mt-1 text-xs text-gray-500">{packDisplayText(Number(item.selectedSize), item)} x {item.quantity}</p></div>
        <span className="shrink-0 font-semibold">{money(item.price * item.quantity)}</span>
      </li>
    ))}</ul>
    <dl className="mt-5 space-y-2 border-t border-orange-50 pt-4 text-sm">
      <div className="flex justify-between gap-4"><dt>Items subtotal</dt><dd>{money(subtotal)}</dd></div>
      {fees && <><div className="flex justify-between gap-4"><dt>Packaging fee</dt><dd>{money(fees.packagingFee)}</dd></div><div className="flex justify-between gap-4"><dt>Platform fee</dt><dd>{money(fees.platformFee)}</dd></div></>}
      {coupon && <div className="flex justify-between gap-4 text-green-700"><dt>Coupon savings</dt><dd>-{money(coupon.discountAmount)}</dd></div>}
      <div className="flex justify-between gap-4 pt-2 font-extrabold"><dt>Total</dt><dd>{!fees && !payment ? 'Loading...' : money(displayTotal)}</dd></div>
    </dl>
  </>;

  return (
    <main className="min-h-screen bg-[#fffaf5] text-gray-900">
      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-5 sm:px-6">
          <button type="button" disabled={busy} onClick={() => navigate('/cart')} className="rounded-xl p-2 hover:bg-orange-50 disabled:opacity-50" aria-label="Back to cart">
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-extrabold">Payment</h1>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl items-start gap-6 px-4 py-6 pb-40 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-10 lg:py-10 lg:pb-40">
        <section className="min-w-0 space-y-5 lg:order-2" aria-label="Order summary">
          <div className="rounded-3xl bg-gradient-to-br from-[#fb923c] to-[#ef4444] p-6 text-white shadow-sm">
            <p className="text-sm font-semibold text-white/90">Amount to pay</p>
            <p className="mt-2 text-3xl font-extrabold" aria-live="polite">{hasTotal ? money(displayTotal) : 'Loading total...'}</p>
            {(schedule || silentDelivery) && <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              {schedule && <span className="rounded-full border border-white/30 bg-white/15 px-3 py-1.5">{schedule}</span>}
              {silentDelivery && <span className="rounded-full border border-white/30 bg-white/15 px-3 py-1.5">Silent delivery</span>}
            </div>}
          </div>

          {cartItems.length > 0 && <div className="rounded-2xl border border-orange-100 bg-white p-5">
            <details className="lg:hidden"><summary className="cursor-pointer text-sm font-bold">Order summary ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</summary><div className="mt-4">{orderSummary}</div></details>
            <div className="hidden lg:block">{orderSummary}</div>
          </div>}

          {!pending && !resumeId && cartItems.length > 0 && <form onSubmit={applyCoupon} className="rounded-2xl border border-orange-100 bg-white p-5">
            <label htmlFor="checkout-coupon" className="font-bold">Coupon code</label>
            <div className="mt-3 flex gap-2">
              <input id="checkout-coupon" disabled={locked} value={couponCode} onChange={(event) => { setCouponCode(event.target.value); setCoupon(null); }} placeholder="Enter coupon code" className="min-w-0 flex-1 rounded-xl border border-orange-100 px-3 py-3 text-sm uppercase" />
              <button type="submit" disabled={!couponCode.trim() || locked} className="shrink-0 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{applyingCoupon ? 'Applying...' : 'Apply'}</button>
            </div>
            {coupon && <p className="mt-3 text-sm text-green-700" role="status">{coupon.coupon.code} applied. You save {money(coupon.discountAmount)}.</p>}
            {couponError && <p className="mt-3 text-sm text-red-700" role="alert">{couponError}</p>}
          </form>}
          {feeError && !payment && <div className="rounded-xl border border-red-100 bg-white p-4 text-sm" role="alert">{feeError}<button type="button" onClick={() => setFeeRetry((value) => value + 1)} className="ml-2 font-bold text-red-600 underline">Retry charges</button></div>}
        </section>

        <section className="min-w-0 space-y-5 lg:order-1" aria-label="Payment options">
          <fieldset disabled={locked} className="min-w-0 space-y-3">
            <legend className="mb-4 text-xl font-extrabold">Choose payment method</legend>
            {paymentMethods.map((method) => {
              const Icon = methodIcons[method.id];
              const selected = choice.method === method.id;
              const disabled = method.id === 'cod' && silentDelivery;
              return <div key={method.id}>
                <label className={`flex min-w-0 cursor-pointer items-center gap-3 rounded-2xl border bg-white p-4 transition-colors sm:gap-4 ${selected ? 'border-red-500 ring-1 ring-red-500 shadow-sm' : 'border-orange-100'} ${disabled || locked ? 'cursor-default opacity-60' : 'hover:bg-orange-50/50'}`}>
                  <span className={`shrink-0 rounded-2xl p-3 ${selected ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-gray-500'}`}><Icon className="h-6 w-6" /></span>
                  <span className="min-w-0 flex-1">
                    <span className={`block font-extrabold ${selected ? 'text-red-600' : ''}`}>{method.title}</span>
                    {method.badge && <span className="mt-1 inline-block rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-extrabold text-red-600">{disabled ? 'Unavailable' : method.badge}</span>}
                    <span className="mt-1 block text-sm text-gray-500">{disabled ? 'Unavailable with silent delivery' : method.id === 'more' && selected ? `Selected: ${providerName}` : method.description}</span>
                  </span>
                  <input type="radio" name="payment-method" value={method.id} checked={selected} disabled={disabled} onChange={() => selectMethod(method.id)} aria-label={method.title} className="h-5 w-5 shrink-0 accent-red-500" />
                </label>
                {method.id === 'more' && selected && <fieldset className="mt-3 grid min-w-0 gap-2 rounded-2xl border border-orange-100 bg-white p-4">
                  <legend className="px-1 text-sm font-bold">Choose payment provider</legend>
                  {['cashfree', 'razorpay'].map((provider) => <label key={provider} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-orange-50/50 px-3 py-3 text-sm font-semibold">
                    <span>Continue with {provider === 'cashfree' ? 'Cashfree' : 'Razorpay'}</span>
                    <input type="radio" name="payment-provider" aria-label={provider === 'cashfree' ? 'Cashfree' : 'Razorpay'} checked={choice.provider === provider} onChange={() => setChoice(paymentChoice('more', provider))} className="h-5 w-5 shrink-0 accent-red-500" />
                  </label>)}
                </fieldset>}
              </div>;
            })}
          </fieldset>

          <div className="flex items-start gap-3 rounded-2xl border border-orange-100 bg-white p-4 text-sm font-semibold text-gray-600">
            <ShieldCheckIcon className="h-6 w-6 shrink-0 text-red-500" />
            <p>{choice.method === 'cod' ? 'No online payment required. Pay when your order arrives.' : `Final payment is handled securely by ${providerName}.`}</p>
          </div>

          {!busy && (payment || pending || resumeId) && <div className="space-y-3 rounded-2xl border border-orange-100 bg-white p-5 text-sm" aria-live="polite">
            {completed ? <p className="flex items-center gap-2 font-bold text-green-700"><CheckCircleIcon className="h-5 w-5" />{choice.method === 'cod' ? 'Order placed successfully.' : 'Payment confirmed.'}</p>
              : payment?.orderStatus === 'CANCELLED' ? <p>This order is cancelled. {payment.paid ? 'Check My Orders for your refund status.' : 'Return to your cart to start a new checkout.'}</p>
                : <p>{pending?.stage === 'creating' && choice.provider !== 'cashfree' ? 'The order request could not be confirmed. Check My Orders before placing another order.' : 'Payment is not confirmed yet. Retry this order or check its status before paying again.'}</p>}
            {payment && <p className="break-all text-xs text-gray-500">Order reference: {payment.localOrderId}</p>}
            {pending?.stage === 'creating' && choice.provider !== 'cashfree' && <details className="rounded-xl border border-orange-100 p-3">
              <summary className="cursor-pointer font-bold">Start a new checkout</summary>
              <p className="mt-3 text-gray-600">First check My Orders and your payment app. Reset only if the previous order is missing or cancelled and no payment was taken; otherwise a new checkout could duplicate it.</p>
              <button type="button" onClick={() => { sessionStorage.removeItem(storageKey); setPending(null); setError(''); }} className="mt-3 font-bold text-red-600 underline">I have checked - reset checkout</button>
            </details>}
            {(payment?.paymentProvider !== 'cod' && (payment || resumeId)) && <button type="button" disabled={busy} onClick={() => proceed(false)} className="w-full rounded-xl border border-orange-200 px-4 py-3 font-bold disabled:opacity-50">Check payment status</button>}
            {payment?.orderStatus === 'CANCELLED' && !payment.paid && <button type="button" disabled={busy} onClick={() => { sessionStorage.removeItem(storageKey); localStorage.removeItem(`cashfree_checkout_${user._id}`); setPending(null); setPayment(null); navigate('/cart'); }} className="w-full rounded-xl border border-orange-200 px-4 py-3 font-bold">Back to cart</button>}
            <button type="button" disabled={busy} onClick={() => navigate('/orderspage')} className="w-full py-2 font-bold text-red-600">View my orders</button>
          </div>}
          {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
          {!cartItems.length && !payment && !pending && !resumeId && <p className="text-sm text-gray-600">Your cart is empty. Add items to continue checkout.</p>}
        </section>
      </div>

      <footer className="safe-area-inset-bottom fixed inset-x-0 bottom-0 z-40 border-t border-orange-100 bg-white p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-xs text-gray-500 sm:text-left">{choice.method === 'cod' ? 'Pay on delivery' : `Secure checkout with ${providerName}`}</p>
          <button type="button" disabled={busy || resuming || applyingCoupon || !canContinue} onClick={() => proceed()} className="w-full rounded-2xl bg-[#ef4444] px-6 py-4 text-center font-extrabold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300 sm:w-auto sm:min-w-80">
            {busy ? choice.method === 'cod' ? 'Placing your order...' : 'Opening secure checkout...' : resuming ? 'Loading payment...' : completed ? 'View confirmed order' : choice.method === 'cod' ? `Place order | ${money(displayTotal)}` : `${payment || resumeId ? 'Continue payment' : 'Continue securely'}${hasTotal ? ` | ${money(displayTotal)}` : ''}`}
          </button>
        </div>
      </footer>
    </main>
  );
}
