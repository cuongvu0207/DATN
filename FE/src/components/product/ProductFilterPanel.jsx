import React from "react";
import { useTranslation } from "react-i18next";
import Select from "react-select";
import { useTheme } from "../../context/ThemeContext";

export default function ProductFilterPanel({
  filters,
  onChange,
  categories,
  brands,
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // ===== Hàm thêm mới danh mục / thương hiệu =====
  const addOption = (type, addHandler, list) => {
    const value = prompt(t(`products.enterNew${type}`) || `Nhập ${type} mới:`);
    if (value && !list.includes(value.trim())) {
      addHandler(value.trim());
    }
  };

  // ===== Style react-select =====
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

  // ===== Danh sách có "Tất cả" =====
  const makeOptions = (list) => [
    { value: "all", label: t("common.all") || "Tất cả" },
    ...list.map((v) => ({ value: v, label: v })),
  ];

  return (
    <aside className="col-lg-2 d-none d-lg-block">
      <div className="card shadow-sm border-0 h-100">
        <div className="card-body">


          {/* ===== Danh mục ===== */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label fw-semibold mb-0">
                {t("products.category") || "Danh mục"}
              </label>
              <button
                className={`btn btn-outline-${theme} btn-sm p-0 rounded-circle`}
                style={{ width: 22, height: 22 }}
                onClick={() =>
                  addOption("Category", onChange.addCategory, categories)
                }
                title={t("products.addCategory") || "Thêm danh mục"}
              >
                <i className="bi bi-plus-lg" style={{ fontSize: "11px" }}></i>
              </button>
            </div>
            <Select
              styles={customSelectStyles}
              value={
                filters.category
                  ? { value: filters.category, label: filters.category }
                  : { value: "all", label: t("common.all") || "Tất cả" }
              }
              onChange={(opt) =>
                onChange.change("category", opt ? opt.value : "all")
              }
              options={makeOptions(categories)}
              placeholder={t("products.selectCategory") || "Chọn danh mục..."}
              isSearchable
            />
          </div>

          {/* ===== Thương hiệu ===== */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label fw-semibold mb-0">
                {t("products.brand") || "Thương hiệu"}
              </label>
              <button
                className={`btn btn-outline-${theme} btn-sm p-0 rounded-circle`}
                style={{ width: 22, height: 22 }}
                onClick={() => addOption("Brand", onChange.addBrand, brands)}
                title={t("products.addBrand") || "Thêm thương hiệu"}
              >
                <i className="bi bi-plus-lg" style={{ fontSize: "11px" }}></i>
              </button>
            </div>
            <Select
              styles={customSelectStyles}
              value={
                filters.brand
                  ? { value: filters.brand, label: filters.brand }
                  : { value: "all", label: t("common.all") || "Tất cả" }
              }
              onChange={(opt) =>
                onChange.change("brand", opt ? opt.value : "all")
              }
              options={makeOptions(brands)}
              placeholder={t("products.selectBrand") || "Chọn thương hiệu..."}
              isSearchable
            />
          </div>

          {/* ===== Ngày tạo ===== */}
          <div>
            <label className="form-label fw-semibold mb-2">
              {t("products.createdAt") || "Ngày tạo"}
            </label>
            <input
              type="date"
              className={`form-control form-control-sm border-${theme} shadow-sm`}
              value={filters.createdAt || ""}
              onChange={(e) => onChange.change("createdAt", e.target.value)}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
