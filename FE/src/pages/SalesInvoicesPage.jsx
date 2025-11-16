import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import MainLayout from "../layouts/MainLayout"; // added
// using native date input for quick filtering

/**
 * Trang qu?n l� h�a don b�n h�ng - h? tr?:
 * - i18n qua react-i18next (t(key, fallback))
 * - theme (table-dark / table-light) qua useTheme()
 * - t�m ki?m, l?c tr?ng th�i, m? drawer xem chi ti?t
 *
 * TODO: thay mock b?ng API th?c t? (fetch / axios)
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
  const rowsSelectValue = rowsPerPage > 100 ? "all" : rowsPerPage;

  useEffect(() => {
    const mock = [
      {
        id: "INV-001",
        customer: "Nguy?n Van A",
        total: 1250000,
        status: "�� thanh to�n",
        createdAt: new Date().toISOString(),
        note: "Giao h�ng nhanh",
        items: [
          { name: "S?n ph?m 1", qty: 2, price: 250000 },
          { name: "S?n ph?m 2", qty: 1, price: 750000 },
        ],
      },
      {
        id: "INV-002",
        customer: "C�ng ty B",
        total: 560000,
        status: "Chua thanh to�n",
        createdAt: new Date().toISOString(),
        note: "",
        items: [{ name: "S?n ph?m 3", qty: 7, price: 80000 }],
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
    if (!list.length) return alert(t("invoices.selectToExport"));
    console.log("Export invoices", list);
  };
  const handlePrintSelected = () => {
    const list = invoices.filter((inv) => selectedInvoices.includes(inv.id));
    if (!list.length) return alert(t("invoices.selectToPrint"));
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
            {t("sales.invoices", "H�a don")}
          </h4>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div style={{ minWidth: 360, maxWidth: 760, width: "55vw" }}>
            <div className="input-group input-group-sm">
              <input
                type="text"
                className="form-control"
                placeholder={t("search.placeholder", "T�m theo m� ho?c kh�ch h�ng")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className="btn btn-outline-secondary" type="button">
                <i className="bi bi-funnel" />
              </button>
            </div>
          </div>

          <button className="btn btn-sm btn-success" onClick={onAdd}>
            <i className="bi bi-plus-lg me-1" /> {t("create.new", "T?o m?i")}
          </button>
          <button className="btn btn-sm btn-outline-success" onClick={onExport}>
            <i className="bi bi-file-earmark-excel me-1" /> {t("export", "Xu?t file")}
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
              <div className="mb-2"><strong>{t("filter.title", "B? l?c")}</strong></div>

              <div className="mb-2">
                <label className="form-label small m-0">{t("invoice.status", "Tr?ng th�i")}</label>
                <select
                  className="form-select form-select-sm"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">{t("filter.all", "T?t c?")}</option>
                  <option value="�� thanh to�n">{t("filter.paid", "�� thanh to�n")}</option>
                  <option value="Chua thanh to�n">{t("filter.unpaid", "Chua thanh to�n")}</option>
                </select>
              </div>

              <div className="mb-2">
                <label className="form-label small m-0">{t("invoice.date", "Ng�y")}</label>
                <input type="date" className="form-control form-control-sm" onChange={(e) => { /* TODO: hook filter */ }} />
              </div>

              <div className="mb-2">
                <label className="form-label small m-0">{t("invoice.customer", "Kh�ch h�ng")}</label>
                <input type="text" className="form-control form-control-sm" placeholder={t("search.placeholder", "T�m theo kh�ch h�ng")} onChange={(e) => setQuery(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="col-md-9">
            <div className="table-responsive rounded-3" style={{ borderRadius: 16, overflow: "hidden", paddingRight: 8, paddingBottom: 8, backgroundColor: "#fff" }}>
              <div style={{ maxHeight: "60vh", overflowX: "auto", overflowY: "auto", borderRadius: 12 }}>
                <table className={`table table-sm table-hover ${tableThemeClass} align-middle mb-0`}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
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
            </div>

              <div className="d-flex justify-content-between align-items-center border-top pt-2">
                <div className="fw-semibold">{t("invoice.total", "T?ng")}</div>
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








