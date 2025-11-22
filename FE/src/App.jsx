import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";

import HomePage from "./pages/HomePage";
import SalesPage from "./pages/SalesPage";
import LoginPage from "./pages/LoginPage";
import ProductListPage from "./pages/ProductListPage";
import AccountPage from "./pages/AccountPage";
import ImportPage from "./pages/ImportPage";
import ImportDetailPage from "./pages/ImportDetailPage";
import SetPricePage from "./pages/SetPricePage";
import SalesInvoicesPage from "./pages/InvoiceListPage";
import StaffPage from "./pages/StaffPage";
import FinancePage from "./pages/FinancePage";
import SupplierPage from "./pages/SupplierPage";
import ProtectedRoute from "./components/auth/ProtectedRoute"; 
import CustomerPage from "./pages/CustomerPage";
import PaymentNotification from "./pages/PaymentNotification";
export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* ✅ Trang Login — cho phép truy cập tự do */}
          <Route path="/login" element={<LoginPage />} />

          {/* ✅ Tất cả các route khác đều yêu cầu có token */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/sales" element={<SalesPage />} />
                  <Route path="/sales/invoices" element={<SalesInvoicesPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/products/list" element={<ProductListPage />} />
                  <Route path="/products/import" element={<ImportPage />} />
                  <Route path="/products/importdetail" element={<ImportDetailPage />} />
                  <Route path="/products/prices" element={<SetPricePage />} />
                  <Route path="/staff" element={<StaffPage />} />
                  <Route path="/finance" element={<FinancePage />} />
                  <Route path="/products/supplier" element={<SupplierPage />} />
                  <Route path="/customers" element={<CustomerPage />} />
                  <Route path="/payment-notification" element={<PaymentNotification />} />

                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
