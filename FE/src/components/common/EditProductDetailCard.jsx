import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

export default function EditProductDetailCard({ product, onClose, onSave }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [form, setForm] = useState({ ...product });
  const [preview, setPreview] = useState(product.image);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

  const validateForm = () => {
    const newErrors = {};

    if (!form.name?.trim()) newErrors.name = t("validation.name_required");
    if (!form.brand?.trim()) newErrors.brand = t("validation.brand_required");
    if (!form.category?.trim()) newErrors.category = t("validation.category_required");
    if (!form.supplier?.trim()) newErrors.supplier = t("validation.supplier_required");

    if (form.cost === "" || form.cost == null)
      newErrors.cost = t("validation.cost_required");
    else if (Number(form.cost) < 0)
      newErrors.cost = t("validation.positive");

    if (form.price === "" || form.price == null)
      newErrors.price = t("validation.price_required");
    else if (Number(form.price) < 0)
      newErrors.price = t("validation.positive");
    else if (Number(form.price) < Number(form.cost))
      newErrors.price = t("validation.price_less_than_cost");

    if (form.stock === "" || form.stock == null)
      newErrors.stock = t("validation.stock_required");
    else if (Number(form.stock) < 0)
      newErrors.stock = t("validation.positive");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSave(form);
    onClose();
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center"
      style={{ zIndex: 1050 }}
    >
      <div
        className={`bg-white border border-${theme} border-3 rounded-4 shadow-lg p-4`}
        style={{ width: "90%", maxWidth: "1100px", height: "90%", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className={`fw-bold text-${theme} m-0`}>
            {t("products.editProduct") || "Sửa hàng hoá"}
          </h5>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>

        {/* Nội dung form */}
        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            {/* Cột trái - ảnh sản phẩm */}
            <div className="col-lg-4 col-md-5 text-center">
              <div className={`border border-${theme} rounded-4 p-3 bg-light`}>
                <img
                  src={preview || "https://via.placeholder.com/280x280?text=No+Image"}
                  alt="preview"
                  className="img-fluid rounded mb-3"
                  style={{ objectFit: "cover", maxHeight: "250px" }}
                />
                <label className={`btn btn-outline-${theme} btn-sm`}>
                  <i className="bi bi-upload me-1"></i>
                  {t("products.changeImage") || "Chọn ảnh"}
                  <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                </label>
              </div>
            </div>

            {/* Cột phải - thông tin sản phẩm */}
            <div className="col-lg-8 col-md-7">
              {/* Mã hàng & Tên hàng */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">{t("products.productId")}</label>
                  <input type="text" className="form-control" value={form.id} disabled />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t("products.productName")}</label>
                  <input
                    type="text"
                    name="name"
                    className={`form-control ${errors.name ? "is-invalid" : ""}`}
                    value={form.name}
                    onChange={handleChange}
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>
              </div>

              {/* Danh mục & Thương hiệu */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">{t("products.category")}</label>
                  <input
                    type="text"
                    name="category"
                    className={`form-control ${errors.category ? "is-invalid" : ""}`}
                    value={form.category}
                    onChange={handleChange}
                  />
                  {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t("products.brand")}</label>
                  <input
                    type="text"
                    name="brand"
                    className={`form-control ${errors.brand ? "is-invalid" : ""}`}
                    value={form.brand}
                    onChange={handleChange}
                  />
                  {errors.brand && <div className="invalid-feedback">{errors.brand}</div>}
                </div>
              </div>

              {/* Giá vốn & Giá bán */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">{t("products.costOfCapital")}</label>
                  <input
                    type="number"
                    name="cost"
                    className={`form-control ${errors.cost ? "is-invalid" : ""}`}
                    value={form.cost}
                    onChange={handleChange}
                  />
                  {errors.cost && <div className="invalid-feedback">{errors.cost}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t("products.sellingPrice")}</label>
                  <input
                    type="number"
                    name="price"
                    className={`form-control ${errors.price ? "is-invalid" : ""}`}
                    value={form.price}
                    onChange={handleChange}
                  />
                  {errors.price && <div className="invalid-feedback">{errors.price}</div>}
                </div>
              </div>

              {/* Tồn kho */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">{t("products.quantityInStock")}</label>
                  <input
                    type="number"
                    name="stock"
                    className={`form-control ${errors.stock ? "is-invalid" : ""}`}
                    value={form.stock}
                    onChange={handleChange}
                  />
                  {errors.stock && <div className="invalid-feedback">{errors.stock}</div>}
                </div>
              </div>

              {/* Nhà cung cấp */}
              <div className="mb-3">
                <label className="form-label">{t("products.supplier")}</label>
                <input
                  type="text"
                  name="supplier"
                  className={`form-control ${errors.supplier ? "is-invalid" : ""}`}
                  value={form.supplier}
                  onChange={handleChange}
                />
                {errors.supplier && <div className="invalid-feedback">{errors.supplier}</div>}
              </div>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="button" className="btn btn-secondary px-4" onClick={onClose}>
              {t("common.cancel") || "Bỏ qua"}
            </button>
            <button type="submit" className={`btn btn-${theme} text-white px-4`}>
              {t("common.save") || "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
