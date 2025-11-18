import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { API_BASE_URL } from "../../services/api";
import CategoryAddCard from "../product/CategoryAddCard";
import BrandAddCard from "../product/BrandAddCard";

export default function AddProductCard({ onCancel, onSave }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const token = localStorage.getItem("accessToken");

  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    brandId: "",
    unit: "Cái",
    cost: 0,
    price: 0,
    stock: 0,
    barcode: "",
    imageFile: null,
  });

  const [preview, setPreview] = useState(null);
  const [localCategories, setLocalCategories] = useState([]);
  const [localBrands, setLocalBrands] = useState([]);
  const [showModal, setShowModal] = useState(null); // "category" | "brand"

  /* =====================================================
     🔹 GỌI API DANH MỤC & THƯƠNG HIỆU
     ===================================================== */
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

        // ✅ Chuẩn hóa dữ liệu trả về
        const normalizedCats = (catRes.data || []).map((c, i) => ({
          categoryId: String(c.categoryId || c.id || i),
          categoryName: c.categoryName || c.name || c,
        }));

        const normalizedBrands = (brandRes.data || []).map((b, i) => ({
          brandId: String(b.brandId || b.id || i),
          brandName: b.brandName || b.name || b,
        }));

        setLocalCategories(normalizedCats);
        setLocalBrands(normalizedBrands);

        console.log("✅ Category list:", normalizedCats);
        console.log("✅ Brand list:", normalizedBrands);
      } catch (err) {
        console.error("❌ Lỗi tải danh mục/thương hiệu:", err);
      }
    };

    fetchData();
  }, [token]);

  /* =====================================================
     🔹 XỬ LÝ FORM
     ===================================================== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["price", "cost", "stock"].includes(name)) {
      const num = Number(value);
      if (num < 0) return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* =====================================================
     🔹 CALLBACK SAU KHI THÊM DANH MỤC / THƯƠNG HIỆU
     ===================================================== */
  const handleCategoryAdded = (data) => {
    // Normalize payload from API
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

  /* =====================================================
     🔹 XỬ LÝ ẢNH
     ===================================================== */
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({ ...prev, imageFile: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  /* =====================================================
     🔹 GỬI FORM
     ===================================================== */
  const generateBarcode = () =>
    "SP" + Math.floor(100000000000 + Math.random() * 900000000000);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim()) return alert(t("products.enterProductName"));
    if (!form.categoryId || !form.brandId)
      return alert(t("products.chooseCategoryBrand"));

    const newProduct = {
      ...form,
      barcode: form.barcode || generateBarcode(),
      id: "SPNEW" + Math.floor(Math.random() * 1000),
      createdAt: new Date().toLocaleDateString("vi-VN"),
    };

    onSave(newProduct);
  };

  /* =====================================================
     🔹 RENDER GIAO DIỆN
     ===================================================== */
  return (
    <>
      <div
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center"
        style={{ zIndex: 1050 }}
        onClick={onCancel}
      >
        <div
          className="bg-white rounded-4 shadow-lg p-4"
          style={{ width: "90%", maxWidth: "950px", maxHeight: "90%", overflowY: "auto" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className={`fw-bold text-${theme} m-0`}>
              {t("products.addProduct") || "Thêm hàng hóa"}
            </h5>
            <button type="button" className="btn-close" onClick={onCancel}></button>
          </div>

          {/* Ảnh sản phẩm */}
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
                {t("products.chooseImage") || "Chọn ảnh"}
                <input type="file" accept="image/*" hidden onChange={handleImageChange} />
              </label>
            </div>
          </div>

          {/* Form nội dung */}
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Tên sản phẩm */}
              <div className="col-md-6">
                <label className="form-label">{t("products.productName")}</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={t("products.enterProductName")}
                  required
                />
              </div>

              {/* Mã vạch */}
              <div className="col-md-6">
                <label className="form-label">{t("products.barcode")}</label>
                <input
                  type="text"
                  name="barcode"
                  className="form-control"
                  value={form.barcode}
                  onChange={handleChange}
                  placeholder={t("products.enterBarcode")}
                />
              </div>

              {/* Danh mục */}
              <div className="col-md-6">
                <label className="form-label d-flex justify-content-between align-items-center">
                  <span>{t("products.category")}</span>
                  <button
                    type="button"
                    className={`btn btn-outline-${theme} btn-sm rounded-circle p-0`}
                    style={{ width: 24, height: 24 }}
                    onClick={() => setShowModal("category")}
                  >
                    <i className="bi bi-plus-lg" style={{ fontSize: 11 }}></i>
                  </button>
                </label>
                <select
                  name="categoryId"
                  className="form-select"
                  value={form.categoryId}
                  onChange={handleChange}
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

              {/* Thương hiệu */}
              <div className="col-md-6">
                <label className="form-label d-flex justify-content-between align-items-center">
                  <span>{t("products.brand")}</span>
                  <button
                    type="button"
                    className={`btn btn-outline-${theme} btn-sm rounded-circle p-0`}
                    style={{ width: 24, height: 24 }}
                    onClick={() => setShowModal("brand")}
                  >
                    <i className="bi bi-plus-lg" style={{ fontSize: 11 }}></i>
                  </button>
                </label>
                <select
                  name="brandId"
                  className="form-select"
                  value={form.brandId}
                  onChange={handleChange}
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

              {/* Đơn vị */}
              <div className="col-md-6">
                <label className="form-label">{t("products.unit")}</label>
                <input
                  type="text"
                  name="unit"
                  className="form-control"
                  value={form.unit}
                  onChange={handleChange}
                  placeholder={t("products.placeholder.unit") || "Nhập đơn vị (vd: Cái)"}
                  required
                />
              </div>

              {/* Giá vốn / Giá bán / Tồn kho */}
              <div className="col-md-4">
                <label className="form-label">{t("products.costOfCapital")}</label>
                <input
                  type="number"
                  name="cost"
                  className="form-control"
                  value={form.cost}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">{t("products.sellingPrice")}</label>
                <input
                  type="number"
                  name="price"
                  className="form-control"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">{t("products.quantityInStock")}</label>
                <input
                  type="number"
                  name="stock"
                  className="form-control"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Buttons */}
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

      {/* Modal thêm danh mục / thương hiệu */}
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
