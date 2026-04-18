import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthContext } from "./contexts/AuthContext.jsx";
import { CartProvider } from "./contexts/CartContext.jsx";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home.jsx";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart.jsx";
import Profile from "./pages/Profile.jsx";
import PaymentPage from "./pages/Paymentpage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import AdminOrdersPage from "./pages/AdminOrdersPage.jsx";
import SupportPage from "./pages/SupportPage.jsx";
import AdminSupportPage from "./pages/AdminSupportPage";

// 🔒 Protected Route Wrapper (only for critical pages)
const ProtectedRoute = ({ children }) => {
  const { accessToken } = useContext(AuthContext);
  return accessToken ? children : <Navigate to="/login" />;
};

function App() {
  const { loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  return (
    <CartProvider>
      <Router>
        <Routes>
          {/* 🌐 Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/profile" element={<Profile />}/>
          <Route path="/orderspage" element={ <OrdersPage />}/>
          <Route path="/support" element={ <SupportPage />}/>

            {/* 🔒 Protected Routes */}
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
              <ProtectedRoute>
                <AdminOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/support"
            element={
              <ProtectedRoute>
                <AdminSupportPage />
              </ProtectedRoute>
            }
          />


          {/* 🔁 Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;