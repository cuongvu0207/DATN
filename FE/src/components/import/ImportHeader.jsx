import React from "react";
import { useTranslation } from "react-i18next";

export default function ImportHeader({ theme, setShowImportPopup }) {
  const { t } = useTranslation();

  // 🎨 Style nút cơ bản
  const baseButtonStyle = {
    backgroundColor: "#fff",
    border: `2px solid var(--bs-${theme})`,
    color: `var(--bs-${theme})`,
    transition: "all 0.25s ease",
  };

  // 🎨 Hiệu ứng hover
  const applyHover = (e) => {
    e.currentTarget.style.backgroundColor = `var(--bs-${theme})`;
    e.currentTarget.style.color = "#fff";
    e.currentTarget.style.boxShadow = `0 0 8px rgba(var(--bs-${theme}-rgb), 0.45)`;
  };

  const removeHover = (e) => {
    e.currentTarget.style.backgroundColor = "#fff";
    e.currentTarget.style.color = `var(--bs-${theme})`;
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
      {/* --- Tiêu đề bên trái --- */}
      <h5 className="fw-bold mb-0">
        {t("import.newImport") || "Tạo phiếu nhập mới"}
      </h5>

      {/* --- Nút nhập file bên phải --- */}
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <button
          className="btn"
          onClick={() => setShowImportPopup(true)}
          style={baseButtonStyle}
          onMouseEnter={applyHover}
          onMouseLeave={removeHover}
        >
          <i className="bi bi-file-earmark-arrow-up me-1"></i>
          {t("import.importFile") || "Nhập từ file"}
        </button>
      </div>
    </div>
  );
}
