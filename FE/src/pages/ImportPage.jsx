import React, { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import ImportTableList from "../components/import/ImportTableList";
import TablePagination from "../components/common/TablePagination";
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

  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
    creator: "",
    supplier: "",
  });

  const [creators, setCreators] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Load import list
  const fetchImports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/inventory/import-product`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formatted = (res.data || []).map((item) => ({
        id: item.importProductId || item.importCode || "PN000001",
        supplierCode: item.supplierCode,
        supplier: item.supplierName || "",
        employee: item.employeeFullName || item.employeeName || "",
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

  // Load dropdowns
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
      console.error("Failed to load dropdown", err);
    }
  };

  useEffect(() => {
    fetchImports();
    fetchDropdownData();
  }, []);

  // FILTER LOGIC
  const filtered = importList.filter((p) => {
    const q = query.toLowerCase();

    const matchQuery =
      p.id?.toString().toLowerCase().includes(q) ||
      p.supplier?.toLowerCase().includes(q);

    const matchStatus =
      !filters.status || p.status.toLowerCase() === filters.status.toLowerCase();

    const matchCreator =
      !filters.creator ||
      p.employee?.toLowerCase().includes(filters.creator.toLowerCase());

    const matchSupplier =
      !filters.supplier ||
      p.supplier?.toLowerCase().includes(filters.supplier.toLowerCase());

    const created = new Date(p.createdAt);
    const okStart = !filters.startDate || created >= new Date(filters.startDate);
    const okEnd = !filters.endDate || created <= new Date(filters.endDate);

    return matchQuery && matchStatus && matchCreator && matchSupplier && okStart && okEnd;
  });

  // PAGINATION
  const currentRows = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const rowsSelectValue = rowsPerPage > 100 ? "all" : rowsPerPage;

  const [selectedImports, setSelectedImports] = useState([]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedImports(currentRows.map((p) => p.id));
    } else {
      setSelectedImports([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedImports((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const handleRowsPerPageChange = (value) => {
    const nextValue = value === "all" ? Number.MAX_SAFE_INTEGER : Number(value);
    setRowsPerPage(nextValue);
    setCurrentPage(1);
  };

  return (
    <MainLayout>
      <div className="container-fluid py-3 position-relative">

        {/* HEADER */}
        <div className="row align-items-center gy-2 mb-2">
          <div className="col-12 col-md-3 col-lg-2">
            <h4 className="fw-bold text-capitalize mb-0">
              {t("import.title")}
            </h4>
          </div>

          {/* SEARCH */}
          <div className="col-12 col-md-5 col-lg-5">
            <div
              className={`input-group border border-${theme} rounded-3`}
              style={{ height: "40px" }}
            >
              <span
                className={`input-group-text bg-white border-0 text-${theme}`}
                style={{ borderRight: `1px solid var(--bs-${theme})` }}
              >
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

          {/* BUTTONS */}
          <div className="col-12 col-md-4 col-lg-5 d-flex justify-content-end gap-2 flex-wrap">
            <button
              className={`btn btn-${theme} text-white fw-semibold rounded-3 px-3`}
              onClick={() => navigate("/products/importdetail")}
            >
              <i className="bi bi-plus-lg"></i>
              <span className="ms-1 d-none d-sm-inline">
                {t("import.addNew")}
              </span>
            </button>

            <button
              className={`btn btn-outline-${theme} fw-semibold rounded-3 px-3`}
              onClick={() => alert(t("import.alerts.exportInfo"))}
            >
              <i className="bi bi-download"></i>
              <span className="ms-1 d-none d-md-inline">
                {t("import.exportFile")}
              </span>
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="row g-3 mt-1">

          {/* FILTER PANEL */}
          <aside className="col-lg-2 d-none d-lg-block">
            <div className="card shadow-sm border-0 h-100 p-3">
              

              {/* STATUS */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  {t("import.status")}
                </label>
                <select
                  className="form-select form-select-sm"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, status: e.target.value }))
                  }
                >
                  <option value="">{t("common.all")}</option>
                  <option value="COMPLETED">{t("import.status_completed")}</option>
                  <option value="DRAFT">{t("import.status_draft")}</option>
                </select>
              </div>

              {/* DATE */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  {t("import.date_from")}
                </label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, startDate: e.target.value }))
                  }
                />

                <label className="form-label fw-semibold mt-2">
                  {t("import.date_to")}
                </label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, endDate: e.target.value }))
                  }
                />
              </div>

              {/* CREATOR */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  {t("import.creator")}
                </label>
                <select
                  className="form-select form-select-sm"
                  value={filters.creator}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, creator: e.target.value }))
                  }
                >
                  <option value="">{t("common.all")}</option>
                  {creators.map((c) => (
                    <option key={c.id} value={c.fullName}>
                      {c.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* SUPPLIER */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  {t("import.supplier")}
                </label>
                <select
                  className="form-select form-select-sm"
                  value={filters.supplier}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, supplier: e.target.value }))
                  }
                >
                  <option value="">{t("common.all")}</option>
                  {suppliers.map((s) => (
                    <option key={s.supplierId} value={s.supplierName}>
                      {s.supplierName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          {/* TABLE */}
          <main className="col-lg-10 col-12">
            <div className="position-relative">
              <ImportTableList
                data={currentRows}
                selected={selectedImports}
                onSelectOne={handleSelectOne}
                onSelectAll={handleSelectAll}
                expandedRow={expandedRow}
                onExpand={setExpandedRow}
                emptyMessage={error}
              />

              {loading && (
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75 rounded-3"
                  style={{ backdropFilter: "blur(2px)" }}
                >
                  <div className="spinner-border text-primary" />
                </div>
              )}
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
          </main>

        </div>
      </div>
    </MainLayout>
  );
}
