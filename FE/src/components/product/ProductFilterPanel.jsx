import React, { useState, useEffect } from "react";
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
      const normalizedCats = (catRes.data || []).map((c, i) => ({
        value: c.categoryName || c.name || c,
        label: c.categoryName || c.name || c,
      }));

      const normalizedBrands = (brandRes.data || []).map((b, i) => ({
        value: b.brandName || b.name || b,
        label: b.brandName || b.name || b,
      }));

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
  }, [token]);

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
      await fetchData(); // gọi lại API để cập nhật danh sách mới nhất
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

  return (
    <>
      <aside className="col-lg-2 d-none d-lg-block">
        <div className="card shadow-sm border-0 h-100">
          <div className="card-body">
            {/* ===== DANH MỤC ===== */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-semibold mb-0">
                  {t("products.category") || "Danh mục"}
                </label>
                <button
                  className={`btn btn-outline-${theme} btn-sm p-0 rounded-circle`}
                  style={{ width: 22, height: 22 }}
                  onClick={() => setShowModal("category")}
                  title={t("products.addCategory") || "Thêm danh mục"}
                >
                  <i className="bi bi-plus-lg" style={{ fontSize: "11px" }}></i>
                </button>
              </div>
              <Select
                isLoading={loading}
                styles={customSelectStyles}
                value={
                  filters.category
                    ? { value: filters.category, label: filters.category }
                    : { value: "all", label: t("common.all") || "Tất cả" }
                }
                onChange={(opt) =>
                  onChange.change("category", opt ? opt.value : "all")
                }
                options={[
                  { value: "all", label: t("common.all") || "Tất cả" },
                  ...categories,
                ]}
                placeholder={t("products.selectCategory") || "Chọn danh mục..."}
                isSearchable
              />
            </div>

            {/* ===== THƯƠNG HIỆU ===== */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-semibold mb-0">
                  {t("products.brand") || "Thương hiệu"}
                </label>
                <button
                  className={`btn btn-outline-${theme} btn-sm p-0 rounded-circle`}
                  style={{ width: 22, height: 22 }}
                  onClick={() => setShowModal("brand")}
                  title={t("products.addBrand") || "Thêm thương hiệu"}
                >
                  <i className="bi bi-plus-lg" style={{ fontSize: "11px" }}></i>
                </button>
              </div>
              <Select
                isLoading={loading}
                styles={customSelectStyles}
                value={
                  filters.brand
                    ? { value: filters.brand, label: filters.brand }
                    : { value: "all", label: t("common.all") || "Tất cả" }
                }
                onChange={(opt) =>
                  onChange.change("brand", opt ? opt.value : "all")
                }
                options={[
                  { value: "all", label: t("common.all") || "Tất cả" },
                  ...brands,
                ]}
                placeholder={t("products.selectBrand") || "Chọn thương hiệu..."}
                isSearchable
              />
            </div>

            {/* ===== NGÀY TẠO ===== */}
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
                    ? t("products.addCategory") || "Thêm danh mục"
                    : t("products.addBrand") || "Thêm thương hiệu"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(null)}
                ></button>
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
