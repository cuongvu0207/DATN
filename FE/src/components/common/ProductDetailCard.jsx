import React from "react";
import { formatCurrency } from "../../utils/formatters";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

export default function ProductDetailCard({ product, onDelete, onEdit }) {
  const { t } = useTranslation();
  const { theme } = useTheme(); // theme = primary | success | warning | etc.

  if (!product) return null;

  const handleDelete = () => {
    if (window.confirm("Bạn có chắc muốn xoá sản phẩm này?")) {
      onDelete?.(product.id);
    }
  };

  const handleEdit = () => {
    onEdit?.(product);
  };

  return (
    <div
      className={`border border-${theme} rounded p-3 mb-3`}
      style={{
        backgroundColor: "var(--bs-light)",
        transition: "0.3s ease",
      }}
    >
      {/* Phần nội dung chính */}
      <div className="w-100 p-3 d-flex align-items-start" style={{ border: "none" }}>
        {/* Ảnh sản phẩm */}
        <img
          src={product.image || "https://via.placeholder.com/120"}
          alt={product.name}
          style={{
            width: 100,
            height: 100,
            objectFit: "cover",
            borderRadius: "6px",
          }}
        />

        {/* Thông tin chi tiết */}
        <div className="flex-grow-1 ms-3">
          <h5 className="fw-bold mb-1">{product.name}</h5>
          <p className="text-muted small mb-2">
            {t("products.productId")}: {product.id}
          </p>

          <div className="row g-2 small">
            <div className="col-md-4">
              <span className="text-muted">{t("products.brand")}: </span>
              <span className="fw-semibold">{product.brand}</span>
            </div>
            <div className="col-md-4">
              <span className="text-muted">{t("products.sellingPrice")}: </span>
              <span className="fw-semibold">
                {formatCurrency(product.price)}
              </span>
            </div>
            <div className="col-md-4">
              <span className="text-muted">{t("products.costOfCapital")}: </span>
              <span className="fw-semibold">
                {formatCurrency(product.cost)}
              </span>
            </div>
            <div className="col-md-4">
              <span className="text-muted">{t("products.quantityInStock")}: </span>
              <span className="fw-semibold">{product.stock}</span>
            </div>
            <div className="col-md-4">
              <span className="text-muted">{t("products.createdAt")}: </span>
              <span className="fw-semibold">{product.createdAt}</span>
            </div>
            <div className="col-md-4">
              <span className="text-muted">{t("products.category")}: </span>
              <span className="fw-semibold">{product.category}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🧭 Nút hành động (nằm dưới, canh phải) */}
      <div className="d-flex justify-content-end gap-2 mt-3">
        <button
          onClick={handleEdit}
          className={`btn btn-${theme} text-white d-flex align-items-center gap-1`}
          title="Chỉnh sửa sản phẩm"
        >
          <i className="bi bi-pencil-square"></i>
          <span>{t("common.edit") || "Chỉnh sửa"}</span>
        </button>

        <button
          onClick={handleDelete}
          className="btn btn-danger text-white d-flex align-items-center gap-1"
          title="Xoá sản phẩm"
        >
          <i className="bi bi-trash"></i>
          <span>{t("common.delete") || "Xoá"}</span>
        </button>
      </div>
    </div>
  );
}
