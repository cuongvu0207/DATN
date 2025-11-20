import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../services/api";
import { formatCurrency, formatters } from "../utils/formatters";
import TablePagination from "../components/common/TablePagination";

export default function FinancePage() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const token = localStorage.getItem("accessToken");

  // ===== TAB STATE =====
  const [activeTab, setActiveTab] = useState("tax-overview"); // 'tax-overview' | 'tax-calculator' | 'accounting'

  // ===== DATE FILTERS (CHO TAB KẾ TOÁN) =====
  const todayISO = new Date().toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(todayISO);
  const [endDate, setEndDate] = useState(todayISO);

  const [startDisplay, setStartDisplay] = useState(
    formatters.date.toDisplay(todayISO)
  );
  const [endDisplay, setEndDisplay] = useState(
    formatters.date.toDisplay(todayISO)
  );

  // ===== DATA KẾ TOÁN =====
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

  // ===== TAX CALCULATOR STATE (TAB 2) =====
  const [taxPeriod, setTaxPeriod] = useState("QUARTER"); // MONTH | QUARTER | YEAR
  const [taxRevenue, setTaxRevenue] = useState(0);
  const [taxVatRate, setTaxVatRate] = useState(0); // %
  const [taxPitRate, setTaxPitRate] = useState(0); // %

  const vatAmount = (Number(taxRevenue) * Number(taxVatRate || 0)) / 100;
  const pitAmount = (Number(taxRevenue) * Number(taxPitRate || 0)) / 100;
  const totalTax = vatAmount + pitAmount;
  const effectiveRate =
    Number(taxRevenue) > 0 ? (totalTax / Number(taxRevenue)) * 100 : 0;

  // ===== AXIOS INSTANCE =====
  const axiosInstance = useMemo(
    () =>
      axios.create({
        baseURL: API_BASE_URL,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
    [token]
  );

  // ===== QUICK RANGE (TAB KẾ TOÁN) =====
  const quickRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));

    const sISO = start.toISOString().slice(0, 10);
    const eISO = end.toISOString().slice(0, 10);

    setStartDate(sISO);
    setEndDate(eISO);
    setStartDisplay(formatters.date.toDisplay(sISO));
    setEndDisplay(formatters.date.toDisplay(eISO));
    setCurrentPage(1);
  };

  // ===== FETCH SUMMARY (CHỈ DÙNG CHO TAB KẾ TOÁN) =====
  const fetchSummary = async () => {
    try {
      const { data } = await axiosInstance.get("/finance/summary", {
        params: {
          startDate,
          endDate,
        },
      });

      setSummary({
        revenue: Number(data?.revenue || 0),
        cost: Number(data?.cost || 0),
        profit: Number(data?.profit || 0),
        invoicesCount: Number(data?.invoicesCount || 0),
      });
    } catch (err) {
      console.warn("Finance summary not available", err);
    }
  };

  // ===== FETCH TRANSACTIONS (CHỈ DÙNG CHO TAB KẾ TOÁN) =====
  const fetchTransactions = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await axiosInstance.get("/finance/transactions", {
        params: {
          startDate,
          endDate,
        },
      });

      const list = (data || []).map((x, i) => ({
        id: x.id || i + 1,
        date: x.date || todayISO,
        type: x.type || "SALE",
        code: x.code || "--",
        partner: x.partner || "",
        note: x.note || "",
        amount: Number(x.amount || 0),
      }));

      setTransactions(list);
    } catch (err) {
      console.warn("Finance transactions fetch failed", err);
      setTransactions([]);
      setError(
        t("finance.fetchError") ||
          "Không thể tải dữ liệu giao dịch tài chính."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===== REFRESH KHI DATE HOẶC TAB KẾ TOÁN ACTIVE =====
  useEffect(() => {
    if (activeTab === "accounting") {
      fetchSummary();
      fetchTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, activeTab]);

  // ===== FILTER SEARCH (TAB KẾ TOÁN) =====
  const filtered = transactions.filter((x) => {
    const q = query.toLowerCase();
    return (
      x.code.toLowerCase().includes(q) ||
      x.partner.toLowerCase().includes(q) ||
      x.type.toLowerCase().includes(q) ||
      formatters.date.toDisplay(x.date).includes(q)
    );
  });

  const currentRows = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const rowsSelectValue = rowsPerPage > 100 ? "all" : rowsPerPage;

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(
      value === "all" ? Number.MAX_SAFE_INTEGER : Number(value)
    );
    setCurrentPage(1);
  };

  // ===== EXPORT CSV (TAB KẾ TOÁN) =====
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

    const csv = rows
      .map((r) =>
        r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `finance_${startDate}_${endDate}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const headerCellStyle = { whiteSpace: "nowrap" };

  return (
    <MainLayout>
      <div className="container-fluid py-3">
        {/* ===== PAGE TITLE ===== */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
          <div>
            <h4 className="fw-bold mb-1">
              {t("finance.title") || "Tài chính - Thuế & Kế toán"}
            </h4>
            <div className="text-muted small">
              Hộ kinh doanh nhóm 2 (Doanh thu từ 200 triệu đến dưới 3 tỷ)
            </div>
          </div>
        </div>

        {/* ===== TABS ===== */}
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button
              className={`nav-link ${
                activeTab === "tax-overview" ? "active" : ""
              }`}
              onClick={() => setActiveTab("tax-overview")}
            >
              Thuế hộ kinh doanh 2026
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${
                activeTab === "tax-calculator" ? "active" : ""
              }`}
              onClick={() => setActiveTab("tax-calculator")}
            >
              Tính thuế phải nộp
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${
                activeTab === "accounting" ? "active" : ""
              }`}
              onClick={() => setActiveTab("accounting")}
            >
              Thống kê & Sổ kế toán
            </button>
          </li>
        </ul>

        {/* =========================
            TAB 1: TỔNG QUAN THUẾ
        ========================== */}
        {activeTab === "tax-overview" && (
          <div className="row g-3">
            {/* Nhóm 2 - chính của bạn */}
            <div className="col-12 col-lg-8">
              <div className="card shadow-sm border-0 rounded-3 h-100">
                <div className="card-body">
                  <h5 className={`fw-bold text-${theme} mb-3`}>
                    Nhóm 2 – Doanh thu từ 200 triệu đến 3 tỷ
                  </h5>

                  <div className="mb-3">
                    <h6 className="fw-semibold">Thuế GTGT</h6>
                    <ul className="mb-2">
                      <li>
                        Áp dụng{" "}
                        <strong>phương pháp trực tiếp trên doanh thu</strong>.
                      </li>
                      <li>
                        Công thức:{" "}
                        <code>
                          Thuế GTGT phải nộp = Doanh thu × Tỷ lệ %
                        </code>{" "}
                        (tùy ngành nghề theo quy định).
                      </li>
                      <li>
                        Có thể{" "}
                        <strong>
                          tự nguyện đăng ký phương pháp khấu trừ
                        </strong>{" "}
                        nếu đủ điều kiện.
                      </li>
                    </ul>
                  </div>

                  <div className="mb-3">
                    <h6 className="fw-semibold">Thuế TNCN</h6>
                    <ul className="mb-2">
                      <li>
                        Tính theo <strong>tỷ lệ % trên doanh thu</strong> theo
                        từng ngành nghề.
                      </li>
                      <li>
                        Công thức:{" "}
                        <code>
                          Thuế TNCN phải nộp = Doanh thu × Tỷ lệ %
                        </code>
                        .
                      </li>
                    </ul>
                  </div>

                  <div className="mb-3">
                    <h6 className="fw-semibold">Kê khai & Hóa đơn</h6>
                    <ul className="mb-2">
                      <li>
                        <strong>Kê khai theo quý</strong> (4 lần/năm) và{" "}
                        <strong>quyết toán năm</strong>.
                      </li>
                      <li>
                        Nếu doanh thu &gt; 1 tỷ và có bán hàng trực tiếp cho
                        người tiêu dùng →{" "}
                        <strong>
                          bắt buộc hóa đơn điện tử khởi tạo từ máy tính tiền
                        </strong>
                        .
                      </li>
                    </ul>
                  </div>

                  <div className="mb-3">
                    <h6 className="fw-semibold">Tài khoản ngân hàng</h6>
                    <ul className="mb-2">
                      <li>
                        <strong>Bắt buộc mở tài khoản riêng</strong> phục vụ
                        kinh doanh.
                      </li>
                    </ul>
                  </div>

                  <div className="mb-3">
                    <h6 className="fw-semibold">
                      Kinh doanh qua sàn TMĐT / nền tảng
                    </h6>
                    <ul className="mb-2">
                      <li>
                        Nếu <strong>sàn có chức năng thanh toán</strong>:
                        <ul>
                          <li>
                            Sàn <strong>khấu trừ, kê khai và nộp thay</strong>{" "}
                            thuế GTGT, TNCN theo tỷ lệ % trên doanh thu.
                          </li>
                          <li>
                            Nếu doanh thu cuối năm &lt; 200 triệu: có thể{" "}
                            <strong>
                              được hoàn số thuế đã nộp thừa theo quy định
                            </strong>
                            .
                          </li>
                        </ul>
                      </li>
                      <li>
                        Nếu <strong>sàn không có chức năng thanh toán</strong>:
                        <ul>
                          <li>
                            Cá nhân/hộ kinh doanh{" "}
                            <strong>tự kê khai, nộp thuế</strong> theo từng lần
                            phát sinh, tháng hoặc quý.
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  <div className="alert alert-info mb-0">
                    Lưu ý: Các thông tin trên chỉ mang tính chất{" "}
                    <strong>tham khảo & mô phỏng giao diện</strong>. Khi áp
                    dụng thực tế cần đối chiếu văn bản pháp luật hiện hành và
                    trao đổi với cơ quan thuế/kế toán.
                  </div>
                </div>
              </div>
            </div>

            {/* Nhóm 1 & 3 - Coming soon */}
            <div className="col-12 col-lg-4">
              <div className="card shadow-sm border-0 rounded-3 mb-3">
                <div className="card-body">
                  <h6 className="fw-bold mb-1">
                    Nhóm 1 – Doanh thu ≤ 200 triệu
                  </h6>
                  <div className="text-muted small mb-2">
                    Miễn thuế GTGT & TNCN (theo ngưỡng doanh thu 200 triệu/năm).
                  </div>
                  <span className="badge bg-secondary">Coming soon</span>
                </div>
              </div>

              <div className="card shadow-sm border-0 rounded-3">
                <div className="card-body">
                  <h6 className="fw-bold mb-1">
                    Nhóm 3 – Doanh thu &gt; 3 tỷ
                  </h6>
                  <div className="text-muted small mb-2">
                    Áp dụng như doanh nghiệp: khấu trừ thuế GTGT, kê khai đầy
                    đủ, chế độ kế toán DN.
                  </div>
                  <span className="badge bg-secondary">Coming soon</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================
            TAB 2: TÍNH THUẾ PHẢI NỘP
        ========================== */}
        {activeTab === "tax-calculator" && (
          <div className="row g-3">
            <div className="col-12 col-lg-7">
              <div className="card shadow-sm border-0 rounded-3">
                <div className="card-body">
                  <h5 className={`fw-bold text-${theme} mb-3`}>
                    Máy tính thuế – Nhóm 2 (200 triệu &lt; Doanh thu ≤ 3 tỷ)
                  </h5>

                  <div className="row g-3">
                    {/* Kỳ tính thuế */}
                    <div className="col-12 col-md-4">
                      <label className="form-label">
                        Kỳ tính thuế (tham khảo)
                      </label>
                      <select
                        className="form-select"
                        value={taxPeriod}
                        onChange={(e) => setTaxPeriod(e.target.value)}
                      >
                        <option value="MONTH">Theo tháng</option>
                        <option value="QUARTER">Theo quý</option>
                        <option value="YEAR">Theo năm</option>
                      </select>
                    </div>

                    {/* Doanh thu */}
                    <div className="col-12 col-md-8">
                      <label className="form-label">
                        Doanh thu kỳ tính thuế (VNĐ)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={taxRevenue}
                        min={0}
                        onChange={(e) => setTaxRevenue(e.target.value)}
                        placeholder="Nhập tổng doanh thu chịu thuế"
                      />
                    </div>

                    {/* Thuế suất GTGT */}
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        Tỷ lệ GTGT tính trên doanh thu (%)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={taxVatRate}
                        min={0}
                        step="0.1"
                        onChange={(e) => setTaxVatRate(e.target.value)}
                        placeholder="Ví dụ: 1; 2; 3..."
                      />
                      <div className="form-text">
                        Nhập theo ngành nghề thực tế theo quy định.
                      </div>
                    </div>

                    {/* Thuế suất TNCN */}
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        Tỷ lệ TNCN tính trên doanh thu (%)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={taxPitRate}
                        min={0}
                        step="0.1"
                        onChange={(e) => setTaxPitRate(e.target.value)}
                        placeholder="Ví dụ: 0.5; 1.5..."
                      />
                      <div className="form-text">
                        Nhập theo biểu thuế hiện hành của ngành.
                      </div>
                    </div>
                  </div>

                  <hr />

                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <div className="border rounded-3 p-3 bg-light">
                        <div className="text-muted small mb-1">
                          Thuế GTGT ước tính
                        </div>
                        <div className="fw-bold fs-5">
                          {formatCurrency(vatAmount)}
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="border rounded-3 p-3 bg-light">
                        <div className="text-muted small mb-1">
                          Thuế TNCN ước tính
                        </div>
                        <div className="fw-bold fs-5">
                          {formatCurrency(pitAmount)}
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="border rounded-3 p-3 bg-light">
                        <div className="text-muted small mb-1">
                          Tổng thuế phải nộp
                        </div>
                        <div className="fw-bold fs-5 text-danger">
                          {formatCurrency(totalTax)}
                        </div>
                        <div className="text-muted small mt-1">
                          Thuế suất hiệu dụng:{" "}
                          <strong>{effectiveRate.toFixed(2)}%</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-warning mt-3 mb-0">
                    Đây là công cụ tính toán <strong>mang tính nội bộ</strong>{" "}
                    cho hộ kinh doanh, không thay thế tư vấn thuế chính thức.
                    Bạn cần đối chiếu lại số liệu với kế toán hoặc cơ quan thuế
                    khi thực hiện kê khai.
                  </div>
                </div>
              </div>
            </div>

            {/* Coming soon cho Nhóm 1 & 3 nếu sau này tách riêng công thức */}
            <div className="col-12 col-lg-5">
              <div className="card shadow-sm border-0 rounded-3 mb-3">
                <div className="card-body">
                  <h6 className="fw-bold mb-1">
                    Máy tính thuế – Nhóm 1 (≤ 200 triệu)
                  </h6>
                  <p className="text-muted small mb-2">
                    Hộ kinh doanh doanh thu không vượt 200 triệu/năm thường
                    được miễn thuế GTGT & TNCN.
                  </p>
                  <span className="badge bg-secondary">Coming soon</span>
                </div>
              </div>

              <div className="card shadow-sm border-0 rounded-3">
                <div className="card-body">
                  <h6 className="fw-bold mb-1">
                    Máy tính thuế – Nhóm 3 (&gt; 3 tỷ)
                  </h6>
                  <p className="text-muted small mb-2">
                    Áp dụng cơ chế tính thuế như doanh nghiệp: khấu trừ GTGT,
                    thuế TNDN/TNCN theo thu nhập tính thuế.
                  </p>
                  <span className="badge bg-secondary">Coming soon</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================
            TAB 3: THỐNG KÊ & SỔ KẾ TOÁN
        ========================== */}
        {activeTab === "accounting" && (
          <>
            {/* Header bộ lọc ngày + quick range + export */}
            <div className="row align-items-center gy-2 mb-3">
              <div className="col-12 col-md-5">
                <div className="row g-2">
                  <div className="col">
                    <label className="form-label small mb-1">
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setStartDisplay(
                          formatters.date.toDisplay(e.target.value)
                        );
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                  <div className="col">
                    <label className="form-label small mb-1">
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setEndDisplay(
                          formatters.date.toDisplay(e.target.value)
                        );
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4 d-flex flex-wrap gap-1">
                <div className="btn-group">
                  <button
                    className={`btn btn-outline-${theme} btn-sm`}
                    onClick={() => quickRange(7)}
                  >
                    7 ngày
                  </button>
                  <button
                    className={`btn btn-outline-${theme} btn-sm`}
                    onClick={() => quickRange(30)}
                  >
                    30 ngày
                  </button>
                  <button
                    className={`btn btn-outline-${theme} btn-sm`}
                    onClick={() => quickRange(90)}
                  >
                    90 ngày
                  </button>
                </div>
              </div>

              <div className="col-12 col-md-3 d-flex justify-content-end">
                <button
                  className={`btn btn-${theme} text-white btn-sm`}
                  onClick={exportCSV}
                >
                  <i className="bi bi-download me-1" /> Xuất CSV
                </button>
              </div>
            </div>

            {/* Summary cards */}
            <div className="row g-3 mb-3">
              {[
                {
                  label: "Doanh thu",
                  value: formatCurrency(summary.revenue),
                  icon: "bi-graph-up",
                  className: "text-success",
                },
                {
                  label: "Chi phí",
                  value: formatCurrency(summary.cost),
                  icon: "bi-cash-stack",
                  className: "text-danger",
                },
                {
                  label: "Lợi nhuận",
                  value: formatCurrency(summary.profit),
                  icon: "bi-wallet2",
                  className: "text-primary",
                },
                {
                  label: "Số hóa đơn",
                  value: summary.invoicesCount,
                  icon: "bi-receipt",
                  className: "text-secondary",
                },
              ].map((c, i) => (
                <div key={i} className="col-12 col-md-3">
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-body d-flex align-items-center justify-content-between">
                      <div>
                        <div className="text-muted small">{c.label}</div>
                        <div className={`fw-bold fs-5 ${c.className}`}>
                          {c.value}
                        </div>
                      </div>
                      <i
                        className={`bi ${c.icon} fs-3 ${c.className}`}
                      ></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Search + error */}
            <div className="row align-items-center gy-2 mb-2">
              <div className="col-12 col-md-6">
                <div className="input-group">
                  <span
                    className={`input-group-text bg-white border-${theme}`}
                  >
                    <i className="bi bi-search" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tìm theo mã chứng từ / đối tác / ngày…"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
              <div className="col-12 col-md-6 text-end">
                {error && (
                  <span className="text-danger small">{error}</span>
                )}
              </div>
            </div>

            {/* Transactions table */}
            <div
              className="table-responsive rounded-3 shadow-sm"
              style={{
                borderRadius: 16,
                overflow: "hidden",
                paddingRight: 8,
                paddingBottom: 8,
                backgroundColor: "#fff",
              }}
            >
              <div
                style={{
                  maxHeight: "60vh",
                  overflowX: "auto",
                  overflowY: "auto",
                  borderRadius: 12,
                }}
              >
                <table className="table table-hover align-middle mb-0">
                  <thead
                    className={`table-${theme}`}
                    style={{ position: "sticky", top: 0, zIndex: 2 }}
                  >
                    <tr>
                      <th>#</th>
                      <th>{t("finance.date") || "Ngày"}</th>
                      <th>{t("finance.type") || "Loại"}</th>
                      <th>{t("finance.code") || "Mã chứng từ"}</th>
                      <th>{t("finance.partner") || "Đối tác"}</th>
                      <th className="text-end">
                        {t("finance.amount") || "Số tiền"}
                      </th>
                      <th>{t("finance.note") || "Ghi chú"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          <div
                            className="spinner-border text-primary"
                            role="status"
                          />
                        </td>
                      </tr>
                    ) : currentRows.length > 0 ? (
                      currentRows.map((x, idx) => (
                        <tr key={x.id}>
                          <td>
                            {(currentPage - 1) * rowsPerPage + idx + 1}
                          </td>
                          <td>{formatters.date.toDisplay(x.date)}</td>
                          <td>
                            <span
                              className={`badge ${
                                x.type === "SALE"
                                  ? "bg-success"
                                  : x.type === "PURCHASE"
                                  ? "bg-warning text-dark"
                                  : "bg-secondary"
                              }`}
                            >
                              {x.type}
                            </span>
                          </td>
                          <td>{x.code}</td>
                          <td>{x.partner}</td>
                          <td className="text-end fw-semibold">
                            {formatCurrency(x.amount)}
                          </td>
                          <td>{x.note}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center text-muted py-4"
                        >
                          {t("finance.noData") || "Không có dữ liệu"}
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
          </>
        )}
      </div>
    </MainLayout>
  );
}
