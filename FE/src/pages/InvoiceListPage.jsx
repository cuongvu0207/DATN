import React, { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { useTranslation } from "react-i18next";
import { exportInvoicesToExcel } from "../utils/exportInvoicesUtils"; // ✅ tạo utils tương tự exportProductsUtils
import InvoiceHeaderBar from "../components/invoice/InvoiceHeaderBar";
import InvoiceFilterPanel from "../components/invoice/InvoiceFilterPanel";
import InvoiceTable from "../components/invoice/InvoiceTable";

export default function InvoiceListPage() {
  const { t } = useTranslation();

  /* === Demo dữ liệu hóa đơn === */
  const invoices = Array.from({ length: 20 }, (_, i) => ({
    id: `HD00${i + 1}`,
    customer: `Khách hàng ${i + 1}`,
    phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
    total: 500000 + i * 25000,
    discount: i % 3 === 0 ? 50000 : 0,
    paymentMethod: i % 2 === 0 ? "Tiền mặt" : "Chuyển khoản",
    status: i % 2 === 0 ? "Đã thanh toán" : "Chưa thanh toán",
    createdAt: i % 2 === 0 ? "25/10/2025" : "24/10/2025",
    seller: i % 2 === 0 ? "Nhân viên A" : "Nhân viên B",
  }));

  /* === STATE === */
  const [query, setQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    paymentMethod: "",
    seller: "",
    createdAt: "",
  });

  /* === HANDLERS === */
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleSelectOne = (id) => {
    setSelectedInvoices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked, currentPageItems) => {
    if (checked) {
      const allIds = currentPageItems.map((p) => p.id);
      setSelectedInvoices((prev) => [...new Set([...prev, ...allIds])]);
    } else {
      const pageIds = currentPageItems.map((p) => p.id);
      setSelectedInvoices((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleExportSelected = () => {
    const selectedList = invoices.filter((p) => selectedInvoices.includes(p.id));
    if (selectedList.length === 0) {
      alert(t("invoices.selectToExport") || "Vui lòng chọn hóa đơn để xuất file!");
      return;
    }
    exportInvoicesToExcel(selectedList, t);
  };

  /* === Lọc danh sách hóa đơn === */
  const filtered = invoices.filter((inv) => {
    const queryLower = query.toLowerCase();

    const matchesQuery =
      inv.id.toLowerCase().includes(queryLower) ||
      inv.customer.toLowerCase().includes(queryLower) ||
      inv.phone.includes(queryLower);

    const matchesStatus = !filters.status || inv.status === filters.status;
    const matchesPayment = !filters.paymentMethod || inv.paymentMethod === filters.paymentMethod;
    const matchesSeller = !filters.seller || inv.seller === filters.seller;
    const matchesDate =
      !filters.createdAt ||
      inv.createdAt === new Date(filters.createdAt).toLocaleDateString("vi-VN");

    return matchesQuery && matchesStatus && matchesPayment && matchesSeller && matchesDate;
  });

  /* === JSX === */
  return (
    <MainLayout>
      <div className="container-fluid py-3">
        {/* HEADER BAR */}
        <InvoiceHeaderBar
          query={query}
          setQuery={setQuery}
          onExport={handleExportSelected}
        />

        <div className="row g-3 mt-1">
          <InvoiceFilterPanel filters={filters} onChange={handleFilterChange} />

          <InvoiceTable
            invoices={filtered}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            selectedInvoices={selectedInvoices}
            onSelectOne={handleSelectOne}
            onSelectAll={handleSelectAll}
          />
        </div>
      </div>
    </MainLayout>
  );
}
