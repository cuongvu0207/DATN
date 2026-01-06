// src/pages/DemandForecastPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import MainLayout from "../layouts/MainLayout";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import TablePagination from "../components/common/TablePagination";

const AI_API_BASE_URL =
    import.meta.env.VITE_AI_API_BASE_URL || "http://localhost:5001";

// ✅ Helper: format ngày về đúng dd/mm/yyyy, có validate
const formatOutOfStockDateSafe = (raw) => {
    if (!raw) return null;

    const str = String(raw).trim();

    // Trường hợp 1: backend trả kiểu dd/mm/yyyy
    // Ví dụ: "31/12/2025"
    const viPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const viMatch = str.match(viPattern);
    if (viMatch) {
        const day = viMatch[1];
        const month = viMatch[2];
        const year = viMatch[3];
        return `${day}/${month}/${year}`; // đã đúng dd/mm/yyyy
    }

    // Trường hợp 2: backend trả ISO: 2025-12-31 hoặc 2025-12-31T00:00:00Z
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) {
        // Không parse được -> không hiển thị
        return null;
    }

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}/${month}/${year}`; // dd/mm/yyyy
};

export default function DemandForecastPage() {
    const { t } = useTranslation();
    const { theme } = useTheme();

    const [days, setDays] = useState(90);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [data, setData] = useState([]);

    const [query, setQuery] = useState("");
    const [stockLevel, setStockLevel] = useState("all"); // all | out | below | ok
    const [warnLevel, setWarnLevel] = useState("all"); // all | critical | warning | safe
    const [hasHistory, setHasHistory] = useState("all"); // all | yes | no

    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [currentPage, setCurrentPage] = useState(1);

    /* ==========================
          CALL AI API
    =========================== */
    const fetchForecast = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(
                `${AI_API_BASE_URL}/api/forecast/out_of_stock/all`,
                { params: { days } }
            );

            const list = (res.data?.data || []).map((item, idx) => {
                const stock = Number(item.stock ?? 0);
                const min = Number(item.minimumStock ?? 0);
                const d2o = item.daysToOutOfStock;

                // validate tồn kho / tối thiểu
                let stockStatus = "ok";
                if (stock <= 0) stockStatus = "out";
                else if (stock <= min) stockStatus = "below";

                let warn = "safe";
                if (d2o === 0 || stock <= 0) warn = "critical";
                else if (d2o && d2o <= 7) warn = "critical";
                else if (d2o && d2o <= 30) warn = "warning";

                // ✅ Dùng helper: luôn trả về dd/mm/yyyy hoặc null
                const outDateFormatted = formatOutOfStockDateSafe(
                    item.outOfStockDate
                );

                return {
                    id: item.barcode || String(idx),
                    barcode: item.barcode || "",
                    name: item.productName || "",
                    stock,
                    minimumStock: min,
                    daysToOutOfStock: d2o,
                    outOfStockDate: outDateFormatted, // dd/mm/yyyy hoặc null
                    message: item.message || "",
                    success: !!item.success,
                    stockStatus,
                    warn,
                    hasHistoryFlag: item.success && d2o !== null && d2o !== undefined,
                };
            });

            // Ưu tiên sản phẩm sắp hết lên đầu
            list.sort((a, b) => {
                const da = a.daysToOutOfStock ?? 99999;
                const db = b.daysToOutOfStock ?? 99999;
                return da - db;
            });

            setData(list);
            setCurrentPage(1);
        } catch (err) {
            console.error("Forecast error:", err);
            setError(
                t(
                    "forecast.fetchError",
                    "Không thể tải dữ liệu dự báo. Vui lòng thử lại."
                )
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForecast();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ==========================
          FILTER + PAGINATION
    =========================== */
    const filtered = useMemo(() => {
        const q = (query || "").toLowerCase();

        return data.filter((p) => {
            const matchQuery =
                !q ||
                p.name.toLowerCase().includes(q) ||
                p.barcode.toLowerCase().includes(q);

            const matchStock =
                stockLevel === "all"
                    ? true
                    : stockLevel === "out"
                        ? p.stockStatus === "out"
                        : stockLevel === "below"
                            ? p.stockStatus === "below"
                            : p.stockStatus === "ok";

            const matchWarn =
                warnLevel === "all"
                    ? true
                    : warnLevel === "critical"
                        ? p.warn === "critical"
                        : warnLevel === "warning"
                            ? p.warn === "warning"
                            : p.warn === "safe";

            const matchHistory =
                hasHistory === "all"
                    ? true
                    : hasHistory === "yes"
                        ? p.hasHistoryFlag
                        : !p.hasHistoryFlag;

            return matchQuery && matchStock && matchWarn && matchHistory;
        });
    }, [data, query, stockLevel, warnLevel, hasHistory]);

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentRows = filtered.slice(startIndex, startIndex + rowsPerPage);
    const rowsSelectValue = rowsPerPage >= totalItems ? "all" : rowsPerPage;

    const handleRowsPerPageChange = (value) => {
        if (value === "all") {
            setRowsPerPage(totalItems || 1);
        } else {
            setRowsPerPage(Number(value));
        }
        setCurrentPage(1);
    };

    const handleRefresh = () => {
        fetchForecast();
    };

    const badgeClass = (row) => {
        // Hết hàng -> đỏ
        if (row.stockStatus === "out") return "badge bg-danger";

        // SẮP HẾT (critical) -> vàng/cam
        if (row.warn === "critical") return "badge bg-warning text-dark";

        // Dưới tối thiểu nhưng chưa tới mức critical -> xanh dương nhạt
        if (row.stockStatus === "below") return "badge bg-info text-dark";

        // Cảnh báo (≤ 30 ngày) -> xám nhạt
        if (row.warn === "warning") return "badge bg-secondary text-light";

        // An toàn -> xanh lá
        return "badge bg-success";
    };

    /* ==========================
              RENDER
    =========================== */
    return (
        <MainLayout>
            <div className="container-fluid py-3">
                {/* HEADER BAR kiểu ProductHeaderBar */}
                <div className="row align-items-center gy-2 mb-1">
                    <div className="col-12 col-md-3 col-lg-2">
                        <h4 className="fw-bold mb-0 text-nowrap">
                            {t("forecast.title", "Dự báo nhu cầu hàng hóa")}
                        </h4>
                    </div>

                    <div className="col-12 col-md-5 col-lg-5">
                        <div className="position-relative">
                            <i
                                className={`bi bi-search position-absolute top-50 start-0 translate-middle-y ps-3 text-${theme}`}
                            />
                            <input
                                type="text"
                                className="form-control ps-5"
                                style={{
                                    height: 40,
                                    paddingLeft: 45,
                                    border: "1px solid #ced4da",
                                    boxShadow: "none",
                                    outline: "none",
                                }}
                                placeholder={
                                    t("forecast.searchPlaceholder") ||
                                    "Tìm theo tên hoặc mã vạch…"
                                }
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="col-12 col-md-4 col-lg-5 d-flex justify-content-end gap-2 flex-wrap">
                        <div className="input-group" style={{ maxWidth: 180 }}>
                            <span className="input-group-text">
                                {t("forecast.daysLabel", "Số ngày")}
                            </span>
                            <input
                                type="number"
                                className="form-control"
                                min={7}
                                max={365}
                                value={days}
                                onChange={(e) => setDays(Number(e.target.value) || 0)}
                            />
                        </div>

                        <button
                            className={`btn btn-outline-${theme} fw-semibold d-flex align-items-center rounded-3 px-3`}
                            onClick={handleRefresh}
                            disabled={loading}
                        >
                            <i className="bi bi-arrow-clockwise" />
                            <span className="ms-1 d-none d-sm-inline">
                                {loading
                                    ? t("forecast.loading", "Đang tải...")
                                    : t("forecast.refresh", "Làm mới")}
                            </span>
                        </button>
                    </div>
                </div>

                {/* LAYOUT giống ProductList: trái filter – phải bảng */}
                <div className="row g-3 mt-0">
                    {/* FILTER PANEL */}
                    <div className="col-lg-2 col-12">
                        <div className="card shadow-sm rounded-3 h-100 border-0">
                            <div className="card-body">
                                <h6 className="mb-3">
                                    {t("forecast.filterTitle", "Bộ lọc")}
                                </h6>

                                {/* Tồn kho */}
                                <div className="mb-3">
                                    <label className="form-label">
                                        {t("forecast.stockLevel", "Tồn kho")}
                                    </label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={stockLevel}
                                        onChange={(e) => {
                                            setStockLevel(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <option value="all">
                                            {t("forecast.stock.all", "Tất cả")}
                                        </option>
                                        <option value="out">
                                            {t("forecast.stock.out", "Đã hết hàng")}
                                        </option>
                                        <option value="below">
                                            {t("forecast.stock.below", "Dưới mức tối thiểu")}
                                        </option>
                                        <option value="ok">
                                            {t("forecast.stock.ok", "Còn hàng")}
                                        </option>
                                    </select>
                                </div>

                                {/* Mức cảnh báo */}
                                <div className="mb-3">
                                    <label className="form-label">
                                        {t("forecast.warnLevel", "Mức cảnh báo")}
                                    </label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={warnLevel}
                                        onChange={(e) => {
                                            setWarnLevel(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <option value="all">
                                            {t("forecast.warn.all", "Tất cả")}
                                        </option>
                                        <option value="critical">
                                            {t(
                                                "forecast.warn.critical",
                                                "Nguy hiểm (≤ 7 ngày)"
                                            )}
                                        </option>
                                        <option value="warning">
                                            {t(
                                                "forecast.warn.warning",
                                                "Cảnh báo (≤ 30 ngày)"
                                            )}
                                        </option>
                                        <option value="safe">
                                            {t("forecast.warn.safe", "An toàn")}
                                        </option>
                                    </select>
                                </div>

                                {/* Lịch sử bán */}
                                <div className="mb-1">
                                    <label className="form-label">
                                        {t("forecast.history", "Lịch sử bán")}
                                    </label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={hasHistory}
                                        onChange={(e) => {
                                            setHasHistory(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <option value="all">
                                            {t("forecast.history.all", "Tất cả")}
                                        </option>
                                        <option value="yes">
                                            {t(
                                                "forecast.history.yes",
                                                "Có dữ liệu dự báo"
                                            )}
                                        </option>
                                        <option value="no">
                                            {t(
                                                "forecast.history.no",
                                                "Không đủ dữ liệu"
                                            )}
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="col-lg-10 col-12">
                        {/*  table-responsive lo luôn thanh trượt ngang nếu tràn */}
                        <div
                            className="table-responsive rounded-3 shadow-sm"
                            style={{ maxHeight: "60vh", overflowY: "auto" }} // Y dọc, X do table-responsive xử lý
                        >
                            <table className="table table-hover align-middle mb-0">
                                <thead
                                    className={`table-${theme}`}
                                    style={{
                                        position: "sticky",
                                        top: 0,
                                        zIndex: 10,
                                        backgroundColor: "var(--bs-body-bg)",
                                    }}
                                >
                                    <tr>
                                        <th className="text-nowrap">#</th>
                                        <th className="text-nowrap">{t("forecast.product", "Sản phẩm")}</th>
                                        <th className="text-nowrap">{t("forecast.barcode", "Mã vạch")}</th>
                                        <th className="text-end text-nowrap">{t("forecast.stockOnly", "Tồn kho")}</th>
                                        <th className="text-end text-nowrap">{t("forecast.minStockOnly", "Tồn tối thiểu")}</th>
                                        <th className="text-center text-nowrap">{t("forecast.daysToOut", "Số ngày còn lại")}</th>
                                        <th className="text-nowrap">{t("forecast.outDate", "Ngày dự kiến hết hàng")}</th>
                                        <th className="text-nowrap">{t("forecast.status", "Trạng thái")}</th>
                                        <th className="text-nowrap">{t("forecast.note", "Ghi chú")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {error && !loading && (
                                        <tr>
                                            <td colSpan={9} className="text-center py-3">
                                                <div className="alert alert-danger mb-0">
                                                    {error}
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                    {loading && (
                                        <tr>
                                            <td colSpan={9} className="text-center py-4">
                                                {t(
                                                    "forecast.loading",
                                                    "Đang tải dữ liệu..."
                                                )}
                                            </td>
                                        </tr>
                                    )}

                                    {!loading && !error && currentRows.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="text-center py-4">
                                                {t(
                                                    "forecast.empty",
                                                    "Không có dữ liệu phù hợp."
                                                )}
                                            </td>
                                        </tr>
                                    )}

                                    {!loading &&
                                        !error &&
                                        currentRows.map((row, idx) => (
                                            <tr key={row.id}>
                                                <td>{startIndex + idx + 1}</td>
                                                <td className="text-wrap" style={{ maxWidth: 220 }}>
                                                    {row.name || "—"}
                                                </td>
                                                <td>{row.barcode || "—"}</td>
                                                <td className="text-end">{row.stock}</td>
                                                <td className="text-end">
                                                    {row.minimumStock}
                                                </td>
                                                <td className="text-center">
                                                    {row.daysToOutOfStock != null
                                                        ? row.daysToOutOfStock
                                                        : "—"}
                                                </td>
                                                {/* outOfStockDate đã là dd/mm/yyyy hoặc null */}
                                                <td>{row.outOfStockDate || "—"}</td>
                                                <td>
                                                    <span className={badgeClass(row)}>
                                                        {row.stockStatus === "out"
                                                            ? t(
                                                                "forecast.badge.out",
                                                                "Đã hết hàng"
                                                            )
                                                            : row.stockStatus === "below"
                                                                ? t(
                                                                    "forecast.badge.below",
                                                                    "Dưới tối thiểu"
                                                                )
                                                                : row.warn === "critical"
                                                                    ? t(
                                                                        "forecast.badge.critical",
                                                                        "Sắp hết"
                                                                    )
                                                                    : row.warn === "warning"
                                                                        ? t(
                                                                            "forecast.badge.warning",
                                                                            "Cảnh báo"
                                                                        )
                                                                        : t(
                                                                            "forecast.badge.safe",
                                                                            "An toàn"
                                                                        )}
                                                    </span>
                                                </td>
                                                <td style={{ maxWidth: 260 }}>
                                                    <small className="text-muted">
                                                        {row.message || ""}
                                                    </small>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION giống Hàng hoá */}
                        <TablePagination
                            currentPage={currentPage}
                            totalItems={totalItems}
                            rowsPerPage={rowsPerPage}
                            rowsPerPageOptions={[15, 20, 30, 50, 100]}
                            rowsPerPageValue={rowsSelectValue}
                            onPageChange={setCurrentPage}
                            onRowsPerPageChange={handleRowsPerPageChange}
                        />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
