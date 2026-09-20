import React, { lazy, Suspense, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthContext } from "./contexts/AuthContext.jsx";
import { CartProvider } from "./contexts/CartContext.jsx";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Home = lazy(() => import("./pages/Home.jsx"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const PaymentPage = lazy(() => import("./pages/PaymentPage.jsx"));
const OrdersPage = lazy(() => import("./pages/OrdersPage.jsx"));
const AdminOrdersPage = lazy(() => import("./pages/AdminOrdersPage.jsx"));
const SupportPage = lazy(() => import("./pages/SupportPage.jsx"));
const SupportPublicPage = lazy(() => import("./pages/SupportPublicPage.jsx"));
const AdminSupportPage = lazy(() => import("./pages/AdminSupportPage"));
const Legalpage = lazy(() => import("./pages/Legalpage.jsx"));
const EditProfile = lazy(() => import("./pages/EditProfile.jsx"));
const AdminInventoryPage = lazy(() => import("./pages/AdminInventoryPage.jsx"));
const DownloadPage = lazy(() => import("./pages/DownloadPage.jsx"));
import Layout from "./components/Layout";
const CategoryPage = lazy(() => import("./pages/CategoryPage.jsx"));
const LocationPage = lazy(() => import("./pages/LocationPage.jsx"));

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

const SupportRoute = () => {
  const { accessToken, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (accessToken) {
    return <SupportPage />;
  }

  return <SupportPublicPage />;
};

function App() {
  const { loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  return (
    <CartProvider>
      <Router>
        <Suspense
          fallback={
            <div className="grid min-h-[50vh] place-items-center bg-[#fffaf6] px-4 text-sm font-semibold text-black/55">
              Loading CleanChops...
            </div>
          }
        >
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/location"
            element={
              <ProtectedRoute>
                <LocationPage />
              </ProtectedRoute>
            }
          />
          <Route path="/info" element={<Legalpage />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route
            path="/category/:categorySlug"
            element={
              <Layout>
                <CategoryPage />
              </Layout>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute>
                <EditProfile />
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
            element={<SupportRoute />}
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
            path="/admin/inventory"
            element={
              <AdminRoute>
                <AdminInventoryPage />
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
        </Suspense>
      </Router>
    </CartProvider>
  );
}

export default App;
