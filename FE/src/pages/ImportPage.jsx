import React, { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";

export default function ImportListPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // --- Dữ liệu giả lập ---
  const importList = Array.from({ length: 25 }, (_, i) => ({
    code: `PN${(46 - i).toString().padStart(6, "0")}`,
    supplierCode: `NCC${(i % 5 + 1).toString().padStart(4, "0")}`,
    supplier:
      i % 3 === 0
        ? "Công ty Pharmedic"
        : i % 3 === 1
        ? "Công ty TNHH Citigo"
        : "Đại lý Hồng Phúc",
    importer: i % 2 === 0 ? "Nguyễn Văn A" : "Trần Thị B",
    total: 8000000 + i * 100000,
    status: i % 2 === 0 ? "Đã nhập hàng" : "Phiếu tạm",
    createdAt: i % 2 === 0 ? "2025-10-22" : "2025-10-21",
    note:
      i % 2 === 0
        ? "Phiếu nhập hàng đã hoàn tất và được lưu kho."
        : "Phiếu đang chờ xác nhận từ nhà cung cấp.",
  }));

  // --- State ---
  const [query, setQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    supplier: "",
    importer: "",
    createdAt: "",
  });
  const [selectedImports, setSelectedImports] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null); // ✅ thay selectedImport

  // --- Bộ lọc ---
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  // --- Lọc dữ liệu ---
  const filtered = importList.filter((p) => {
    const matchQuery =
      p.code.toLowerCase().includes(query.toLowerCase()) ||
      p.supplier.toLowerCase().includes(query.toLowerCase());
    const matchSupplier = !filters.supplier || p.supplier === filters.supplier;
    const matchImporter = !filters.importer || p.importer === filters.importer;
    const matchDate =
      !filters.createdAt ||
      new Date(p.createdAt).toLocaleDateString("vi-VN") ===
        new Date(filters.createdAt).toLocaleDateString("vi-VN");

    return matchQuery && matchSupplier && matchImporter && matchDate;
  });

  // --- Phân trang ---
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentRows = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // --- Chọn nhiều phiếu ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allCodes = currentRows.map((p) => p.code);
      setSelectedImports((prev) => Array.from(new Set([...prev, ...allCodes])));
    } else {
      setSelectedImports((prev) =>
        prev.filter((id) => !currentRows.some((p) => p.code === id))
      );
    }
  };

  const handleSelectOne = (id) => {
    setSelectedImports((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allChecked = currentRows.every((p) => selectedImports.includes(p.code));

  const toggleRow = (code) => {
    setExpandedRow((prev) => (prev === code ? null : code));
  };

  // --- Giao diện ---
  return (
    <MainLayout>
      <div className="container-fluid py-3 position-relative">
        {/* ================= HEADER ================= */}
        <div className="row align-items-center gy-2 mb-2">
          <div className="col-12 col-md-3 col-lg-2 d-flex align-items-center">
            <h4 className="fw-bold text-capitalize mb-0">
              {t("import.title") || "Nhập hàng"}
            </h4>
          </div>

          {/* Thanh tìm kiếm */}
          <div className="col-12 col-md-5 col-lg-5">
            <div
              className={`input-group border border-${theme} rounded-3 align-items-center`}
              style={{ height: "40px" }}
            >
              <span
                className={`input-group-text bg-white border-0 text-${theme}`}
                style={{
                  borderRight: `1px solid var(--bs-${theme})`,
                  height: "100%",
                }}
              >
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="form-control border-0 shadow-none"
                placeholder={
                  t("import.searchPlaceholder") || "Theo mã, nhà cung cấp..."
                }
              />
            </div>
          </div>

          {/* Nhóm nút chức năng */}
          <div className="col-12 col-md-4 col-lg-5 d-flex justify-content-end gap-2 flex-wrap">
            <button
              className={`btn btn-${theme} text-white fw-semibold d-flex align-items-center rounded-3 px-3`}
              onClick={() => navigate("/products/importdetail")}
            >
              <i className="bi bi-plus-lg"></i>
              <span className="ms-1 d-none d-sm-inline">
                {t("import.addNew") || "Thêm phiếu nhập"}
              </span>
            </button>

            <button
              className={`btn btn-outline-${theme} d-flex align-items-center fw-semibold rounded-3 px-3`}
              onClick={() => alert("Xuất file danh sách nhập hàng")}
            >
              <i className="bi bi-download"></i>
              <span className="ms-1 d-none d-md-inline">
                {t("import.exportFile") || "Xuất file"}
              </span>
            </button>
          </div>
        </div>

        {/* ================= BODY ================= */}
        <div className="row g-3 mt-1">
          {/* ==== Sidebar bộ lọc ==== */}
          <aside className="col-lg-2 d-none d-lg-block">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <h6 className="fw-bold mb-4">
                  {t("import.filterTitle") || "Bộ lọc"}
                </h6>

                {/* Nhà cung cấp */}
                <div className="mb-4">
                  <label className="form-label mb-1">
                    {t("import.supplier") || "Nhà cung cấp"}
                  </label>
                  <select
                    className="form-select form-select-sm shadow-sm"
                    value={filters.supplier}
                    onChange={(e) =>
                      handleFilterChange("supplier", e.target.value)
                    }
                  >
                    <option value="">
                      {t("import.selectSupplier") || "Chọn nhà cung cấp"}
                    </option>
                    <option value="Công ty Pharmedic">Công ty Pharmedic</option>
                    <option value="Công ty TNHH Citigo">
                      Công ty TNHH Citigo
                    </option>
                    <option value="Đại lý Hồng Phúc">Đại lý Hồng Phúc</option>
                  </select>
                </div>

                {/* Người nhập */}
                <div className="mb-4">
                  <label className="form-label mb-1">
                    {t("import.importer") || "Người nhập"}
                  </label>
                  <select
                    className="form-select form-select-sm shadow-sm"
                    value={filters.importer}
                    onChange={(e) =>
                      handleFilterChange("importer", e.target.value)
                    }
                  >
                    <option value="">
                      {t("import.selectImporter") || "Chọn người nhập"}
                    </option>
                    <option value="Nguyễn Văn A">Nguyễn Văn A</option>
                    <option value="Trần Thị B">Trần Thị B</option>
                  </select>
                </div>

                {/* Thời gian */}
                <div className="mb-4">
                  <label className="form-label fw-medium mb-1">
                    {t("import.date") || "Thời gian"}
                  </label>
                  <input
                    type="date"
                    className={`form-control form-control-sm border-${theme} shadow-sm`}
                    value={filters.createdAt}
                    onChange={(e) =>
                      handleFilterChange("createdAt", e.target.value)
                    }
                  />
                  <div className="form-text">
                    {t("import.dateFormat") || "Định dạng: dd/mm/yyyy"}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ==== Main Content ==== */}
          <main className="col-lg-10 col-12">
            <div
              className={`table-responsive rounded-2 border border-${theme} shadow-sm`}
            >
              <table className="table table-hover align-middle mb-0">
                <thead className={`table-${theme}`}>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>{t("import.code") || "Mã nhập hàng"}</th>
                    <th>{t("import.supplierCode") || "Mã NCC"}</th>
                    <th>{t("import.supplier") || "Nhà cung cấp"}</th>
                    <th>{t("import.importer") || "Người nhập"}</th>
                    <th className="text-end">{t("import.total") || "Tổng tiền"}</th>
                    <th className="text-center">
                      {t("import.status") || "Trạng thái"}
                    </th>
                    <th>{t("import.date") || "Ngày tạo"}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.length > 0 ? (
                    currentRows.map((row) => (
                      <React.Fragment key={row.code}>
                        <tr
                          style={{ cursor: "pointer" }}
                          onClick={() => toggleRow(row.code)}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedImports.includes(row.code)}
                              onChange={() => handleSelectOne(row.code)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td>
                            <i
                              className={`bi me-2 ${
                                expandedRow === row.code
                                  ? "bi-caret-down-fill"
                                  : "bi-caret-right-fill"
                              }`}
                            ></i>
                            {row.code}
                          </td>
                          <td>{row.supplierCode}</td>
                          <td>{row.supplier}</td>
                          <td>{row.importer}</td>
                          <td className="text-end">
                            {row.total.toLocaleString()} ₫
                          </td>
                          <td className="text-center">
                            <span
                              className={`badge px-2 py-1 ${
                                row.status === "Đã nhập hàng"
                                  ? "bg-success-subtle text-success border border-success"
                                  : "bg-warning-subtle text-warning border border-warning"
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td>
                            {new Date(row.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                        </tr>

                        {/* Hàng chi tiết xổ xuống */}
                        {expandedRow === row.code && (
                          <tr className="bg-light">
                            <td colSpan={8}>
                              <div className="p-3 border-top bg-white">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <h6 className="fw-bold mb-0">
                                    <i className="bi bi-receipt-cutoff me-2 text-primary"></i>
                                    {t("import.detailCardTitle") ||
                                      "Chi tiết phiếu nhập"}
                                  </h6>
                                  <button
                                    className={`btn btn-outline-${theme} btn-sm`}
                                    onClick={() =>
                                      navigate("/products/importdetail", {
                                        state: { importData: row },
                                      })
                                    }
                                  >
                                    <i className="bi bi-pencil-square me-1"></i>
                                    {t("import.edit") || "Chỉnh sửa"}
                                  </button>
                                </div>

                                <div className="row g-3">
                                  <div className="col-md-6">
                                    <label className="fw-semibold text-muted">
                                      {t("import.supplier") || "Nhà cung cấp"}
                                    </label>
                                    <div>{row.supplier}</div>
                                  </div>
                                  <div className="col-md-6">
                                    <label className="fw-semibold text-muted">
                                      {t("import.supplierCode") || "Mã NCC"}
                                    </label>
                                    <div>{row.supplierCode}</div>
                                  </div>
                                  <div className="col-md-6">
                                    <label className="fw-semibold text-muted">
                                      {t("import.importer") || "Người nhập"}
                                    </label>
                                    <div>{row.importer}</div>
                                  </div>
                                  <div className="col-md-6">
                                    <label className="fw-semibold text-muted">
                                      {t("import.status") || "Trạng thái"}
                                    </label>
                                    <div>
                                      <span
                                        className={`badge px-3 py-1 ${
                                          row.status === "Đã nhập hàng"
                                            ? "bg-success-subtle text-success border border-success"
                                            : "bg-warning-subtle text-warning border border-warning"
                                        }`}
                                      >
                                        {row.status}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="col-md-6">
                                    <label className="fw-semibold text-muted">
                                      {t("import.total") || "Tổng tiền"}
                                    </label>
                                    <div className="fw-semibold text-success">
                                      {row.total.toLocaleString()} ₫
                                    </div>
                                  </div>
                                  <div className="col-md-6">
                                    <label className="fw-semibold text-muted">
                                      {t("import.date") || "Ngày tạo"}
                                    </label>
                                    <div>
                                      {new Date(
                                        row.createdAt
                                      ).toLocaleDateString("vi-VN")}
                                    </div>
                                  </div>
                                  <div className="col-12">
                                    <label className="fw-semibold text-muted">
                                      {t("import.note") || "Ghi chú"}
                                    </label>
                                    <textarea
                                      className="form-control"
                                      rows={2}
                                      value={row.note}
                                      disabled
                                    ></textarea>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-4">
                        {t("import.noData") || "Không có dữ liệu"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ==== PHÂN TRANG ==== */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="d-flex align-items-center gap-2">
                <span>{t("import.display") || "Hiển thị"}</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: 130 }}
                  value={rowsPerPage >= filtered.length ? "all" : rowsPerPage}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "all") {
                      setRowsPerPage(filtered.length);
                    } else {
                      setRowsPerPage(Number(val));
                    }
                    setCurrentPage(1);
                  }}
                >
                  {[15, 20, 30, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n} {t("import.rows") || "hàng"}
                    </option>
                  ))}
                  <option value="all">{t("import.all") || "Tất cả"}</option>
                </select>
              </div>

              <div className="btn-group">
                <button
                  className={`btn btn-outline-${theme}`}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  &lt;
                </button>
                <span className={`btn btn-${theme} text-white fw-bold`}>
                  {currentPage}
                </span>
                <button
                  className={`btn btn-outline-${theme}`}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  &gt;
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </MainLayout>
  );
}
