import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

export default function EditProductDetailCard({ product, onClose, onSave }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [form, setForm] = useState({ ...product });
  const [preview, setPreview] = useState(product.image || "");

  const [categories, setCategories] = useState(["Danh mục A", "Danh mục B"]);
  const [brands, setBrands] = useState(["Thương hiệu 1", "Thương hiệu 2"]);
  const [suppliers, setSuppliers] = useState(["Nhà cung cấp A", "Nhà cung cấp B"]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOption = (type) => {
    const labelMap = {
      Category: t("products.enterNewCategory") || "Nhập danh mục mới:",
      Brand: t("products.enterNewBrand") || "Nhập thương hiệu mới:",
      Supplier: t("products.enterNewSupplier") || "Nhập nhà cung cấp mới:",
    };

    const newValue = prompt(labelMap[type]);
    if (newValue && newValue.trim()) {
      if (type === "Category" && !categories.includes(newValue))
        setCategories([...categories, newValue]);
      if (type === "Brand" && !brands.includes(newValue)) setBrands([...brands, newValue]);
      if (type === "Supplier" && !suppliers.includes(newValue))
        setSuppliers([...suppliers, newValue]);

      setForm((prev) => ({
        ...prev,
        [type.toLowerCase()]: newValue.trim(),
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
      setForm((prev) => ({ ...prev, imageFile: file }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
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
            <small className="text-muted d-block mt-1">{t("products.imageLimit")}</small>
          </div>
        </div>

        {/* Form nội dung */}
        <form onSubmit={handleSubmit}>
          {/* --- THÔNG TIN SP + GIÁ --- */}
          <div className="p-3 mb-4">
            <div className="row g-3">
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
                    onClick={() => handleAddOption("Category")}
                  >
                    <i className="bi bi-plus-lg" style={{ fontSize: 11 }}></i>
                  </button>
                </label>
                <select
                  name="category"
                  className="form-select"
                  value={form.category}
                  onChange={handleChange}
                >
                  <option value="">{t("products.selectCategory")}</option>
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
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
                    onClick={() => handleAddOption("Brand")}
                  >
                    <i className="bi bi-plus-lg" style={{ fontSize: 11 }}></i>
                  </button>
                </label>
                <select
                  name="brand"
                  className="form-select"
                  value={form.brand}
                  onChange={handleChange}
                >
                  <option value="">{t("products.selectBrand")}</option>
                  {brands.map((b, idx) => (
                    <option key={idx} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nhà cung cấp */}
              <div className="col-md-6">
                <label className="form-label d-flex justify-content-between align-items-center">
                  <span>{t("products.supplier")}</span>
                  <button
                    type="button"
                    className={`btn btn-outline-${theme} btn-sm rounded-circle p-0`}
                    style={{ width: 24, height: 24 }}
                    onClick={() => handleAddOption("Supplier")}
                  >
                    <i className="bi bi-plus-lg" style={{ fontSize: 11 }}></i>
                  </button>
                </label>
                <select
                  name="supplier"
                  className="form-select"
                  value={form.supplier}
                  onChange={handleChange}
                >
                  <option value="">{t("products.selectSupplier")}</option>
                  {suppliers.map((s, idx) => (
                    <option key={idx} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
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
  );
}
