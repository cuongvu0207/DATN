import React, { useState, useEffect } from "react";
import Select from "react-select";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import CategoryAddCard from "../product/CategoryAddCard";
import BrandAddCard from "../product/BrandAddCard";
import { API_BASE_URL } from "../../services/api";

export default function EditProductDetailCard({ product, onClose, onSave }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const token = localStorage.getItem("accessToken");

  const [form, setForm] = useState({ ...product });
  const [preview, setPreview] = useState(product.image || "");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [showModal, setShowModal] = useState(null); // "category" | "brand" | null
  const [loading, setLoading] = useState(false);

  // 🔹 Lấy dữ liệu từ BE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, brandRes] = await Promise.all([
          fetch(`${API_BASE_URL}/inventory/category`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/inventory/brand`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (!catRes.ok || !brandRes.ok)
          throw new Error("Không thể tải danh mục hoặc thương hiệu");

        const catData = await catRes.json();
        const brandData = await brandRes.json();

        // Map dữ liệu từ BE -> react-select { value, label }
        setCategories(
          catData.map((item) => ({
            value: item.categoryName,
            label: item.categoryName,
          }))
        );
        setBrands(
          brandData.map((item) => ({
            value: item.brandName,
            label: item.brandName,
          }))
        );
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // 🔹 Xử lý input text
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Xử lý chọn trong Select
  const handleSelectChange = (type, option) => {
    setForm((prev) => ({ ...prev, [type]: option?.value || "" }));
  };

  // 🔹 Xử lý ảnh
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
      setForm((prev) => ({ ...prev, imageFile: file }));
    }
  };

  // 🔹 Lưu sản phẩm
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  // 🔹 Callback khi thêm danh mục / thương hiệu mới
  const handleCategoryAdded = (data) => {
    if (data?.categoryName) {
      const val = { value: data.categoryName, label: data.categoryName };
      if (!categories.find((c) => c.value === val.value)) {
        setCategories((prev) => [...prev, val]);
        setForm((prev) => ({ ...prev, category: val.value }));
      }
    }
    setShowModal(null);
  };

  const handleBrandAdded = (data) => {
    if (data?.brandName) {
      const val = { value: data.brandName, label: data.brandName };
      if (!brands.find((b) => b.value === val.value)) {
        setBrands((prev) => [...prev, val]);
        setForm((prev) => ({ ...prev, brand: val.value }));
      }
    }
    setShowModal(null);
  };

  return (
    <>
      <div
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center"
        style={{ zIndex: 1050 }}
      >
        <div
          className="bg-white rounded-4 shadow-lg p-4"
          style={{ width: "90%", maxWidth: "950px", maxHeight: "90%", overflowY: "auto" }}
        >
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className={`fw-bold text-${theme} m-0`}>
              {t("products.editProduct") || "Sửa hàng hóa"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          {/* Ảnh */}
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

          {/* Form nội dung */}
          <form onSubmit={handleSubmit}>
            <div className="p-3 mb-4">
              <div className="row g-3">
                {/* ID sản phẩm */}
                <div className="col-md-6">
                  <label className="form-label">{t("products.productId")}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.id}
                    disabled
                    placeholder={t("products.auto")}
                  />
                </div>

                {/* Mã vạch */}
                <div className="col-md-6">
                  <label className="form-label">{t("products.barcode")}</label>
                  <input
                    type="text"
                    name="barcode"
                    className="form-control"
                    value={form.barcode || ""}
                    onChange={handleChange}
                    placeholder={t("products.enterBarcode")}
                  />
                </div>

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
                  <Select
                    isLoading={loading}
                    options={categories}
                    value={categories.find((opt) => opt.value === form.category) || null}
                    onChange={(opt) => handleSelectChange("category", opt)}
                    placeholder={t("products.selectCategory")}
                    isSearchable
                  />
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
                  <Select
                    isLoading={loading}
                    options={brands}
                    value={brands.find((opt) => opt.value === form.brand) || null}
                    onChange={(opt) => handleSelectChange("brand", opt)}
                    placeholder={t("products.selectBrand")}
                    isSearchable
                  />
                </div>

                {/* Giá và tồn kho */}
                <div className="col-md-6">
                  <label className="form-label">{t("products.costOfCapital")}</label>
                  <input
                    type="number"
                    name="cost"
                    className="form-control"
                    value={form.cost}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t("products.sellingPrice")}</label>
                  <input
                    type="number"
                    name="price"
                    className="form-control"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t("products.quantityInStock")}</label>
                  <input
                    type="number"
                    name="stock"
                    className="form-control"
                    value={form.stock}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button type="button" className="btn btn-secondary px-4" onClick={onClose}>
                {t("common.cancel")}
              </button>
              <button type="submit" className={`btn btn-${theme} text-white px-4`}>
                {t("common.save")}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* === Modal thêm danh mục / thương hiệu === */}
      {showModal && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title">
                  {showModal === "brand"
                    ? t("products.addBrand")
                    : t("products.addCategory")}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(null)}
                ></button>
              </div>
              <div className="modal-body">
                {showModal === "brand" ? (
                  <BrandAddCard onSave={handleBrandAdded} onCancel={() => setShowModal(null)} />
                ) : (
                  <CategoryAddCard
                    onSave={handleCategoryAdded}
                    onCancel={() => setShowModal(null)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
