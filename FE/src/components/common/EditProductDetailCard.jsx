import React, { useState, useEffect } from "react";
import Select from "react-select";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import CategoryAddCard from "../product/CategoryAddCard";
import BrandAddCard from "../product/BrandAddCard";
import { API_BASE_URL } from "../../services/api";
import { validators } from "../../utils/validators";

export default function EditProductDetailCard({ product, onClose, onSave }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const token = localStorage.getItem("accessToken");

  const [form, setForm] = useState({ ...product });
  const [preview, setPreview] = useState(product.image || "");

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [rawCats, setRawCats] = useState([]);
  const [rawBrands, setRawBrands] = useState([]);

  const [showModal, setShowModal] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ==========================================================
      🔹 FORMATTER SỐ DẤU CHẤM (1.200.000)
  ========================================================== */
  const formatCurrencyDots = (num) => {
    if (!num) return "";
    return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const normalizeNumber = (str) => str.replace(/\./g, "");

  /* ==========================================================
      🔹 FETCH CATEGORY + BRAND
  ========================================================== */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, brandRes] = await Promise.all([
          fetch(`${API_BASE_URL}/inventory/category`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/inventory/brand`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const cats = await catRes.json();
        const brands = await brandRes.json();

        setRawCats(cats);
        setRawBrands(brands);

        setCategories(
          cats.map((c) => ({
            value: c.categoryName,
            label: c.categoryName,
          }))
        );

        setBrands(
          brands.map((b) => ({
            value: b.brandName,
            label: b.brandName,
          }))
        );
      } catch (err) {
        console.error("Load categories/brands error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  /* ==========================================================
      🔹 GIỮ LẠI GIÁ TRỊ SELECT CŨ
  ========================================================== */
  useEffect(() => {
    if (categories.length > 0 && form.category) {
      const match = categories.find((c) => c.value === form.category);
      if (match) {
        setForm((p) => ({ ...p, category: match.value }));
      }
    }
    if (brands.length > 0 && form.brand) {
      const match = brands.find((b) => b.value === form.brand);
      if (match) {
        setForm((p) => ({ ...p, brand: match.value }));
      }
    }
  }, [categories, brands]);

  /* ==========================================================
      🔹 HANDLE TEXT INPUT
  ========================================================== */
  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ==========================================================
      🔹 HANDLE NUMBER INPUT (validate currency)
  ========================================================== */
  const handleNumberInput = (e) => {
    const { name, value } = e.target;

    // Allow only numbers + dot
    if (!/^[0-9.]*$/.test(value)) return;

    const raw = normalizeNumber(value);

    // validate số thập phân
    if (value.includes(".")) {
      if (!validators.decimal(raw)) return;
    }

    if (raw !== "" && Number(raw) < 0) return;

    setForm((prev) => ({ ...prev, [name]: raw }));
  };

  /* ==========================================================
      🔹 HANDLE SELECT
  ========================================================== */
  const handleSelectChange = (type, opt) => {
    setForm((prev) => ({ ...prev, [type]: opt?.value || "" }));
  };

  /* ==========================================================
      🔹 HANDLE IMAGE
  ========================================================== */
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    setForm((prev) => ({ ...prev, imageFile: file }));
  };

  /* ==========================================================
      🔹 SUBMIT
  ========================================================== */
  const handleSubmit = (e) => {
    e.preventDefault();

    const resolvedCategoryId =
      form.categoryId ||
      rawCats.find((c) => c.categoryName === form.category)?.categoryId ||
      "";

    const resolvedBrandId =
      form.brandId ||
      rawBrands.find((b) => b.brandName === form.brand)?.brandId ||
      "";

    const payload = {
      ...form,
      categoryId: resolvedCategoryId ? String(resolvedCategoryId) : "",
      brandId: resolvedBrandId ? String(resolvedBrandId) : "",
      price: Number(form.price || 0),
      cost: Number(form.cost || 0),
      stock: Number(form.stock || 0),
    };

    onSave(payload);
    onClose();
  };

  /* ==========================================================
      🔹 ADD CATEGORY / BRAND CALLBACK
  ========================================================== */
  const handleCategoryAdded = (data) => {
    const val = { value: data.categoryName, label: data.categoryName };

    setCategories((prev) =>
      prev.find((x) => x.value === val.value) ? prev : [...prev, val]
    );

    setForm((prev) => ({ ...prev, category: val.value }));
    setShowModal(null);
  };

  const handleBrandAdded = (data) => {
    const val = { value: data.brandName, label: data.brandName };

    setBrands((prev) =>
      prev.find((x) => x.value === val.value) ? prev : [...prev, val]
    );

    setForm((prev) => ({ ...prev, brand: val.value }));
    setShowModal(null);
  };

  /* ==========================================================
      🔹 UI
  ========================================================== */
  return (
    <>
      <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center"
        style={{ zIndex: 1050 }}
      >
        <div
          className="bg-white rounded-4 shadow-lg p-4"
          style={{ width: "90%", maxWidth: "950px", maxHeight: "90%", overflowY: "auto" }}
        >
          {/* HEADER */}
          <div className="d-flex justify-content-between mb-3">
            <h5 className={`fw-bold text-${theme}`}>{t("products.editProduct")}</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>

          {/* IMAGE */}
          <div className="text-center mb-4">
            <img
              src={preview || "https://via.placeholder.com/200x200?text=No+Image"}
              style={{ maxHeight: 200, objectFit: "cover" }}
              className="rounded shadow-sm mb-2"
            />
            <label className={`btn btn-outline-${theme} btn-sm`}>
              <i className="bi bi-upload me-1" />
              {t("products.chooseImage")}
              <input type="file" hidden accept="image/*" onChange={handleImageChange} />
            </label>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            <div className="row g-3 p-2">

              {/* ID */}
              <div className="col-md-6">
                <label className="form-label">{t("products.productId")}</label>
                <input disabled className="form-control" value={form.id} />
              </div>

              {/* Barcode */}
              <div className="col-md-6">
                <label className="form-label">{t("products.barcode")}</label>
                <input
                  className="form-control"
                  name="barcode"
                  value={form.barcode || ""}
                  onChange={handleTextChange}
                />
              </div>

              {/* Name */}
              <div className="col-md-6">
                <label className="form-label">{t("products.productName")}</label>
                <input
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={handleTextChange}
                />
              </div>

              {/* Category */}
              <div className="col-md-6">
                <label className="form-label d-flex justify-content-between">
                  {t("products.category")}
                  <button
                    type="button"
                    className={`btn btn-outline-${theme} btn-sm rounded-circle p-0`}
                    style={{ width: 24, height: 24 }}
                    onClick={() => setShowModal("category")}
                  >
                    <i className="bi bi-plus-lg" />
                  </button>
                </label>
                <Select
                  options={categories}
                  isLoading={loading}
                  value={categories.find((x) => x.value === form.category) || null}
                  onChange={(opt) => handleSelectChange("category", opt)}
                />
              </div>

              {/* Brand */}
              <div className="col-md-6">
                <label className="form-label d-flex justify-content-between">
                  {t("products.brand")}
                  <button
                    type="button"
                    className={`btn btn-outline-${theme} btn-sm rounded-circle p-0`}
                    style={{ width: 24, height: 24 }}
                    onClick={() => setShowModal("brand")}
                  >
                    <i className="bi bi-plus-lg" />
                  </button>
                </label>
                <Select
                  options={brands}
                  isLoading={loading}
                  value={brands.find((x) => x.value === form.brand) || null}
                  onChange={(opt) => handleSelectChange("brand", opt)}
                />
              </div>

              {/* COST */}
              <div className="col-md-6">
                <label className="form-label">{t("products.costOfCapital")}</label>
                <input
                  className="form-control"
                  name="cost"
                  value={formatCurrencyDots(form.cost)}
                  onChange={handleNumberInput}
                />
              </div>

              {/* PRICE */}
              <div className="col-md-6">
                <label className="form-label">{t("products.sellingPrice")}</label>
                <input
                  className="form-control"
                  name="price"
                  value={formatCurrencyDots(form.price)}
                  onChange={handleNumberInput}
                />
              </div>

              {/* STOCK */}
              <div className="col-md-6">
                <label className="form-label">{t("products.quantityInStock")}</label>
                <input
                  className="form-control"
                  name="stock"
                  value={formatCurrencyDots(form.stock)}
                  onChange={handleNumberInput}
                />
              </div>
            </div>

            {/* BUTTONS */}
            <div className="d-flex justify-content-end mt-4 gap-2">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {t("common.cancel")}
              </button>
              <button type="submit" className={`btn btn-${theme} text-white`}>
                {t("common.save")}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal thêm category / brand */}
      {showModal && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {showModal === "brand" ? t("products.addBrand") : t("products.addCategory")}
                </h5>
                <button className="btn-close" onClick={() => setShowModal(null)} />
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
