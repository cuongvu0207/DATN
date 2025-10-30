import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import MainLayout from "../layouts/MainLayout"; // added

/**
 * Trang quản lý hóa đơn bán hàng - hỗ trợ:
 * - i18n qua react-i18next (t(key, fallback))
 * - theme (table-dark / table-light) qua useTheme()
 * - tìm kiếm, lọc trạng thái, mở drawer xem chi tiết
 *
 * TODO: thay mock bằng API thực tế (fetch / axios)
 */

export default function SalesInvoicesPage() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [invoices, setInvoices] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  useEffect(() => {
    const mock = [
      {
        id: "INV-001",
        customer: "Nguyễn Văn A",
        total: 1250000,
        status: "Đã thanh toán",
        createdAt: new Date().toISOString(),
        note: "Giao hàng nhanh",
        items: [
          { name: "Sản phẩm 1", qty: 2, price: 250000 },
          { name: "Sản phẩm 2", qty: 1, price: 750000 },
        ],
      },
      {
        id: "INV-002",
        customer: "Công ty B",
        total: 560000,
        status: "Chưa thanh toán",
        createdAt: new Date().toISOString(),
        note: "",
        items: [{ name: "Sản phẩm 3", qty: 7, price: 80000 }],
      },
    ];
    setInvoices(mock);
  }, []);

  const fmtCurrency = (v) =>
    v == null ? "-" : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v);
  const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "-");

  const tableThemeClass = theme === "dark" ? "table-dark" : "table-light";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      if (!q) return true;
      return (inv.id || "").toLowerCase().includes(q) || (inv.customer || "").toLowerCase().includes(q);
    });
  }, [invoices, query, statusFilter]);

  function openDetail(inv) {
    setSelected(inv);
    setShowDetail(true);
  }
  function closeDetail() {
    setSelected(null);
    setShowDetail(false);
  }

  const handleSelectOne = (id) => {
    setSelectedInvoices((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const handleSelectAll = (checked, currentItems) => {
    if (checked) {
      const allIds = currentItems.map((i) => i.id);
      setSelectedInvoices((prev) => [...new Set([...prev, ...allIds])]);
    } else {
      const pageIds = currentItems.map((i) => i.id);
      setSelectedInvoices((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleExportSelected = () => {
    const list = invoices.filter((inv) => selectedInvoices.includes(inv.id));
    if (!list.length) return alert(t("invoices.selectToExport") || "Vui lòng chọn hóa đơn để xuất!");
    console.log("Export invoices", list);
  };
  const handlePrintSelected = () => {
    const list = invoices.filter((inv) => selectedInvoices.includes(inv.id));
    if (!list.length) return alert(t("invoices.selectToPrint") || "Vui lòng chọn hóa đơn để in!");
    console.log("Print invoices", list);
  };

  const start = (currentPage - 1) * rowsPerPage;
  const currentItems = filtered.slice(start, start + rowsPerPage);

  const InvoiceHeaderBar = ({ query, setQuery, onAdd, onExport, onPrint }) => (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h4 className="mb-0">
            <i className="bi bi-receipt me-2 text-primary" />
            {t("sales.invoices", "Hóa đơn")}
          </h4>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div style={{ minWidth: 360, maxWidth: 760, width: "55vw" }}>
            <div className="input-group input-group-sm">
              <input
                type="text"
                className="form-control"
                placeholder={t("search.placeholder", "Tìm theo mã hoặc khách hàng")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className="btn btn-outline-secondary" type="button">
                <i className="bi bi-funnel" />
              </button>
            </div>
          </div>

          <button className="btn btn-sm btn-success" onClick={onAdd}>
            <i className="bi bi-plus-lg me-1" /> {t("create.new", "Tạo mới")}
          </button>
          <button className="btn btn-sm btn-outline-success" onClick={onExport}>
            <i className="bi bi-file-earmark-excel me-1" /> {t("export", "Xuất file")}
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={onPrint}>
            <i className="bi bi-printer me-1" /> {t("print", "In")}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="container-fluid py-3">
        <InvoiceHeaderBar
          query={query}
          setQuery={setQuery}
          onAdd={() => console.log("Open add invoice")}
          onExport={handleExportSelected}
          onPrint={handlePrintSelected}
        />

        <div className="row g-3 mt-1">
          <div className="col-md-3">
            <div className="card card-body mb-3">
              <div className="mb-2"><strong>{t("filter.title", "Bộ lọc")}</strong></div>

              <div className="mb-2">
                <label className="form-label small m-0">{t("invoice.status", "Trạng thái")}</label>
                <select
                  className="form-select form-select-sm"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">{t("filter.all", "Tất cả")}</option>
                  <option value="Đã thanh toán">{t("filter.paid", "Đã thanh toán")}</option>
                  <option value="Chưa thanh toán">{t("filter.unpaid", "Chưa thanh toán")}</option>
                </select>
              </div>

              <div className="mb-2">
                <label className="form-label small m-0">{t("invoice.date", "Ngày")}</label>
                <input type="date" className="form-control form-control-sm" onChange={(e) => { /* hook date filter if needed */ }} />
              </div>

              <div className="mb-2">
                <label className="form-label small m-0">{t("invoice.customer", "Khách hàng")}</label>
                <input type="text" className="form-control form-control-sm" placeholder={t("search.placeholder", "Tìm theo khách hàng")} onChange={(e) => setQuery(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="col-md-9">
            <div className="table-responsive">
              <table className={`table table-sm table-hover table-bordered ${tableThemeClass} align-middle mb-0`}>
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input
                        type="checkbox"
                        checked={currentItems.length > 0 && currentItems.every(i => selectedInvoices.includes(i.id))}
                        onChange={(e) => handleSelectAll(e.target.checked, currentItems)}
                      />
                    </th>
                    <th style={{ width: 48 }}>#</th>
                    <th>{t("invoice.id", "Mã")}</th>
                    <th>{t("invoice.customer", "Khách hàng")}</th>
                    <th>{t("invoice.date", "Ngày")}</th>
                    <th className="text-end">{t("invoice.total", "Tổng")}</th>
                    <th>{t("invoice.status", "Trạng thái")}</th>
                    <th>{t("actions", "Hành động")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-4">{t("noData", "Không có dữ liệu")}</td>
                    </tr>
                  ) : (
                    currentItems.map((inv, idx) => (
                      <tr key={inv.id}>
                        <td>
                          <input type="checkbox" checked={selectedInvoices.includes(inv.id)} onChange={() => handleSelectOne(inv.id)} />
                        </td>
                        <td>{start + idx + 1}</td>
                        <td className="text-primary fw-semibold">{inv.id}</td>
                        <td>{inv.customer}</td>
                        <td>{fmtDate(inv.createdAt)}</td>
                        <td className="text-end text-success fw-bold">{fmtCurrency(inv.total)}</td>
                        <td>
                          <span className={`badge ${inv.status === "Đã thanh toán" ? "bg-success-subtle text-success border border-success" : "bg-warning-subtle text-warning border border-warning"}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary" onClick={() => openDetail(inv)}><i className="bi bi-eye" /></button>
                            <button className="btn btn-outline-success"><i className="bi bi-pencil" /></button>
                            <button className="btn btn-outline-danger"><i className="bi bi-trash" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-2">
              <div className="small text-muted">
                {filtered.length === 0 ? 0 : start + 1}-{Math.min(start + rowsPerPage, filtered.length)} / {filtered.length}
              </div>
              <div className="d-flex gap-2">
                <select className="form-select form-select-sm" style={{ width: 80 }} value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                </select>
                <button className="btn btn-sm btn-outline-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Prev</button>
                <button className="btn btn-sm btn-outline-secondary" disabled={start + rowsPerPage >= filtered.length} onClick={() => setCurrentPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          </div>
        </div>

        {showDetail && selected && (
          <div
            className="position-fixed top-0 end-0 h-100 bg-white shadow-lg border-start"
            style={{ width: 520, zIndex: 1050, animation: "slideInRight 0.3s ease" }}
          >
            <div className={`d-flex justify-content-between align-items-center border-bottom px-3 py-3 bg-${theme} bg-opacity-10`}>
              <h5 className="mb-0">#{selected.id} — {selected.customer}</h5>
              <div>
                <button className="btn btn-sm btn-outline-secondary" onClick={closeDetail}>
                  {t("close", "Đóng")}
                </button>
              </div>
            </div>

            <div className="p-3 overflow-auto" style={{ height: "calc(100% - 60px)" }}>
              <div className="mb-2">
                <div className="text-muted small">{t("invoice.date", "Ngày")}</div>
                <div>{new Date(selected.createdAt).toLocaleString("vi-VN")}</div>
              </div>
              <div className="mb-2">
                <div className="text-muted small">{t("invoice.note", "Ghi chú")}</div>
                <div>{selected.note || "-"}</div>
              </div>

              <div className="mb-3">
                <div className="text-muted small">{t("invoice.items", "Hàng hóa")}</div>
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th className="text-start">{t("invoice.itemName", "Tên")}</th>
                      <th>SL</th>
                      <th className="text-end">{t("invoice.price", "Giá")}</th>
                      <th className="text-end">{t("invoice.subtotal", "Thành tiền")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items?.map((it, i) => (
                      <tr key={i}>
                        <td className="text-start">{it.name}</td>
                        <td className="text-center">{it.qty}</td>
                        <td className="text-end">{fmtCurrency(it.price)}</td>
                        <td className="text-end text-success">{fmtCurrency(it.qty * it.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-between align-items-center border-top pt-2">
                <div className="fw-semibold">{t("invoice.total", "Tổng")}</div>
                <div className="text-success fw-bold">{fmtCurrency(selected.total)}</div>
              </div>
            </div>

            <style>{`
              @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
            `}</style>
          </div>
        )}
      </div>
    </MainLayout>
  );
}