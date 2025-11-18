import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../services/api";
import { formatCurrency, formatters } from "../utils/formatters";
import TablePagination from "../components/common/TablePagination";
// use native browser date input

export default function FinancePage() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const token = localStorage.getItem("accessToken");

  // Filters
  const todayISO = new Date().toISOString().slice(0, 10);
  const [startDisplay, setStartDisplay] = useState(() => formatters.date.toDisplay(todayISO));
  const [endDisplay, setEndDisplay] = useState(() => formatters.date.toDisplay(todayISO));

  // Data
  const [summary, setSummary] = useState({
    revenue: 0,
    cost: 0,
    profit: 0,
    invoicesCount: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  const axiosInstance = useMemo(
    () =>
      axios.create({
        baseURL: API_BASE_URL,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      }),
    [token]
  );

  const quickRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  const fetchSummary = async () => {
    try {
      const { data } = await axiosInstance.get("/finance/summary", {
        params: { startDate: formatters.date.toISO(startDisplay), endDate: formatters.date.toISO(endDisplay) },
      });
      setSummary({
        revenue: Number(data?.revenue || 0),
        cost: Number(data?.cost || 0),
        profit: Number(data?.profit || 0),
        invoicesCount: Number(data?.invoicesCount || 0),
      });
    } catch (err) {
      // Gi? UI ho?t d?ng d? BE chua s?n: kh?ng coi l? fatal
      console.warn("Finance summary fetch failed", err);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosInstance.get("/finance/transactions", {
        params: { startDate: formatters.date.toISO(startDisplay), endDate: formatters.date.toISO(endDisplay) },
      });
      const list = (data || []).map((x, i) => ({
        id: x.id || i + 1,
        date: x.date || new Date().toISOString().slice(0, 10),
        type: x.type || "SALE", // SALE | PURCHASE | OTHER
        code: x.code || "--",
        partner: x.partner || "",
        note: x.note || "",
        amount: Number(x.amount || 0),
      }));
      setTransactions(list);
    } catch (err) {
      console.warn("Finance transactions fetch failed", err);
      setTransactions([]);
      // Kh?ng setError d? kh?ng ch?n m?n h?nh; ch? hi?n th? r?ng
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDisplay, endDisplay]);

  // Filter client-side by query
  const filtered = transactions.filter((x) => {
    const q = query.toLowerCase();
    return (
      x.code.toLowerCase().includes(q) ||
      x.partner.toLowerCase().includes(q) ||
      x.type.toLowerCase().includes(q) ||
      formatters.date.toDisplay(x.date).includes(q)
    );
  });

  const currentRows = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const rowsSelectValue = rowsPerPage > 100 ? "all" : rowsPerPage;

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(value === "all" ? Number.MAX_SAFE_INTEGER : Number(value));
    setCurrentPage(1);
  };

  const exportCSV = () => {
    const rows = [
      ["Date", "Type", "Code", "Partner", "Amount", "Note"],
      ...filtered.map((x) => [
        formatters.date.toDisplay(x.date),
        x.type,
        x.code,
        x.partner,
        x.amount,
        x.note,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Mainlayout>
      <div className="container-fluid py-3">
        {/* Header */}
        <div className="row align-items-center gy-2 mb-3">
          <div className="col-12 col-md-3">
            <h4 className="fw-bold mb-0">{t("finance.title") || "T?i ch?nh - K? to?n"}</h4>
          </div>
          <div className="col-12 col-md-5">
            <div className="row g-2">
              <div className="col">
                <input
                  type="date"
                  className="form-control"
                  value={formatters.date.toISO(startDisplay)}
                  onChange={(e) => { setStartDisplay(formatters.date.toDisplay(e.target.value)); setCurrentPage(1); }}
                />
              </div>
              <div className="col">
                <input
                  type="date"
                  className="form-control"
                  value={formatters.date.toISO(endDisplay)}
                  onChange={(e) => { setEndDisplay(formatters.date.toDisplay(e.target.value)); setCurrentPage(1); }}
                />
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4 d-flex justify-content-end gap-2 flex-wrap">
            <div className="btn-group">
              <button className={`btn btn-outline-${theme}`} onClick={() => { quickRange(7); setStartDisplay(formatters.date.toDisplay(new Date(Date.now()-6*86400000).toISOString().slice(0,10))); setEndDisplay(formatters.date.toDisplay(todayISO)); }}>7 ng?y</button>
              <button className={`btn btn-outline-${theme}`} onClick={() => { quickRange(30); setStartDisplay(formatters.date.toDisplay(new Date(Date.now()-29*86400000).toISOString().slice(0,10))); setEndDisplay(formatters.date.toDisplay(todayISO)); }}>30 ng?y</button>
              <button className={`btn btn-outline-${theme}`} onClick={() => { quickRange(90); setStartDisplay(formatters.date.toDisplay(new Date(Date.now()-89*86400000).toISOString().slice(0,10))); setEndDisplay(formatters.date.toDisplay(todayISO)); }}>90 ng?y</button>
            </div>
            <button className={`btn btn-${theme} text-white`} onClick={exportCSV}>
              <i className="bi bi-download me-1" /> {t("finance.export") || "Xu?t CSV"}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row g-3 mb-3">
          {[{
            label: t("finance.revenue") || "Doanh thu",
            value: formatCurrency(summary.revenue),
            icon: "bi-graph-up",
            className: "text-success",
          },{
            label: t("finance.cost") || "Chi ph?",
            value: formatCurrency(summary.cost),
            icon: "bi-cash-stack",
            className: "text-danger",
          },{
            label: t("finance.profit") || "L?i nhu?n",
            value: formatCurrency(summary.profit),
            icon: "bi-wallet2",
            className: "text-primary",
          },{
            label: t("finance.invoices") || "S? h?a don",
            value: summary.invoicesCount,
            icon: "bi-receipt",
            className: "text-secondary",
          }].map((c, i) => (
            <div key={i} className="col-12 col-md-3">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div>
                    <div className="text-muted small">{c.label}</div>
                    <div className={`fw-bold fs-5 ${c.className}`}>{c.value}</div>
                  </div>
                  <i className={`bi ${c.icon} fs-3 ${c.className}`}></i>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="row align-items-center gy-2 mb-2">
          <div className="col-12 col-md-6">
            <div className="input-group">
              <span className={`input-group-text bg-white border-${theme}`}>
                <i className="bi bi-search" />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder={t("finance.searchPlaceholder") || "T?m theo m?/d?i t?c/ghi ch?"}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
          <div className="col-12 col-md-6 text-end">
            {error && <span className="text-danger small">{error}</span>}
          </div>
        </div>

        {/* Transactions Table */}
        <div
          className="table-responsive rounded-3 shadow-sm" style={{ borderRadius: 16, overflow: "hidden", paddingRight: 8, paddingBottom: 8, backgroundColor: "#fff" }}
        >
          <div style={{ maxHeight: "60vh", overflowX: "auto", overflowY: "auto", borderRadius: 12 }}>
          <table className="table table-hover align-middle mb-0">
            <thead className={`table-${theme}`} style={{ position: "sticky", top: 0, zIndex: 2 }}>
              <tr>
                <th>#</th>
                <th>{t("finance.date") || "Ng?y"}</th>
                <th>{t("finance.type") || "Lo?i"}</th>
                <th>{t("finance.code") || "M? ch?ng t?"}</th>
                <th>{t("finance.partner") || "??i t?c"}</th>
                <th className="text-end">{t("finance.amount") || "S? ti?n"}</th>
                <th>{t("finance.note") || "Ghi ch?"}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    <div className="spinner-border text-primary" role="status" />
                  </td>
                </tr>
              ) : currentRows.length > 0 ? (
                currentRows.map((x, idx) => (
                  <tr key={x.id}>
                    <td>{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                    <td>{formatters.date.toDisplay(x.date)}</td>
                    <td>
                      <span className={`badge ${x.type === "SALE" ? "bg-success" : x.type === "PURCHASE" ? "bg-warning text-dark" : "bg-secondary"}`}>
                        {x.type}
                      </span>
                    </td>
                    <td>{x.code}</td>
                    <td>{x.partner}</td>
                    <td className="text-end fw-semibold">{formatCurrency(x.amount)}</td>
                    <td>{x.note}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    {t("finance.noData") || "Kh?ng c? d? li?u"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalItems={filtered.length}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[15, 30, 50, 100]}
          rowsPerPageValue={rowsSelectValue}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </div>
    </Mainlayout>
  );
}







