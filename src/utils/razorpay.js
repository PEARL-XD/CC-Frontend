let sdkPromise;

export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const fail = (message) => { clearTimeout(timer); script.remove(); reject(new Error(message)); };
    const timer = setTimeout(() => fail('Razorpay timed out. Please retry.'), 20000);
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      if (!window.Razorpay) return fail('Razorpay is unavailable. Please retry.');
      clearTimeout(timer);
      resolve(window.Razorpay);
    };
    script.onerror = () => fail('Razorpay could not load. Please retry.');
    document.head.appendChild(script);
  }).catch((error) => { sdkPromise = null; throw error; });
  return sdkPromise;
}

export function openRazorpay(Razorpay, order, user) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (result) => { if (!settled) { settled = true; resolve(result); } };
    try {
      const checkout = new Razorpay({
        key: order.razorpayKeyId, order_id: order.razorpayOrderId,
        amount: order.amount, currency: order.currency, name: 'CleanChops', description: 'Order payment',
        theme: { color: '#EF4444' },
        prefill: { name: user?.name || '', email: user?.email || '', contact: user?.phone || '' },
        handler: (result) => finish(result),
        modal: { ondismiss: () => finish(null) },
      });
      checkout.open();
    } catch (error) { reject(error); }
  });
}
