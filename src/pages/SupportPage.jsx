import React, {
  useEffect, useState, useContext, useCallback, useRef,
} from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import AuthRequired from "../components/AuthRequired";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PAGE_SIZE = 8;

/* ── Constants ─────────────────────────────────────────────────────── */

const ISSUE_TYPES = [
  { id: "MISSING_ITEM",   label: "Missing item",          icon: "📦" },
  { id: "WRONG_ITEM",     label: "Wrong cut / item",      icon: "🩸" },
  { id: "SHORT_WEIGHT",   label: "Short weight",          icon: "⚖️" },
  { id: "NOT_FRESH",      label: "Not fresh / bad smell", icon: "🌡️" },
  { id: "POOR_PACKAGING", label: "Poor packaging",        icon: "🗑️" },
  { id: "LATE_DELIVERY",  label: "Late delivery",         icon: "🚚" },
  { id: "POOR_QUALITY",   label: "Poor quality / taste",  icon: "🍗" },
  { id: "WRONG_CHARGE",   label: "Wrong charge",          icon: "💰" },
  { id: "OTHER",          label: "Other",                 icon: "💬" },
];

const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

const PLACEHOLDER_MAP = {
  SHORT_WEIGHT: "e.g. ordered 1kg boneless breast but received around 800g",
  NOT_FRESH:    "e.g. chicken had a sour smell, colour looked off",
  WRONG_ITEM:   "e.g. ordered boneless but received bone-in pieces",
  WRONG_CHARGE: "e.g. charged ₹350 but the item was listed at ₹300",
};

const ORDER_STATUS_STYLES = {
  PLACED:           "bg-gray-100 text-gray-700",
  CONFIRMED:        "bg-blue-100 text-blue-700",
  PACKED:           "bg-yellow-100 text-yellow-700",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-700",
  DELIVERED:        "bg-green-100 text-green-700",
  CANCELLED:        "bg-red-100 text-red-700",
};

const TICKET_STATUS_STYLES = {
  OPEN:      { pill: "bg-amber-100 text-amber-800",  label: "Open" },
  IN_REVIEW: { pill: "bg-blue-100 text-blue-800",    label: "In Review" },
  RESOLVED:  { pill: "bg-green-100 text-green-800",  label: "Resolved" },
  CLOSED:    { pill: "bg-gray-100 text-gray-600",    label: "Closed" },
};

const PRIORITY_STYLES = {
  Low:    { pill: "bg-green-50 text-green-800 border border-green-300",  dot: "🟢" },
  Medium: { pill: "bg-yellow-50 text-yellow-800 border border-yellow-300", dot: "🟡" },
  High:   { pill: "bg-red-50 text-red-800 border border-red-300",        dot: "🔴" },
};

const ISSUE_LABEL_MAP = Object.fromEntries(ISSUE_TYPES.map((i) => [i.id, i.label]));

/* ── Helpers ───────────────────────────────────────────────────────── */

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function shortDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/* ══════════════════════════════════════════════════════════════════════
   ROOT PAGE
══════════════════════════════════════════════════════════════════════ */

export default function SupportPage() {
  const { accessToken } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("tickets"); // "tickets" | "new"

  /* ── Tickets state ── */
  const [tickets, setTickets]           = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState("");

  /* ── Orders state ── */
  const [allOrders, setAllOrders]         = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError]     = useState("");
  const [currentPage, setCurrentPage]     = useState(1);

  /* ── Form state ── */
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedIssue,   setSelectedIssue]   = useState("");
  const [priority,        setPriority]        = useState("Medium");
  const [description,     setDescription]     = useState("");

  /* ── Submit state ── */
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted,   setSubmitted]   = useState(false);

  /* ── Fetch tickets ── */
  const fetchTickets = useCallback(async () => {
    setTicketsLoading(true);
    setTicketsError("");
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/support/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setTickets(data.tickets || []);
    } catch {
      setTicketsError("Failed to load your tickets.");
    } finally {
      setTicketsLoading(false);
    }
  }, [accessToken]);

  /* ── Fetch orders ── */
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/orders/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const orders = data.orders || [];
      setAllOrders(orders);
      if (orders.length > 0) setSelectedOrderId(orders[0]._id);
    } catch {
      setOrdersError("Failed to load your orders.");
    } finally {
      setOrdersLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    fetchTickets();
    fetchOrders();
  }, [accessToken, fetchTickets, fetchOrders]);

  if (!accessToken) return <AuthRequired />;

  /* ── Build a set of order IDs that already have an open ticket ── */
  const openTicketOrderIds = new Set(
    tickets
      .filter((t) => t.status === "OPEN" || t.status === "IN_REVIEW")
      .map((t) => (typeof t.order === "object" ? t.order?._id : t.order)?.toString())
      .filter(Boolean)
  );

  /* ── Pagination ── */
  const totalPages  = Math.ceil(allOrders.length / PAGE_SIZE);
  const pagedOrders = allOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    const newVisible = allOrders.slice((newPage - 1) * PAGE_SIZE, newPage * PAGE_SIZE);
    const stillVisible = newVisible.some((o) => o._id === selectedOrderId);
    if (!stillVisible && newVisible.length > 0) setSelectedOrderId(newVisible[0]._id);
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!selectedOrderId)    return setSubmitError("Please select an order.");
    if (!selectedIssue)      return setSubmitError("Please select an issue type.");
    if (!description.trim()) return setSubmitError("Please describe the issue.");

    setSubmitError("");
    setSubmitting(true);
    try {
      await axios.post(
        `${API_BASE_URL}/api/support`,
        { orderId: selectedOrderId, issueType: selectedIssue, priority, description: description.trim() },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setSubmitted(true);
      // Refresh tickets in background so tab 1 is up to date
      fetchTickets();
    } catch (err) {
      setSubmitError(err.response?.data?.error || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setSelectedIssue("");
    setDescription("");
    setPriority("Medium");
    setSubmitError("");
    setActiveTab("tickets"); // go show them their new ticket
  };

  /* ── Tab bar ── */
  const openCount = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_REVIEW").length;

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pb-16">

        {/* Page header */}
        <div className="py-6">
          <h1 className="text-3xl font-extrabold">Support</h1>
          <p className="text-gray-500 text-sm mt-1">
            Raise a query or track your existing tickets.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab("tickets")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "tickets"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            My Tickets
            {openCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-indigo-600 text-white">
                {openCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "new"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            New Ticket
          </button>
        </div>

        {/* ── TAB 1: My Tickets ── */}
        {activeTab === "tickets" && (
          <TicketsTab
            tickets={tickets}
            loading={ticketsLoading}
            error={ticketsError}
            onRetry={fetchTickets}
            onNewTicket={() => setActiveTab("new")}
          />
        )}

        {/* ── TAB 2: New Ticket ── */}
        {activeTab === "new" && (
          submitted ? (
            <SuccessScreen onReset={handleReset} />
          ) : (
            <NewTicketForm
              /* orders */
              pagedOrders={pagedOrders}
              allOrders={allOrders}
              ordersLoading={ordersLoading}
              ordersError={ordersError}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onRetryOrders={fetchOrders}
              openTicketOrderIds={openTicketOrderIds}
              /* form */
              selectedOrderId={selectedOrderId}
              setSelectedOrderId={setSelectedOrderId}
              selectedIssue={selectedIssue}
              setSelectedIssue={setSelectedIssue}
              priority={priority}
              setPriority={setPriority}
              description={description}
              setDescription={setDescription}
              /* submit */
              submitting={submitting}
              submitError={submitError}
              onSubmit={handleSubmit}
            />
          )
        )}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TAB 1 — MY TICKETS
══════════════════════════════════════════════════════════════════════ */

function TicketsTab({ tickets, loading, error, onRetry, onNewTicket }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
        >
          Retry
        </button>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🎧</div>
        <h3 className="font-semibold text-gray-700 mb-1">No tickets yet</h3>
        <p className="text-gray-400 text-sm mb-6">
          Raise a ticket if you faced any issue with your order.
        </p>
        <button
          onClick={onNewTicket}
          className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700"
        >
          Raise a ticket
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <TicketCard key={ticket._id} ticket={ticket} />
      ))}
    </div>
  );
}

function TicketCard({ ticket }) {
  const [expanded, setExpanded] = useState(false);

  const statusStyle = TICKET_STATUS_STYLES[ticket.status] || TICKET_STATUS_STYLES.OPEN;
  const priorityStyle = PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES.Medium;
  const issueLabel = ISSUE_LABEL_MAP[ticket.issueType] || ticket.issueType;

  // order is populated by the backend's .populate() call
  const order = ticket.order;
  const orderTotal = order?.totalAmount;
  const orderDate  = order?.createdAt;
  const orderItems = order?.items || [];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-900">{issueLabel}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusStyle.pill}`}>
                {statusStyle.label}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Raised {formatDate(ticket.createdAt)}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${priorityStyle.pill}`}>
              {priorityStyle.dot} {ticket.priority}
            </span>
            <span className="text-gray-400 text-sm">{expanded ? "▲" : "▼"}</span>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Your description
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{ticket.description}</p>
          </div>

          {/* Order info */}
          {order && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Order details
              </p>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-500">
                  {orderItems.length} item{orderItems.length !== 1 ? "s" : ""} · {shortDate(orderDate)}
                </span>
                <span className="font-bold text-gray-900">₹{orderTotal?.toFixed(0)}</span>
              </div>
              <div className="space-y-1">
                {orderItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <span>•</span>
                    <span className="flex-1 truncate">{item.name}</span>
                    <span>×{item.quantity}</span>
                    <span className="font-semibold">₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ticket ID for reference */}
          <p className="text-xs text-gray-400">
            Ticket ref: <span className="font-mono">#{ticket._id.slice(-10)}</span>
          </p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TAB 2 — NEW TICKET FORM
══════════════════════════════════════════════════════════════════════ */

function NewTicketForm({
  pagedOrders, allOrders, ordersLoading, ordersError,
  currentPage, totalPages, onPageChange, onRetryOrders,
  openTicketOrderIds,
  selectedOrderId, setSelectedOrderId,
  selectedIssue, setSelectedIssue,
  priority, setPriority,
  description, setDescription,
  submitting, submitError, onSubmit,
}) {
  return (
    <div className="space-y-6">

      {/* ── STEP 1: Select Order ── */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Select order
          </h2>
          {totalPages > 1 && (
            <span className="text-xs text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>

        {ordersLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {ordersError && !ordersLoading && (
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <span className="flex-1">{ordersError}</span>
            <button onClick={onRetryOrders} className="underline text-xs shrink-0">Retry</button>
          </div>
        )}

        {!ordersLoading && !ordersError && allOrders.length === 0 && (
          <p className="text-gray-500 text-sm">No orders found.</p>
        )}

        <div className="space-y-2">
          {pagedOrders.map((order) => {
            const isSelected  = selectedOrderId === order._id;
            const hasOpenTicket = openTicketOrderIds.has(order._id);
            const statusClass = ORDER_STATUS_STYLES[order.orderStatus] || "bg-gray-100 text-gray-700";

            return (
              <label
                key={order._id}
                className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                  isSelected
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="order"
                  value={order._id}
                  checked={isSelected}
                  onChange={() => setSelectedOrderId(order._id)}
                  className="accent-indigo-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      Order #{order._id.slice(-8)}
                    </span>
                    {/* Open ticket indicator */}
                    {hasOpenTicket && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold whitespace-nowrap">
                        Ticket open
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {new Date(order.createdAt).toLocaleDateString()} ·{" "}
                    {order.items.map((i) => i.name).join(", ")}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${statusClass}`}>
                  {order.orderStatus.replace(/_/g, " ")}
                </span>
                <span className="text-sm font-bold whitespace-nowrap">
                  ₹{order.totalAmount.toFixed(0)}
                </span>
              </label>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                  page === currentPage
                    ? "bg-indigo-600 text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        )}
      </section>

      {/* ── STEP 2: Issue Type ── */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          What's the issue?
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {ISSUE_TYPES.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setSelectedIssue(id)}
              className={`flex flex-col items-center gap-1 p-3 border rounded-xl text-center transition-colors ${
                selectedIssue === id
                  ? "border-indigo-400 bg-indigo-50 text-indigo-800"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <span className="text-xl">{icon}</span>
              <span className="text-xs leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── STEP 3: Priority ── */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          How urgent is this?
        </h2>
        <div className="flex gap-2">
          {PRIORITY_OPTIONS.map((p) => {
            const styles = {
              Low:    priority === "Low"    ? "border-green-400 bg-green-50 text-green-800"    : "border-gray-200 text-gray-600 hover:bg-gray-50",
              Medium: priority === "Medium" ? "border-yellow-400 bg-yellow-50 text-yellow-800" : "border-gray-200 text-gray-600 hover:bg-gray-50",
              High:   priority === "High"   ? "border-red-400 bg-red-50 text-red-800"          : "border-gray-200 text-gray-600 hover:bg-gray-50",
            };
            return (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`px-4 py-2 border rounded-full text-sm transition-colors ${styles[p]}`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── STEP 4: Description ── */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Tell us more
        </h2>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder={PLACEHOLDER_MAP[selectedIssue] || "Describe the issue in detail…"}
          className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 resize-none focus:outline-none focus:border-indigo-400"
        />
        <div className="text-right text-xs text-gray-400 mt-1">
          {description.length}/500
        </div>
      </section>

      {/* ── Submit ── */}
      {submitError && <p className="text-red-500 text-sm -mt-2">{submitError}</p>}
      <button
        onClick={onSubmit}
        disabled={submitting}
        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? "Submitting…" : "Submit ticket"}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SUCCESS SCREEN
══════════════════════════════════════════════════════════════════════ */

function SuccessScreen({ onReset }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-2xl font-bold mb-2">Ticket raised!</h2>
      <p className="text-gray-500 mb-2">
        We've received your complaint and will get back to you shortly.
      </p>
      <p className="text-gray-400 text-sm mb-8">
        You can track your ticket status in the <strong>My Tickets</strong> tab.
      </p>
      <button onClick={onReset} className="text-sm text-indigo-600 underline">
        View my tickets
      </button>
    </div>
  );
}