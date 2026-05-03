import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthContext } from "./contexts/AuthContext.jsx";
import { CartProvider } from "./contexts/CartContext.jsx";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home.jsx";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart.jsx";
import Profile from "./pages/Profile.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import AdminOrdersPage from "./pages/AdminOrdersPage.jsx";
import SupportPage from "./pages/SupportPage.jsx";
import AdminSupportPage from "./pages/AdminSupportPage";
import LegalPage from "./pages/LegalPage.jsx";

const ProtectedRoute = ({ children }) => {
  const { accessToken, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { accessToken, user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  if (user.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  return children;
};

function App() {
  const { loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  return (
    <CartProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/info" element={<LegalPage />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orderspage"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <SupportPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/paymentpage"
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminOrdersPage />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/support"
            element={
              <AdminRoute>
                <AdminSupportPage />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
