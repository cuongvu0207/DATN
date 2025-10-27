import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";   // import ThemeProvider
import HomePage from "./pages/HomePage";
import SalesPage from "./pages/SalesPage";
import LoginPage from "./pages/LoginPage";
import ProductListPage from "./pages/ProductListPage";
import AccountPage from "./pages/AccountPage";
import ImportPage from "./pages/ImportPage";
import ImportDetailPage from "./pages/ImportDetailPage";
import SetPricePage from "./pages/SetPricePage";
import SalesInvoicesPage from "./pages/InvoiceListPage";
export default function App() {
  return (
    <ThemeProvider>  
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/sales/invoices" element={<SalesInvoicesPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/products/list" element={<ProductListPage />} />
          <Route path="/products/import" element={<ImportPage />} />
          <Route path="/products/importdetail" element={<ImportDetailPage />} />
          <Route path="/products/prices" element={<SetPricePage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
