import React, { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import ImportFilterPanel from "../components/import/ImportFilterPanel";
import ImportTableList from "../components/import/ImportTableList";
import { API_BASE_URL } from "../services/api";
import axios from "axios";

export default function ImportListPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  // --- STATE ---
  const [importList, setImportList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);

  // Nâng cấp bộ lọc
  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
    creator: "",
    supplier: "",
  });

  // Danh sách người tạo & nhà cung cấp (đổ vào select)
  const [creators, setCreators] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Lấy danh sách import
  const fetchImports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/inventory/import-product`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formatted = (res.data || []).map((item) => ({
        id: item.importProductId || item.importCode || "PN000001",
        supplierCode: item.supplierCode || "NCC0001",
        supplier: item.supplierName || "",
        employee: item.employeeName || "",
        total: Number(item.totalAmount) || 0,
        status: item.status || "DRAFT",
        createdAt: item.createdAt || new Date().toISOString(),
        note: item.note || "",
        details: item.details || [],
      }));

      setImportList(formatted);
    } catch (err) {
      console.error(err);
      setError(t("import.loadFail"));
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách người tạo & nhà cung cấp
  const fetchDropdownData = async () => {
    try {
      const [empRes, supRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/auth/users/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/inventory/supplier`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setCreators(empRes.data || []);
      setSuppliers(supRes.data || []);
    } catch (err) {
      console.error("Lỗi load dropdown:", err);
    }
  };

  useEffect(() => {
    fetchImports();
    fetchDropdownData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lọc dữ liệu
  const filtered = importList.filter((p) => {
    const matchQuery =
      (p.id?.toString().toLowerCase().includes(query.toLowerCase()) ||
        p.supplier?.toLowerCase().includes(query.toLowerCase())) ?? false;

    const matchStatus = !filters.status || (p.status || "").toLowerCase() === filters.status.toLowerCase();
    const matchCreator = !filters.creator || (p.employee || "").toLowerCase().includes(filters.creator.toLowerCase());
    const matchSupplier = !filters.supplier || (p.supplier || "").toLowerCase().includes(filters.supplier.toLowerCase());

    // Lọc theo thời gian (ISO)
    const created = new Date(p.createdAt);
    const okStart = !filters.startDate || created >= new Date(filters.startDate);
    const okEnd = !filters.endDate || created <= new Date(filters.endDate);

    return matchQuery && matchStatus && matchCreator && matchSupplier && okStart && okEnd;
  });

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentRows = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const rowsSelectValue = rowsPerPage > 100 ? "all" : rowsPerPage;

  const [selectedImports, setSelectedImports] = useState([]);

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = currentRows.map((p) => p.id);
      setSelectedImports(allIds);
    } else {
      setSelectedImports([]);
    }
  };
  const handleSelectOne = (id) => {
    setSelectedImports((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleToggleRow = (id) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  return (
    <MainLayout>
      <div className="container-fluid py-3 position-relative">
        {/* HEADER */}
        <div className="row align-items-center gy-2 mb-2">
          <div className="col-12 col-md-3 col-lg-2 d-flex align-items-center">
            <h4 className="fw-bold text-capitalize mb-0">{t("import.title")}</h4>
          </div>

          {/* Ô tìm kiếm */}
          <div className="col-12 col-md-5 col-lg-5">
            <div className={`input-group border border-${theme} rounded-3 align-items-center`} style={{ height: "40px" }}>
              <span className={`input-group-text bg-white border-0 text-${theme}`} style={{ borderRight: `1px solid var(--bs-${theme})`, height: "100%" }}>
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="form-control border-0 shadow-none"
                placeholder={t("import.searchPlaceholder")}
              />
            </div>
          </div>

          {/* Nút chức năng */}
          <div className="col-12 col-md-4 col-lg-5 d-flex justify-content-end gap-2 flex-wrap">
            <button className={`btn btn-${theme} text-white fw-semibold d-flex align-items-center rounded-3 px-3`} onClick={() => navigate("/products/importdetail")}>
              <i className="bi bi-plus-lg"></i>
              <span className="ms-1 d-none d-sm-inline">{t("import.addNew")}</span>
            </button>
            <button className={`btn btn-outline-${theme} d-flex align-items-center fw-semibold rounded-3 px-3`} onClick={() => alert("Xuất file danh sách nhập hàng") }>
              <i className="bi bi-download"></i>
              <span className="ms-1 d-none d-md-inline">{t("import.exportFile")}</span>
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="row g-3 mt-1">
          {/* Bộ lọc */}
          <aside className="col-lg-2 d-none d-lg-block">
            <div className="card shadow-sm border-0 h-100 p-3">
              <h6 className="fw-bold mb-3">{t("import.filter")}</h6>

              {/* Trạng thái */}
              <div className="mb-3">
                <label className="form-label fw-semibold">{t("import.status")}</label>
                <select className="form-select form-select-sm" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
                  <option value="">Tất cả</option>
                  <option value="COMPLETED">Hoàn tất</option>
                  <option value="DRAFT">Phiếu tạm</option>
                </select>
              </div>

              {/* Thời gian */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Từ ngày</label>
                <input type="date" className="form-control form-control-sm" value={filters.startDate} onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))} />
                <label className="form-label fw-semibold mt-2">Đến ngày</label>
                <input type="date" className="form-control form-control-sm" value={filters.endDate} onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))} />
              </div>

              {/* Người tạo */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Người tạo</label>
                <select className="form-select form-select-sm" value={filters.creator} onChange={(e) => setFilters((f) => ({ ...f, creator: e.target.value }))}>
                  <option value="">Tất cả</option>
                  {creators.map((c) => (
                    <option key={c.id || c.userID} value={(c.fullName || c.username || "").toString()}>
                      {c.fullName || c.username}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nhà cung cấp */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Nhà cung cấp</label>
                <select className="form-select form-select-sm" value={filters.supplier} onChange={(e) => setFilters((f) => ({ ...f, supplier: e.target.value }))}>
                  <option value="">Tất cả</option>
                  {suppliers.map((s) => (
                    <option key={s.supplierCode || s.supplierId} value={s.supplierName}>
                      {s.supplierName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          {/* Bảng danh sách */}
          <main className="col-lg-10 col-12">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" />
              </div>
            ) : error ? (
              <div className="text-danger text-center py-4">{error}</div>
            ) : (
              <ImportTableList
                data={currentRows}
                selected={selectedImports}
                onSelectOne={handleSelectOne}
                onSelectAll={handleSelectAll}
                expandedRow={expandedRow}
                onExpand={handleToggleRow}
              />
            )}

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="d-flex align-items-center gap-2">
                <span>{t("common.show")}</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: 130 }}
                  value={rowsSelectValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRowsPerPage(val === "all" ? Number.MAX_SAFE_INTEGER : Number(val));
                    setCurrentPage(1);
                  }}
                >
                  {[15, 30, 50, 100].map((n) => (
                    <option key={n} value={n}>{n} {t("common.rows")}</option>
                  ))}
                  <option value="all">{t("common.all") || "All"}</option>
                </select>
              </div>

              <div className="btn-group">
                <button className={`btn btn-outline-${theme}`} disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                  &lt;
                </button>
                <span className={`btn btn-${theme} text-white fw-bold`}>{currentPage}</span>
                <button className={`btn btn-outline-${theme}`} disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
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

