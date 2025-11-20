import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import MainLayout from "../layouts/MainLayout";
import axios from "axios";
import { API_BASE_URL } from "../services/api";
import { formatCurrency } from "../utils/formatters";

export default function InvoiceListPage() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const token = localStorage.getItem("accessToken");

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  const tableThemeClass = theme === "dark" ? "table-dark" : "table-light";

  /* =========================================
     1) FETCH API hóa đơn đã bán
  ========================================= */
  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/order/static/allCompleted`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const mapped = res.data.map((o) => ({
          id: o.orderId,
          customer:
            o.customerId === "default_customer_id"
              ? "Khách vãng lai"
              : `Khách #${o.customerId.substring(0, 6)}`,
          total: o.totalPrice,
          paymentMethod: o.paymentMethod,
          seller: o.cashierId,
          createdAt: o.createdAt,
          items: o.orderItemDTOs,
        }));

        setInvoices(mapped);
      } catch (err) {
        console.error("Error loading invoices:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [token]);

  const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleString("vi-VN") : "-";

  /* =========================================
     2) FILTER + SEARCH
  ========================================= */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return invoices.filter((inv) => {
      const matchQ =
        inv.id.toLowerCase().includes(q) ||
        inv.customer.toLowerCase().includes(q);

      const matchPayment =
        paymentFilter === "all" ||
        inv.paymentMethod === paymentFilter;

      const matchDate =
        !dateFilter ||
        inv.createdAt.startsWith(
          new Date(dateFilter).toLocaleDateString("vi-VN")
        );

      return matchQ && matchPayment && matchDate;
    });
  }, [invoices, query, paymentFilter, dateFilter]);

  /* =========================================
     3) PAGINATION
  ========================================= */
  const start = (currentPage - 1) * rowsPerPage;
  const currentItems = filtered.slice(start, start + rowsPerPage);

  /* =========================================
     4) MULTI SELECT
  ========================================= */
  const handleSelectOne = (id) => {
    setSelectedInvoices((prev) =>
      prev.includes(id)
        ? prev.filter((c) => c !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (checked, items) => {
    const ids = items.map((i) => i.id);

    setSelectedInvoices((prev) =>
      checked ? [...new Set([...prev, ...ids])] : prev.filter((p) => !ids.includes(p))
    );
  };

  /* =========================================
     5) DETAIL DRAWER
  ========================================= */
  const openDetail = (inv) => {
    setSelected(inv);
    setShowDetail(true);
  };

  const closeDetail = () => {
    setSelected(null);
    setShowDetail(false);
  };

  /* =========================================
     RENDER
  ========================================= */

  return (
    <MainLayout>
      <div className="container-fluid py-3">

        {/* HEADER */}
        <div className="d-flex justify-content-between mb-3">
          <h4 className="fw-bold">
            <i className="bi bi-receipt text-primary me-2" />
            Hóa đơn đã bán
          </h4>

          <input
            type="text"
            className="form-control w-25"
            placeholder="Tìm mã / khách hàng..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="row g-3">
          {/* FILTER PANEL */}
          <div className="col-md-3">
            <div className="card card-body">
              <label className="form-label">Hình thức thanh toán</label>
              <select
                className="form-select mb-3"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="CASH">Tiền mặt</option>
                <option value="TRANSFER">Chuyển khoản</option>
                <option value="WALLET">Ví điện tử</option>
              </select>

              <label className="form-label">Ngày bán</label>
              <input
                type="date"
                className="form-control"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="col-md-9">
            <div className="table-responsive bg-white p-3 rounded-3 shadow-sm">
              <table className={`table table-hover ${tableThemeClass}`}>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          currentItems.length > 0 &&
                          currentItems.every((i) =>
                            selectedInvoices.includes(i.id)
                          )
                        }
                        onChange={(e) =>
                          handleSelectAll(e.target.checked, currentItems)
                        }
                      />
                    </th>
                    <th>#</th>
                    <th>Mã HĐ</th>
                    <th>Khách hàng</th>
                    <th>Ngày bán</th>
                    <th className="text-end">Tổng tiền</th>
                    <th>Thanh toán</th>
                    <th>Nhân viên</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="text-center py-4">
                        <div className="spinner-border text-primary"></div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center text-muted py-4">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((inv, idx) => (
                      <tr key={inv.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedInvoices.includes(inv.id)}
                            onChange={() => handleSelectOne(inv.id)}
                          />
                        </td>

                        <td>{start + idx + 1}</td>
                        <td className="fw-bold text-primary">{inv.id}</td>
                        <td>{inv.customer}</td>
                        <td>{fmtDate(inv.createdAt)}</td>
                        <td className="text-end text-success fw-semibold">
                          {formatCurrency(inv.total)}
                        </td>
                        <td>
                          <span className="badge bg-info text-dark">
                            {inv.paymentMethod}
                          </span>
                        </td>
                        <td>{inv.seller}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openDetail(inv)}
                          >
                            Xem
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* DETAIL DRAWER */}
            {showDetail && selected && (
              <div
                className="position-fixed top-0 end-0 bg-white shadow-lg p-4"
                style={{
                  width: 380,
                  height: "100vh",
                  zIndex: 9999,
                  animation: "slideInRight 0.3s ease",
                }}
              >
                <div className="d-flex justify-content-between mb-3">
                  <h5 className="fw-bold">Chi tiết hóa đơn</h5>
                  <button className="btn btn-danger btn-sm" onClick={closeDetail}>Đóng</button>
                </div>

                <p><strong>Mã:</strong> {selected.id}</p>
                <p><strong>Khách:</strong> {selected.customer}</p>
                <p><strong>Ngày:</strong> {fmtDate(selected.createdAt)}</p>

                <hr />

                <strong>Sản phẩm:</strong>
                {selected.items.map((it, i) => (
                  <div key={i} className="d-flex justify-content-between py-1 border-bottom">
                    <span>{it.productName}</span>
                    <span>x{it.quantity}</span>
                    <span>{formatCurrency(it.price)}</span>
                  </div>
                ))}

                <hr />

                <div className="d-flex justify-content-between fw-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-success">
                    {formatCurrency(selected.total)}
                  </span>
                </div>
              </div>
            )}

            <style>{`
              @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0 }
                to   { transform: translateX(0); opacity: 1 }
              }
            `}</style>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
