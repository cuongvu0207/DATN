import React from "react";
import { formatCurrency } from "../../utils/formatters";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

export default function ProductDetailCard({ product, onEdit, onToggleActive }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  if (!product) return null;

  const handleEdit = () => {
    onEdit?.(product);
  };

  const isActive = product?.statusBoolean === true;

  const fmtDate = (v) => {
    if (!v) return "-";
    if (typeof v === "string") {
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? v : d.toLocaleString("vi-VN");
    }
    if (v instanceof Date) {
      return Number.isNaN(v.getTime()) ? "-" : v.toLocaleString("vi-VN");
    }
    if (typeof v === "number") {
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString("vi-VN");
    }
    return String(v);
  };

  return (
    <div
      className="rounded p-3 mb-3"
      style={{
        backgroundColor: "var(--bs-light)",
        transition: "0.3s ease",
      }}
    >
      <div className="w-100 p-3 d-flex align-items-start" style={{ border: "none" }}>
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

        <div className="flex-grow-1 ms-3">
          <h5 className="fw-bold mb-1">{product.name}</h5>

          <p className="text-muted small mb-2">
            {t("products.barcode")}: {product.barcode || "-"}
          </p>

          <div className="row g-2 small">
            <div className="col-md-4">
              <span className="text-muted">{t("products.brand")}: </span>
              <span className="fw-semibold">{product.brand || "-"}</span>
            </div>

            <div className="col-md-4">
              <span className="text-muted">{t("products.sellingPrice")}: </span>
              <span className="fw-semibold">{formatCurrency(product.price)}</span>
            </div>

            <div className="col-md-4">
              <span className="text-muted">{t("products.costOfCapital")}: </span>
              <span className="fw-semibold">{formatCurrency(product.cost)}</span>
            </div>

            <div className="col-md-4">
              <span className="text-muted">{t("products.quantityInStock")}: </span>
              <span className="fw-semibold">{product.stock ?? "-"}</span>
            </div>

            <div className="col-md-4">
              <span className="text-muted">{t("products.minimumStock")}: </span>
              <span className="fw-semibold">{product.minimumStock ?? "-"}</span>
            </div>

            <div className="col-md-4">
              <span className="text-muted">{t("products.createdAt")}: </span>
              <span className="fw-semibold">{fmtDate(product.createdAt)}</span>
            </div>

            <div className="col-md-4">
              <span className="text-muted">{t("products.category")}: </span>
              <span className="fw-semibold">{product.category || "-"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-3">
        <button
          onClick={handleEdit}
          className={`btn btn-${theme} text-white d-flex align-items-center gap-1`}
          title={t("products.editProduct")}
          type="button"
        >
          <i className="bi bi-pencil-square"></i>
          <span>{t("common.edit")}</span>
        </button>

        <button
          onClick={() => onToggleActive?.(product)}
          className={`btn ${isActive ? "btn-danger" : "btn-success"} text-white d-flex align-items-center gap-1`}
          title={isActive ? t("products.deactivate") : t("products.activate")}
          type="button"
        >
          <i className={`bi ${isActive ? "bi-toggle-on" : "bi-toggle-off"}`}></i>
          <span>{isActive ? t("products.deactivate") : t("products.activate")}</span>
        </button>
      </div>
    </div>
  );
}
