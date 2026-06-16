import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import BinsPage from "./pages/BinsPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import AboutUs from "./pages/AboutUs";
import Register from "./components/register/register";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import InventoryDashboard from "./components/Inventory/InventoryDashboard";
import InventoryProfile from "./components/Inventory/InventoryProfile";
import InventoryForms from "./components/Inventory/InventoryForms";
import InventorySorting from "./components/Inventory/InventorySorting";
import InventoryReports from "./components/Inventory/InventoryReports";
import InventoryAnalytics from "./components/Inventory/InventoryAnalytics";
import InventoryRequests from "./components/Inventory/InventoryRequests";
import InventoryDeliveryRecords from "./components/Inventory/InventoryDeliveryRecords";
import ProductionDashboard from "./components/Production/ProductionDashboard";
import ProductionAnalyticsPage from "./components/Production/ProductionAnalyticsPage";
import ProductionReportPage from "./components/Production/ProductionReportPage";
import PointsCheckout from "./components/checkout/PointsCheckout";
import OrderConfirmation from "./pages/OrderConfirmation";
import UnifiedFinanceDashboard from "./components/finance/UnifiedFinanceDashboard";
import AdminDashboard from "./components/admin/AdminDashboard";
import TransportDashboard from "./components/transport/TransportDashboard";
import TransportReports from "./components/transport/TransportReports";
import CollectorsDashboard from "./components/collectors/CollectorsDashboard";
import InventoryMaterials from "./components/Inventory/InventoryMaterials";
import InventoryStockManagement from "./components/Inventory/InventoryStockManagement";
import FAQ from "./components/business/FAQ";
import Contact from "./components/business/Contact";
import HelpCenter from "./components/business/HelpCenter";
import Chatbot from "./components/chatbot/Chatbot";



function App() {
  const location = useLocation();
  const showChatbot = ["/", "/products", "/contact"].includes(location.pathname);

  return (
     <AuthProvider>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/points" element={
            <ProtectedRoute>
              <PointsCheckout />
            </ProtectedRoute>

          } />

          <Route path="/order-confirmation" element={
            <ProtectedRoute>
              <OrderConfirmation />
            </ProtectedRoute>
          } />

          <Route path="/about" element={<AboutUs />} />
          <Route path="/bins" element={<BinsPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help" element={<HelpCenter />} />



          {/* Protected Routes - General User */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/collectors"
            element={
              <ProtectedRoute>
                <CollectorsDashboard />
              </ProtectedRoute>
            }
          />



          {/* Protected Routes - Admin Only */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />



          {/* Protected Routes - Manager/Admin */}

          <Route
            path="/inventory"
            element={
              <ProtectedRoute requiredRole="inventory">
                <InventoryDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory/requests"
            element={
              <ProtectedRoute requiredRole="inventory">
                <InventoryRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory/deliveries"
            element={
              <ProtectedRoute requiredRole="inventory">
                <InventoryDeliveryRecords />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory/profile"
            element={
              <ProtectedRoute>
                <InventoryProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory/forms"
            element={
              <ProtectedRoute>
                <InventoryForms />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory/stock"
            element={
              <ProtectedRoute>
                <InventoryStockManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory/analytics"
            element={

              <ProtectedRoute>
                <InventoryAnalytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory/sorting"
            element={
              <ProtectedRoute>
                <InventorySorting />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory/reports"
            element={
              <ProtectedRoute>
                <InventoryReports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory/materials"
            element={
              <ProtectedRoute>
                <InventoryMaterials />
              </ProtectedRoute>
            }
          />



          <Route
            path="/production"
            element={
              <ProtectedRoute requiredRole="production">
                <ProductionDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/production/analytics"
            element={
              <ProtectedRoute requiredRole="production">
                <ProductionAnalyticsPage />
              </ProtectedRoute>

            }
          />

          <Route
            path="/production/reports"

            element={
              <ProtectedRoute requiredRole="production">
                <ProductionReportPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/finance"
            element={
              <ProtectedRoute requiredRole="finance">
                <UnifiedFinanceDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/transport"
            element={
              <ProtectedRoute requiredRole="transport">
                <TransportDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/transport/reports"
            element={
              <ProtectedRoute requiredRole="transport">
                <TransportReports />
              </ProtectedRoute>
            }
          />



          {/* Legacy Routes - Redirect to new dashboard */}
          <Route
            path="/user-dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }

          />

          <Route
            path="/manager-dashboard"
            element={
              <ProtectedRoute requiredRole="manager">
                <UserDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>

      {showChatbot && <Chatbot />}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick

        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover

      />

    </AuthProvider>

  );

}

//change branch

export default App;

