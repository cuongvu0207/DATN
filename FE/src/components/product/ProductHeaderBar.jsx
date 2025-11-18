import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function ProductHeaderBar({
  query,
  setQuery,
  onAdd,
  onImport,
  onExport,
  onPrint,
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <div className="row align-items-center gy-2 my-">
      <div className="col-12 col-md-3 col-lg-2">
        <h4 className="fw-bold mb-0">{t("products.title")}</h4>
      </div>

      <div className="col-12 col-md-5 col-lg-5">
        <div className="position-relative">
          <i
            className={`bi bi-search position-absolute top-50 start-0 translate-middle-y ps-3 text-${theme}`}
          />
          <input
            type="text"
            className="form-control ps-5"
            style={{
              height: 40,
              paddingLeft: 45,
              border: "1px solid #ced4da",
              boxShadow: "none",
              outline: "none",
            }}
            placeholder={t("products.searchPlaceholder") || "Search by code, name"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="col-12 col-md-4 col-lg-5 d-flex justify-content-end gap-2 flex-wrap">
        <button
          className={`btn btn-${theme} text-white fw-semibold d-flex align-items-center rounded-3 px-3`}
          onClick={onAdd}
        >
          <i className="bi bi-plus-lg"></i>
          <span className="ms-1 d-none d-sm-inline">{t("products.create")}</span>
        </button>
        {onImport && (
          <button
            className={`btn btn-outline-${theme} d-flex align-items-center fw-semibold rounded-3 px-3`}
            onClick={onImport}
          >
            <i className="bi bi-upload" />
            <span className="ms-1 d-none d-md-inline">
              {t("products.importFromFile") || "Nhap tu file"}
            </span>
          </button>
        )}
        <button
          className={`btn btn-outline-${theme} d-flex align-items-center fw-semibold rounded-3 px-3`}
          onClick={onExport}
        >
          <i className="bi bi-download"></i>
          <span className="ms-1 d-none d-md-inline">{t("products.export")}</span>
        </button>
        <button
          className={`btn btn-outline-${theme} d-flex align-items-center fw-semibold rounded-3 px-3`}
          onClick={onPrint}
        >
          <i className="bi bi-upc"></i>
          <span className="ms-1 d-none d-md-inline">{t("products.printBarcode")}</span>
        </button>
      </div>
    </div>
  );
}
