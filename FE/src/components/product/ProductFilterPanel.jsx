import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import CategoryAddCard from "../product/CategoryAddCard";
import BrandAddCard from "../product/BrandAddCard";
import { API_BASE_URL } from "../../services/api";

export default function ProductFilterPanel({ filters, onChange }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const token = localStorage.getItem("accessToken");

  // === STATE ===
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [showModal, setShowModal] = useState(null); // "category" | "brand"
  const [loading, setLoading] = useState(false);
  const [dateErrors, setDateErrors] = useState({ from: "", to: "" });

  // ✅ value phải là "all" để filter hoạt động ổn định, label mới i18n
  const allOption = useMemo(
    () => ({ value: "all", label: t("common.all", "Tất cả") }),
    [t]
  );

  // === VALIDATION FUNCTIONS ===
  const isValidDate = (dateString) => {
    // Kiểm tra định dạng dd/mm/yyyy hoặc yyyy-mm-dd
    const regex = /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[012])\/\d{4}$|^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    // Kiểm tra ngày hợp lệ
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const validateDates = (fromDate, toDate) => {
    const errors = { from: "", to: "" };
    
    if (fromDate && !isValidDate(fromDate)) {
      errors.from = t("validation.invalidDateFormat", "Định dạng ngày không hợp lệ");
    }
    
    if (toDate && !isValidDate(toDate)) {
      errors.to = t("validation.invalidDateFormat", "Định dạng ngày không hợp lệ");
    }
    
    if (fromDate && toDate && isValidDate(fromDate) && isValidDate(toDate)) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      if (from > to) {
        errors.to = t("validation.toDateBeforeFrom", "Ngày đến phải sau ngày từ");
      }
    }
    
    return errors;
  };

  // === GỌI API ===
  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, brandRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/inventory/category`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/inventory/brand`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // ✅ Chuẩn hóa dữ liệu từ BE
      const normalizedCats = (catRes.data || [])
        .map((c) => ({
          value: c.categoryName || c.name || c,
          label: c.categoryName || c.name || c,
        }))
        .filter((x) => x.value); // tránh null/undefined

      const normalizedBrands = (brandRes.data || [])
        .map((b) => ({
          value: b.brandName || b.name || b,
          label: b.brandName || b.name || b,
        }))
        .filter((x) => x.value);

      setCategories(normalizedCats);
      setBrands(normalizedBrands);
    } catch (err) {
      console.error("❌ Lỗi tải danh mục/thương hiệu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Validate dates khi filters thay đổi
  useEffect(() => {
    const errors = validateDates(filters.createdAtFrom, filters.createdAtTo);
    setDateErrors(errors);
  }, [filters.createdAtFrom, filters.createdAtTo]);

  // === Styles cho Select ===
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? `var(--bs-${theme})` : "#dee2e6",
      boxShadow: state.isFocused ? `0 0 0 0.15rem rgba(13,110,253,.25)` : "none",
      "&:hover": {
        borderColor: `var(--bs-${theme})`,
      },
      minHeight: 36,
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: `var(--bs-${theme})`,
    }),
  };

  // === Callback thêm mới Category / Brand ===
  const handleCategoryAdded = async (data) => {
    if (data?.categoryName) {
      await fetchData();
      onChange?.reload?.("category", data);
    }
    setShowModal(null);
  };

  const handleBrandAdded = async (data) => {
    if (data?.brandName) {
      await fetchData();
      onChange?.reload?.("brand", data);
    }
    setShowModal(null);
  };

  // === Xử lý thay đổi ngày ===
  const handleDateChange = (field, value) => {
    onChange.change(field, value);
  };

  // === Xóa lọc ngày ===
  const handleClearDateFilter = () => {
    onChange.change("createdAtFrom", "");
    onChange.change("createdAtTo", "");
    setDateErrors({ from: "", to: "" });
  };

  // ===== Options Mức tồn =====
  const stockOptions = useMemo(
    () => [
      allOption,
      { value: "above", label: t("products.stockAboveMin", "Trên mức tồn") },
      { value: "below", label: t("products.stockBelowMin", "Dưới mức tồn") },
    ],
    [allOption, t]
  );

  // ✅ build options + helper pick
  const categoryOptions = useMemo(
    () => [allOption, ...categories],
    [allOption, categories]
  );
  const brandOptions = useMemo(
    () => [allOption, ...brands],
    [allOption, brands]
  );

  const pickOption = (val, options) =>
    options.find((o) => o.value === (val || "all")) || allOption;

  const stockValue = useMemo(
    () => pickOption(filters?.stockLevel, stockOptions),
    [filters?.stockLevel, stockOptions, allOption]
  );

  // Kiểm tra xem có lỗi validation không
  const hasDateErrors = dateErrors.from || dateErrors.to;
  const hasDateFilter = filters.createdAtFrom || filters.createdAtTo;

  return (
    <>
      <aside className="col-lg-2 d-none d-lg-block">
        <div className="card shadow-sm border-0 h-100">
          <div className="card-body">
            {/* ===== DANH MỤC ===== */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-semibold mb-0">
                  {t("products.category", "Danh mục")}
                </label>
                <button
                  className={`btn btn-outline-${theme} btn-sm p-0 rounded-circle`}
                  style={{ width: 22, height: 22 }}
                  onClick={() => setShowModal("category")}
                  title={t("products.addCategory", "Thêm danh mục")}
                  type="button"
                >
                  <i className="bi bi-plus-lg" style={{ fontSize: "11px" }} />
                </button>
              </div>

              <Select
                isLoading={loading}
                styles={customSelectStyles}
                value={pickOption(filters?.category, categoryOptions)}
                onChange={(opt) => onChange.change("category", opt?.value || "all")}
                options={categoryOptions}
                placeholder={t("products.selectCategory", "Chọn danh mục")}
                isSearchable
              />
            </div>

            {/* ===== THƯƠNG HIỆU ===== */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-semibold mb-0">
                  {t("products.brand", "Thương hiệu")}
                </label>
                <button
                  className={`btn btn-outline-${theme} btn-sm p-0 rounded-circle`}
                  style={{ width: 22, height: 22 }}
                  onClick={() => setShowModal("brand")}
                  title={t("products.addBrand", "Thêm thương hiệu")}
                  type="button"
                >
                  <i className="bi bi-plus-lg" style={{ fontSize: "11px" }} />
                </button>
              </div>

              <Select
                isLoading={loading}
                styles={customSelectStyles}
                value={pickOption(filters?.brand, brandOptions)}
                onChange={(opt) => onChange.change("brand", opt?.value || "all")}
                options={brandOptions}
                placeholder={t("products.selectBrand", "Chọn thương hiệu")}
                isSearchable
              />
            </div>

            {/* ===== MỨC TỒN ===== */}
            <div className="mb-4">
              <label className="form-label fw-semibold mb-2">
                {t("products.stockLevel", "Mức tồn")}
              </label>

              <Select
                styles={customSelectStyles}
                value={stockValue}
                onChange={(opt) => onChange.change("stockLevel", opt?.value || "all")}
                options={stockOptions}
                placeholder={t("products.stockLevel", "Mức tồn")}
                isSearchable={false}
              />
            </div>

            {/* ===== NGÀY TẠO ===== */}
            <div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-semibold mb-0">
                  {t("products.createdAtRange", "Ngày tạo")}
                </label>
                {hasDateFilter && !hasDateErrors && (
                  <button
                    type="button"
                    className={`btn btn-link btn-sm text-${theme} p-0`}
                    onClick={handleClearDateFilter}
                    title={t("common.clearFilter", "Xóa lọc ngày")}
                    style={{ textDecoration: "none" }}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    <small>{t("common.clear", "Xóa")}</small>
                  </button>
                )}
              </div>
              
              {/* Từ ngày */}
              <div className="mb-3">
                <label className="form-label small text-muted mb-1">
                  {t("products.fromDate", "Từ ngày")}
                </label>
                <input
                  type="date"
                  className={`form-control form-control-sm ${
                    dateErrors.from ? "is-invalid" : ""
                  }`}
                  value={filters.createdAtFrom || ""}
                  onChange={(e) => handleDateChange("createdAtFrom", e.target.value)}
                  max={filters.createdAtTo || undefined}
                />
                {dateErrors.from && (
                  <div className="invalid-feedback small">
                    {dateErrors.from}
                  </div>
                )}
              </div>
              
              {/* Đến ngày */}
              <div className="mb-3">
                <label className="form-label small text-muted mb-1">
                  {t("products.toDate", "Đến ngày")}
                </label>
                <input
                  type="date"
                  className={`form-control form-control-sm ${
                    dateErrors.to ? "is-invalid" : ""
                  }`}
                  value={filters.createdAtTo || ""}
                  onChange={(e) => handleDateChange("createdAtTo", e.target.value)}
                  min={filters.createdAtFrom || undefined}
                />
                {dateErrors.to && (
                  <div className="invalid-feedback small">
                    {dateErrors.to}
                  </div>
                )}
              </div>
              
              {/* Thông báo lỗi tổng */}
              {hasDateErrors && (
                <div className="alert alert-danger py-2 small">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  {t("validation.fixErrorsBeforeFilter", "Vui lòng sửa lỗi trước khi lọc")}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ===== MODAL THÊM MỚI ===== */}
      {showModal && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,.4)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title">
                  {showModal === "category"
                    ? t("products.addCategory", "Thêm danh mục")
                    : t("products.addBrand", "Thêm thương hiệu")}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(null)}
                />
              </div>
              <div className="modal-body">
                {showModal === "category" ? (
                  <CategoryAddCard onSave={handleCategoryAdded} />
                ) : (
                  <BrandAddCard onSave={handleBrandAdded} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}