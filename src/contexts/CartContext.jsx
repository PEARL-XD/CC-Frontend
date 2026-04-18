import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, accessToken } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);

  /* ---------------- INIT (LOAD FROM BACKEND) ---------------- */

  useEffect(() => {
    if (!user || !accessToken) {
      setCartItems([]);
      return;
    }

    let cancelled = false;

    async function loadCart() {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/cart`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!cancelled) {
          setCartItems(data.cart ?? []);
        }
      } catch (err) {
        console.error("Failed to load cart:", err);
      }
    }

    loadCart();
    return () => { cancelled = true; };
  }, [user, accessToken]);

  /* ---------------- HELPERS ---------------- */

  // Always build headers fresh so stale closures never use an old token
  const authHeaders = () =>
    accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

  /* ---------------- MUTATIONS ---------------- */

  const addItem = async (item) => {
    // Only send the minimum needed — the server resolves price/name from the DB
    const payload = {
      _id: item._id ?? item.id,
      selectedSize: Number(item.selectedSize),
      quantity: Number(item.quantity) || 1,
    };

    // Optimistic update using local item data for instant UI feedback
    setCartItems((items) => {
      const idx = items.findIndex(
        (i) => i._id === payload._id && i.selectedSize === payload.selectedSize
      );
      if (idx !== -1) {
        const copy = [...items];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + payload.quantity };
        return copy;
      }
      // Include display fields locally for optimistic render only
      return [...items, { ...payload, price: item.price, name: item.name, img: item.img }];
    });

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/cart/add`,
        payload, // ← no price/name/img sent to server
        { headers: authHeaders() }
      );
      // Reconcile with server truth (server-verified price/name)
      setCartItems(data.cart);
    } catch (err) {
      console.error("Add item failed:", err);
      // Rollback optimistic update on failure
      setCartItems((items) => {
        const idx = items.findIndex(
          (i) => i._id === payload._id && i.selectedSize === payload.selectedSize
        );
        if (idx === -1) return items;
        const copy = [...items];
        const reverted = copy[idx].quantity - payload.quantity;
        if (reverted <= 0) {
          copy.splice(idx, 1);
        } else {
          copy[idx] = { ...copy[idx], quantity: reverted };
        }
        return copy;
      });
    }
  };

  const removeItem = async (_id, selectedSize) => {
    // Snapshot for rollback
    const snapshot = cartItems;

    setCartItems((items) =>
      items.filter((i) => !(i._id === _id && i.selectedSize === selectedSize))
    );

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/cart/remove`,
        { _id, selectedSize },
        { headers: authHeaders() }
      );
      setCartItems(data.cart);
    } catch (err) {
      console.error("Remove item failed:", err);
      setCartItems(snapshot); // rollback
    }
  };

  const updateQuantity = async (_id, selectedSize, quantity) => {
    if (quantity < 1) return;

    const snapshot = cartItems;

    setCartItems((items) =>
      items.map((i) =>
        i._id === _id && i.selectedSize === selectedSize ? { ...i, quantity } : i
      )
    );

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/cart/update`,
        { _id, selectedSize, quantity },
        { headers: authHeaders() }
      );
      setCartItems(data.cart);
    } catch (err) {
      console.error("Update quantity failed:", err);
      setCartItems(snapshot); // rollback
    }
  };

  const clearCart = async () => {
    const snapshot = cartItems;
    setCartItems([]);

    try {
      await axios.post(`${API_BASE_URL}/api/cart/clear`, {}, { headers: authHeaders() });
    } catch (err) {
      console.error("Clear cart failed:", err);
      setCartItems(snapshot); // rollback
    }
  };

  return (
    <CartContext.Provider
      value={{ cartItems, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}