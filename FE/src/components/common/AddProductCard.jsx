import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { API_BASE_URL } from "../../services/api";
import CategoryAddCard from "../product/CategoryAddCard";
import BrandAddCard from "../product/BrandAddCard";
import { validators } from "../../utils/validators";
import useLoadingTimeout from "../../hooks/useLoadingTimeout";

export default function AddProductCard({ onCancel, onSave }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const token = localStorage.getItem("accessToken");

  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    brandId: "",
    unit: "Cái",
    cost: "",
    price: "",
    stock: "",
    barcode: "",
    imageFile: null,
  });

  const [preview, setPreview] = useState(null);
  const [localCategories, setLocalCategories] = useState([]);
  const [localBrands, setLocalBrands] = useState([]);
  const [showModal, setShowModal] = useState(null);

  // ⭐ Loading khi lưu
  const [saving, setSaving] = useState(false);
  const { showSpinner } = useLoadingTimeout(saving, { delayMs: 200 });

  /* ================================
     Format & Normalize
  ================================= */
  const formatCurrencyDots = (num) => {
    if (!num) return "";
    return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const normalizeNumber = (str) => str.replace(/\./g, "");

  /* ================================
     Fetch Category + Brand
  ================================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/inventory/category`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/inventory/brand`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setLocalCategories(
          (catRes.data || []).map((c, i) => ({
            categoryId: String(c.categoryId || c.id || i),
            categoryName: c.categoryName || c.name || c,
          }))
        );

        setLocalBrands(
          (brandRes.data || []).map((b, i) => ({
            brandId: String(b.brandId || b.id || i),
            brandName: b.brandName || b.name || b,
          }))
        );
      } catch (err) {
        console.error("Load category/brand error:", err);
      }
    };

    fetchData();
  }, [token]);

  /* ================================
     Handle input
  ================================= */
  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberInput = (e) => {
    const { name, value } = e.target;

    if (!/^[0-9.]*$/.test(value)) return;

    const raw = normalizeNumber(value);

    if (value.includes(".")) {
      if (!validators.decimal(raw)) return;
    }

    if (raw !== "" && Number(raw) < 0) return;

    setForm((prev) => ({ ...prev, [name]: raw }));
  };

  /* ================================
     Add Category / Brand
  ================================= */
  const handleCategoryAdded = (data) => {
    const id = data?.categoryId ?? data?.id;
    const name = data?.categoryName ?? data?.name;

    if (id && name) {
      const normalized = { categoryId: String(id), categoryName: name };
      setLocalCategories((prev) =>
        prev.find((c) => c.categoryId === normalized.categoryId)
          ? prev
          : [...prev, normalized]
      );
      setForm((prev) => ({ ...prev, categoryId: String(id) }));
    }
    setShowModal(null);
  };

  const handleBrandAdded = (data) => {
    const id = data?.brandId ?? data?.id;
    const name = data?.brandName ?? data?.name;

    if (id && name) {
      const normalized = { brandId: String(id), brandName: name };
      setLocalBrands((prev) =>
        prev.find((b) => b.brandId === normalized.brandId)
          ? prev
          : [...prev, normalized]
      );
      setForm((prev) => ({ ...prev, brandId: String(id) }));
    }
    setShowModal(null);
  };

  /* ================================
     Image
  ================================= */
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({ ...prev, imageFile: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  /* ================================
     Submit
  ================================= */
  const generateBarcode = () =>
    "SP" + Math.floor(100000000000 + Math.random() * 900000000000);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return alert(t("products.enterProductName"));
    if (!form.categoryId || !form.brandId)
      return alert(t("products.chooseCategoryBrand"));

    setSaving(true);

    try {
      const newProduct = {
        ...form,
        price: Number(form.price || 0),
        cost: Number(form.cost || 0),
        stock: Number(form.stock || 0),
        barcode: form.barcode || generateBarcode(),
        id: "SPNEW" + Math.floor(Math.random() * 1000),
        createdAt: new Date().toLocaleDateString("vi-VN"),
      };

      await onSave(newProduct); // chờ BE xử lý upload ảnh
    } finally {
      setSaving(false);
    }
  };

  /* ================================
     UI
  ================================= */
  return (
    <>
      {/* Loading Overlay */}
      {showSpinner && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
          style={{ background: "rgba(255,255,255,0.65)", zIndex: 3000 }}
        >
          <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }}></div>
          <div className="mt-3 fw-semibold fs-5">{t("common.saving") || "Đang lưu sản phẩm..."}</div>
        </div>
      )}

      <div
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center"
        style={{ zIndex: 1050 }}
        onClick={onCancel}
      >
        <div
          className="bg-white rounded-4 shadow-lg p-4 position-relative"
          style={{ width: "90%", maxWidth: "950px", maxHeight: "90%", overflowY: "auto" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className={`fw-bold text-${theme} m-0`}>{t("products.addProduct")}</h5>
            <button type="button" className="btn-close" onClick={onCancel}></button>
          </div>

          {/* IMAGE */}
          <div className="text-center mb-4">
            <div className="p-3 d-inline-block bg-light rounded-3">
              <img
                src={preview || "https://via.placeholder.com/200x200?text=No+Image"}
                alt="preview"
                className="img-fluid rounded mb-2"
                style={{ objectFit: "cover", maxHeight: "200px" }}
              />
              <label className={`btn btn-outline-${theme} btn-sm w-100`}>
                <i className="bi bi-upload me-1"></i>
                {t("products.chooseImage")}
                <input type="file" accept="image/*" hidden onChange={handleImageChange} />
              </label>
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            <div className="row g-3">

              {/* NAME */}
              <div className="col-md-6">
                <label className="form-label">{t("products.productName")}</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={form.name}
                  onChange={handleTextChange}
                  required
                />
              </div>

              {/* BARCODE */}
              <div className="col-md-6">
                <label className="form-label">{t("products.barcode")}</label>
                <input
                  type="text"
                  name="barcode"
                  className="form-control"
                  value={form.barcode}
                  onChange={handleTextChange}
                />
              </div>

              {/* CATEGORY */}
              <div className="col-md-6">
                <label className="form-label d-flex justify-content-between">
                  {t("products.category")}
                  <button
                    type="button"
                    className={`btn btn-outline-${theme} btn-sm rounded-circle p-0`}
                    style={{ width: 24, height: 24 }}
                    onClick={() => setShowModal("category")}
                  >
                    <i className="bi bi-plus-lg"></i>
                  </button>
                </label>
                <select
                  name="categoryId"
                  className="form-select"
                  value={form.categoryId}
                  onChange={handleTextChange}
                  required
                >
                  <option value="">{t("products.selectCategory")}</option>
                  {localCategories.map((cat) => (
                    <option key={cat.categoryId} value={cat.categoryId}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* BRAND */}
              <div className="col-md-6">
                <label className="form-label d-flex justify-content-between">
                  {t("products.brand")}
                  <button
                    type="button"
                    className={`btn btn-outline-${theme} btn-sm rounded-circle p-0`}
                    style={{ width: 24, height: 24 }}
                    onClick={() => setShowModal("brand")}
                  >
                    <i className="bi bi-plus-lg"></i>
                  </button>
                </label>
                <select
                  name="brandId"
                  className="form-select"
                  value={form.brandId}
                  onChange={handleTextChange}
                  required
                >
                  <option value="">{t("products.selectBrand")}</option>
                  {localBrands.map((b) => (
                    <option key={b.brandId} value={b.brandId}>
                      {b.brandName}
                    </option>
                  ))}
                </select>
              </div>

              {/* UNIT */}
              <div className="col-md-6">
                <label className="form-label">{t("products.unit")}</label>
                <input
                  type="text"
                  name="unit"
                  className="form-control"
                  value={form.unit}
                  onChange={handleTextChange}
                  required
                />
              </div>

              {/* COST */}
              <div className="col-md-4">
                <label className="form-label">{t("products.costOfCapital")}</label>
                <input
                  type="text"
                  name="cost"
                  className="form-control"
                  value={formatCurrencyDots(form.cost)}
                  onChange={handleNumberInput}
                  placeholder="0"
                  required
                />
              </div>

              {/* PRICE */}
              <div className="col-md-4">
                <label className="form-label">{t("products.sellingPrice")}</label>
                <input
                  type="text"
                  name="price"
                  className="form-control"
                  value={formatCurrencyDots(form.price)}
                  onChange={handleNumberInput}
                  placeholder="0"
                  required
                />
              </div>

              {/* STOCK */}
              <div className="col-md-4">
                <label className="form-label">{t("products.quantityInStock")}</label>
                <input
                  type="text"
                  name="stock"
                  className="form-control"
                  value={formatCurrencyDots(form.stock)}
                  onChange={handleNumberInput}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            {/* BUTTONS */}
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-secondary px-4" onClick={onCancel}>
                {t("common.cancel")}
              </button>
              <button type="submit" className={`btn btn-${theme} text-white px-4`}>
                {t("common.save")}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL ADD CATEGORY / BRAND */}
      {showModal && (
        <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,.4)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title">
                  {showModal === "brand" ? t("products.addBrand") : t("products.addCategory")}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(null)}></button>
              </div>
              <div className="modal-body">
                {showModal === "brand" ? (
                  <BrandAddCard onSave={handleBrandAdded} />
                ) : (
                  <CategoryAddCard onSave={handleCategoryAdded} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
