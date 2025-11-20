import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function InvoiceHeaderBar({
  query,
  setQuery,
  onExport,
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <div className="row align-items-center gy-2 mb-2">

      {/* ===== Tiêu đề ===== */}
      <div className="col-12 col-md-3 col-lg-2">
        <h4 className="fw-bold mb-0">{t("invoices.title")}</h4>
      </div>

      {/* ===== Thanh tìm kiếm ===== */}
      <div className="col-12 col-md-5 col-lg-5">
        <div className="position-relative">
          <i
            className={`bi bi-search position-absolute top-50 start-0 translate-middle-y ps-3 text-${theme}`}
          />
          <input
            type="text"
            className={`form-control ps-5 border-theme`}
            style={{
              height: 40,
              paddingLeft: 45,
              boxShadow: "none",
              outline: "none",
            }}
            placeholder={t("invoices.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ===== Nút chức năng ===== */}
      <div className="col-12 col-md-4 col-lg-5 d-flex justify-content-end gap-2 flex-wrap">
        <button
          className={`btn btn-outline-${theme} d-flex align-items-center fw-semibold rounded-3 px-3`}
          onClick={onExport}
        >
          <i className="bi bi-download"></i>
          <span className="ms-1 d-none d-md-inline">
            {t("invoices.export")}
          </span>
        </button>
      </div>
    </div>
  );
}
