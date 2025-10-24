import React from "react";
import { useTranslation } from "react-i18next";
import Select from "react-select";
import { useTheme } from "../../context/ThemeContext";

export default function ProductFilterPanel({ filters, onChange, categories, brands, suppliers }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // ✅ Hàm thêm mới danh mục / thương hiệu / nhà cung cấp
  const addOption = (type, addHandler, list) => {
    const value = prompt(t(`products.enterNew${type}`));
    if (value && !list.includes(value.trim())) {
      addHandler(value.trim());
    }
  };

  return (
    <aside className="col-lg-2 d-none d-lg-block">
      <div className="card shadow-sm border-0 h-100">
        <div className="card-body">
          <h6 className="fw-bold mb-4">{t("products.filterTitle")}</h6>

          {/* ===== Danh mục ===== */}
          <div className="mb-4">
            <div className="d-flex justify-content-between mb-2">
              <label className="form-label mb-0">{t("products.category")}</label>
              <button
                className={`btn btn-outline-${theme} btn-sm p-0 rounded-circle`}
                style={{ width: 22, height: 22 }}
                onClick={() => addOption("Category", onChange.addCategory, categories)}
                title={t("products.addCategory")}
              >
                <i className="bi bi-plus-lg" style={{ fontSize: "11px" }}></i>
              </button>
            </div>
            <Select
              value={filters.category ? { value: filters.category, label: filters.category } : null}
              onChange={(opt) => onChange.change("category", opt ? opt.value : "")}
              options={categories.map((v) => ({ value: v, label: v }))}
              placeholder={t("products.selectCategory")}
              isSearchable
            />
          </div>

          {/* ===== Thương hiệu ===== */}
          <div className="mb-4">
            <div className="d-flex justify-content-between mb-2">
              <label className="form-label mb-0">{t("products.brand")}</label>
              <button
                className={`btn btn-outline-${theme} btn-sm p-0 rounded-circle`}
                style={{ width: 22, height: 22 }}
                onClick={() => addOption("Brand", onChange.addBrand, brands)}
                title={t("products.addBrand")}
              >
                <i className="bi bi-plus-lg" style={{ fontSize: "11px" }}></i>
              </button>
            </div>
            <Select
              value={filters.brand ? { value: filters.brand, label: filters.brand } : null}
              onChange={(opt) => onChange.change("brand", opt ? opt.value : "")}
              options={brands.map((v) => ({ value: v, label: v }))}
              placeholder={t("products.selectBrand")}
              isSearchable
            />
          </div>

          {/* ===== Nhà cung cấp ===== */}
          <div className="mb-4">
            <div className="d-flex justify-content-between mb-2">
              <label className="form-label mb-0">{t("products.supplier")}</label>
              <button
                className={`btn btn-outline-${theme} btn-sm p-0 rounded-circle`}
                style={{ width: 22, height: 22 }}
                onClick={() => addOption("Supplier", onChange.addSupplier, suppliers)}
                title={t("products.addSupplier")}
              >
                <i className="bi bi-plus-lg" style={{ fontSize: "11px" }}></i>
              </button>
            </div>
            <Select
              value={filters.supplier ? { value: filters.supplier, label: filters.supplier } : null}
              onChange={(opt) => onChange.change("supplier", opt ? opt.value : "")}
              options={suppliers.map((v) => ({ value: v, label: v }))}
              placeholder={t("products.selectSupplier")}
              isSearchable
            />
          </div>

          {/* ===== Ngày tạo ===== */}
          <div className="mb-4">
            <label className="form-label fw-medium mb-2">{t("products.createdAt")}</label>
            <input
              type="date"
              className={`form-control form-control-sm border-${theme} shadow-sm`}
              value={filters.createdAt || ""}
              onChange={(e) => onChange.change("createdAt", e.target.value)}
            />
          </div>

          {/* ===== Tồn kho ===== */}
          <div className="mb-4">
            <label className="form-label fw-medium mb-2">{t("products.stockStatus")}</label>
            <select
              className="form-select form-select-sm shadow-sm"
              value={filters.stock}
              onChange={(e) => onChange.change("stock", e.target.value)}
            >
              <option value="all">{t("products.all")}</option>
              <option value="in">{t("products.inStock")}</option>
              <option value="out">{t("products.outOfStock")}</option>
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
}
