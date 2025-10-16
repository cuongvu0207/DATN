import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";   // ✅ import ThemeProvider
import HomePage from "./pages/HomePage";
import SalesPage from "./pages/SalesPage";
import LoginPage from "./pages/LoginPage";
import ProductListPage from "./pages/ProductListPage";

export default function App() {
  return (
    <ThemeProvider>  {/* ✅ Bọc toàn bộ Router trong ThemeProvider */}
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/products/list" element={<ProductListPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
