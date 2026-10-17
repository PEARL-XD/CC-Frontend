import React, { useState, useRef, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { loadCashfree, validateLivePayment, checkoutReference } from '../utils/cashfree';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, user } = useContext(AuthContext);
  const { clearCart } = useCart();
  const [payment, setPayment] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(false);
  const cartCleared = useRef(false);
  const { cartItems = [], schedule, silentDelivery, couponCode } = location.state || {};
  const resumeId = new URLSearchParams(location.search).get('orderId');
  const key = `cashfree_checkout_${user?._id}`;

  async function request(path, data = {}) {
    const response = await axios.post(`${API_BASE_URL}/api${path}`, data, {
      headers: { Authorization: `Bearer ${accessToken}` }, timeout: 30000,
    });
    return response.data;
  }

  async function proceed(openCheckout) {
    if (active.current || !accessToken || !user?._id) return;
    active.current = true;
    setBusy(true);
    setError('');
    try {
      let id = payment?.localOrderId || resumeId;
      let data;
      if (!id) {
        if (!cartItems.length) throw new Error('Open an unpaid order from My Orders or return to your cart.');
        const payload = {
          cartItems: cartItems.map((item) => ({ _id: item._id, selectedSize: Number(item.selectedSize), quantity: Number(item.quantity), cutInstruction: item.cutInstruction })),
          schedule, silentDelivery: silentDelivery === true, couponCode,
          paymentMethod: 'ONLINE', paymentProvider: 'cashfree',
          locationKey: user.deliveryLocation?.locationKey || '',
        };
        const reference = checkoutReference(localStorage, user._id, payload);
        data = validateLivePayment(await request('/orders/create', { ...payload, requestId: reference.requestId }));
        id = data.localOrderId;
      }
      data = validateLivePayment(await request(`/payments/cashfree/orders/${id}/session`), id);
      setPayment(data);
      if (openCheckout && !data.paid && data.orderStatus !== 'CANCELLED' && data.cashfreeStatus === 'ACTIVE') {
        const Cashfree = await loadCashfree();
        try { await Cashfree({ mode: 'production' }).checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: '_modal' }); }
        catch { /* A checkout error is not proof that the bank did not charge. */ }
        data = validateLivePayment(await request(`/payments/cashfree/orders/${id}/verify`), id);
        setPayment(data);
      }
      if (data.paid && data.orderStatus !== 'CANCELLED' && !resumeId && !cartCleared.current) {
        const cleared = await clearCart();
        if (cleared === false) throw new Error('Payment confirmed. Cart refresh failed; check your orders before purchasing again.');
        cartCleared.current = true;
        localStorage.removeItem(key);
      } else if (data.orderStatus === 'CANCELLED' && !resumeId) localStorage.removeItem(key);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Unable to verify payment. Check your orders before paying again.');
    } finally { active.current = false; setBusy(false); }
  }

  const canPay = payment && !payment.paid && payment.orderStatus !== 'CANCELLED' && payment.cashfreeStatus === 'ACTIVE';
  return (
    <main className="min-h-screen bg-[#fffaf5] px-4 py-8 sm:py-16">
      <section className="mx-auto w-full max-w-xl rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-8">
        <h1 className="text-2xl font-extrabold">Secure checkout</h1>
        <p className="mt-2 text-sm text-gray-600">Pay securely with Cashfree. This is a real payment for your order.</p>
        {cartItems.length > 0 && <div className="my-6 space-y-3">{cartItems.map((item) => (
          <div key={`${item._id}-${item.selectedSize}`} className="flex gap-3 justify-between text-sm">
            <span className="min-w-0 break-words">{item.name} ({item.selectedSize}g x {item.quantity})</span>
            <span className="shrink-0">Rs {(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}</div>}
        {payment && <div className="my-5 rounded-xl bg-orange-50 p-4 space-y-2" aria-live="polite">
          <p className="text-xl font-bold">Total: Rs {(payment.amount / 100).toFixed(2)}</p>
          <p>{payment.orderStatus === 'CANCELLED' ? `Order cancelled. Refund: ${payment.refundStatus || 'any completed payment will be refunded'}.`
            : payment.paid ? 'Payment confirmed. Your order is being prepared.' : 'Payment not confirmed yet. Continue payment or check its status.'}</p>
          <p className="break-all text-xs text-gray-500">Order reference: {payment.localOrderId}</p>
        </div>}
        {error && <p role="alert" className="my-4 text-sm text-red-700">{error}</p>}
        <div className="mt-5 flex flex-col gap-3">
          {(!payment || canPay) && <button disabled={busy || !user || (!cartItems.length && !resumeId && !payment)}
            onClick={() => proceed(Boolean(payment))}
            className="rounded-xl bg-red-500 px-4 py-3 font-bold text-white disabled:bg-gray-300 disabled:cursor-not-allowed">
            {busy ? 'Please wait...' : payment ? 'Pay with Cashfree' : 'Review final total'}
          </button>}
          {(payment || resumeId) && <button disabled={busy} onClick={() => proceed(false)} className="rounded-xl border px-4 py-3 disabled:opacity-50">Check payment status</button>}
          <button disabled={busy} onClick={() => navigate('/orderspage')} className="py-3 text-red-600 disabled:opacity-50">View my orders</button>
          <button disabled={busy} onClick={() => navigate('/cart')} className="py-2 text-gray-600 disabled:opacity-50">Back to cart</button>
        </div>
      </section>
    </main>
  );
}
