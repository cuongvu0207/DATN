import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function ConfirmImportDialog({
  show,
  supplierName,
  itemCount,
  totalAmount,
  onConfirm,
  onCancel,
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  if (!show) return null;

  // === FORMAT TIỀN THEO ĐÚNG VALIDATE DỰ ÁN ===
  const formatCurrency = (value) => {
    if (value == null) return "0";

    return String(value)
      .replace(/\D/g, "")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 420,
          background: theme === "dark" ? "#1f1f1f" : "#ffffff",
          color: theme === "dark" ? "#fff" : "#333",
          borderRadius: 12,
          padding: 22,
          animation: "fadeIn .2s ease",
        }}
      >
        <h4 className="mb-3">{t("import.confirm.title")}</h4>

        <div style={{ fontSize: 15, lineHeight: "1.5" }}>
          {/* ⭐ Câu hiển thị chính */}
          <p>
            {t("import.confirm.message1")}{" "}
            <b style={{ color: "#0d6efd" }}>
              {supplierName || t("import.confirm.noSupplier")}
            </b>
            ?
          </p>

          {/* Chi tiết thêm */}
          <p className="mt-3">
            <b>{t("import.confirm.itemCount")}:</b> {itemCount}{" "}
            {t("import.confirm.items")}
          </p>

          <p>
            <b>{t("import.confirm.totalAmount")}:</b>{" "}
            <span style={{ color: "#198754", fontWeight: 600 }}>
              {formatCurrency(totalAmount)} đ
            </span>
          </p>
        </div>

        <div className="d-flex justify-content-end gap-2 mt-4">
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>
            {t("import.confirm.cancel")}
          </button>

          <button className="btn btn-success btn-sm" onClick={onConfirm}>
            {t("import.confirm.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
