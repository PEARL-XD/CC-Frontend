// src/pages/AdminOrdersPage.jsx
// Uploaded screenshot path (for your reference): /mnt/data/c53e2ca1-42d6-45e6-9cda-47676f31311e.png

import React, { useEffect, useState, useContext, useMemo, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const STATUS_OPTIONS = [
  "ALL",
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const PAYMENT_OPTIONS = ["ALL", "PAID", "PENDING", "FAILED"];

const DATE_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

const statusColors = {
  PLACED: "bg-gray-100 text-gray-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PACKED: "bg-yellow-100 text-yellow-700",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function AdminOrdersPage() {
  const { accessToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Filters state
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [dateSort, setDateSort] = useState("newest");
  const [towerFilter, setTowerFilter] = useState(""); // e.g., "A", "B1" or "A1"
  const [flatFilter, setFlatFilter] = useState(""); // exact flat number, optional
  const [searchQuery, setSearchQuery] = useState("");

  // fetch orders
  const fetchOrders = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      // Normalize: ensure createdAt/updatedAt are present
      const normalized = (data.orders || []).map((o) => ({
        ...o,
        createdAt: o.createdAt ? new Date(o.createdAt) : null,
        updatedAt: o.updatedAt ? new Date(o.updatedAt) : null,
      }));
      setOrders(normalized);
      setErrorMsg("");
    } catch (err) {
      console.error("Failed to load admin orders:", err.response?.data || err.message);
      if (err.response?.status === 403) {
        setErrorMsg("You are not allowed to access admin orders.");
      } else {
        setErrorMsg("Failed to load orders. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      navigate("/login");
      return;
    }
    fetchOrders();
  }, [accessToken, navigate, fetchOrders]);

  const refreshOrders = async () => {
    await fetchOrders();
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await axios.patch(
        `${API_BASE_URL}/api/admin/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      // Optimistically update local state to reflect change quickly
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
    } catch (err) {
      console.error("Failed to update order status:", err.response?.data || err.message);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Derived list: apply filters & sorts
  const filtered = useMemo(() => {
    let list = [...orders];

    // Search: order id, user name, phone
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((o) => {
        const idMatch = (o._id || "").toLowerCase().includes(q);
        const userName = (o.user?.name || "").toLowerCase();
        const userPhone = (o.user?.phone || "").toLowerCase();
        const inName = userName.includes(q);
        const inPhone = userPhone.includes(q);
        return idMatch || inName || inPhone;
      });
    }

    // Status filter
    if (statusFilter !== "ALL") {
      list = list.filter((o) => o.orderStatus === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== "ALL") {
      list = list.filter((o) => {
        if (paymentFilter === "PAID") return o.paymentStatus === "PAID";
        if (paymentFilter === "PENDING") return o.paymentStatus === "PENDING";
        if (paymentFilter === "FAILED") return o.paymentStatus === "FAILED";
        return true;
      });
    }

    // Tower/flat filtering: we assume order.user or order.meta may contain tower/flat info.
    // We'll attempt to match against user.address or a flat/tower field on the order if present.
    // Accept flexible inputs: user types "A" or "A1" or "A1-10" etc.
    const towerQ = towerFilter.trim().toLowerCase();
    const flatQ = flatFilter.trim().toLowerCase();
    if (towerQ || flatQ) {
      list = list.filter((o) => {
        // Try multiple places: o.user.tower, o.user.flat, o.deliveryAddress, o.meta
        const towerCandidates = [
          o.user?.tower,
          (o.meta && o.meta.tower) || undefined,
          (o.deliveryAddress && o.deliveryAddress.tower) || undefined,
        ]
          .filter(Boolean)
          .map((x) => String(x).toLowerCase());

        const flatCandidates = [
          o.user?.flat,
          (o.meta && o.meta.flat) || undefined,
          (o.deliveryAddress && o.deliveryAddress.flat) || undefined,
        ]
          .filter(Boolean)
          .map((x) => String(x).toLowerCase());

        const towerOk = towerQ ? towerCandidates.some((t) => t.includes(towerQ)) : true;
        const flatOk = flatQ ? flatCandidates.some((f) => f.includes(flatQ)) : true;

        return towerOk && flatOk;
      });
    }

    // Date sort
    list.sort((a, b) => {
      const aTime = a.createdAt ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt ? b.createdAt.getTime() : 0;
      return dateSort === "newest" ? bTime - aTime : aTime - bTime;
    });

    return list;
  }, [orders, searchQuery, statusFilter, paymentFilter, towerFilter, flatFilter, dateSort]);

  // Simple pagination (client-side) — show 20 per page
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!accessToken) return null;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-center text-gray-600">Loading orders...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-center text-red-500 mb-4">{errorMsg}</p>
        <div className="text-center">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#fb923c] to-[#ef4444] text-white font-semibold shadow hover:scale-105 transition-transform"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <Navbar/>
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex items-start justify-between gap-4 mb-4 flex-col md:flex-row">
        <h1 className="text-2xl md:text-3xl font-extrabold">Admin – Orders</h1>

        <div className="flex gap-2 items-center">
          <button
            onClick={refreshOrders}
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 shadow-sm text-sm font-medium hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters toolbar */}
      <div className="bg-white border border-gray-100 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="col-span-1 sm:col-span-2">
            <label className="text-xs text-gray-500">Search (order id / name / phone)</label>
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="e.g. 673f0d... or John or 98765..."
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-xs text-gray-500">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Payment */}
          <div>
            <label className="text-xs text-gray-500">Payment</label>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              {PAYMENT_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Date sort */}
          <div>
            <label className="text-xs text-gray-500">Sort by</label>
            <select
              value={dateSort}
              onChange={(e) => setDateSort(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              {DATE_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tower filter */}
          <div>
            <label className="text-xs text-gray-500">Tower (A-G or A1 etc)</label>
            <input
              value={towerFilter}
              onChange={(e) => {
                setTowerFilter(e.target.value);
                setPage(1);
              }}
              placeholder="e.g. A or A1"
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          {/* Flat filter */}
          <div>
            <label className="text-xs text-gray-500">Flat</label>
            <input
              value={flatFilter}
              onChange={(e) => {
                setFlatFilter(e.target.value);
                setPage(1);
              }}
              placeholder="e.g. 101"
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Order</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">User</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Created</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Items</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Total</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Payment</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Status</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Schedule</th>
            </tr>
          </thead>

          <tbody>
            {pageData.map((order) => {
              const statusClass = statusColors[order.orderStatus] || "bg-gray-100 text-gray-700";

              return (
                <tr key={order._id} className="border-b last:border-b-0 align-top">
                  <td className="px-3 py-3 text-xs">
                    <div className="font-mono text-[11px]">{order._id?.slice(-8) || order._id}</div>
                    <div className="text-[11px] text-gray-400">ID: {order._id}</div>
                  </td>

                  <td className="px-3 py-3 text-xs">
                    <div className="font-medium text-gray-800">{order.user?.name || "N/A"}</div>
                    <div className="text-gray-500">{order.user?.phone || ""}</div>
                    <div className="text-[11px] text-gray-400">{order.user?.email || ""}</div>

                    {/* optionally show tower/flat if available */}
                    {(order.user?.tower || order.user?.flat) && (
                      <div className="text-[11px] text-gray-400 mt-1">
                        {order.user?.tower ? `Tower: ${order.user.tower}` : ""}{" "}
                        {order.user?.flat ? `Flat: ${order.user.flat}` : ""}
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">
                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
                  </td>

                  <td className="px-3 py-3 text-xs text-gray-700 max-w-xs">
                    <ul className="space-y-1">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <li key={idx}>
                          <span className="font-medium">{item.name}</span>{" "}
                          <span className="text-gray-500">({item.selectedSize}g × {item.quantity})</span>
                        </li>
                      ))}
                      {order.items.length > 3 && (
                        <li className="text-[11px] text-gray-400">+{order.items.length - 3} more</li>
                      )}
                    </ul>
                  </td>

                  <td className="px-3 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                    ₹{order.totalAmount.toFixed(2)}
                  </td>

                  <td className="px-3 py-3 text-xs text-gray-700 whitespace-nowrap">
                    <span className="px-2 py-1 rounded-full bg-gray-50 border border-gray-200">{order.paymentStatus}</span>
                  </td>

                  <td className="px-3 py-3 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${statusClass}`}>
                        {order.orderStatus.replace(/_/g, " ")}
                      </span>

                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300"
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        disabled={updatingId === order._id}
                      >
                        {STATUS_OPTIONS.filter(s => s !== "ALL").map((status) => (
                          <option key={status} value={status}>
                            {status.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>

                      {updatingId === order._id && <span className="text-[11px] text-gray-400">Updating...</span>}
                    </div>
                  </td>

                  <td className="px-3 py-3 text-xs text-gray-700 whitespace-nowrap">{order.schedule || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} orders
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="px-2 py-1 rounded border bg-white disabled:opacity-50"
          >
            «
          </button>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2 py-1 rounded border bg-white disabled:opacity-50"
          >
            Prev
          </button>

          <span className="px-3 text-sm">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2 py-1 rounded border bg-white disabled:opacity-50"
          >
            Next
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="px-2 py-1 rounded border bg-white disabled:opacity-50"
          >
            »
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
