import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function ProductHeaderBar({
  query,
  setQuery,
  onAdd,
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
        <div
          className={`input-group border border-${theme} rounded-3 align-items-center`}
          style={{ height: 40 }}
        >
          <span
            className={`input-group-text bg-white border-0 text-${theme}`}
            style={{ borderRight: `1px solid var(--bs-${theme})`, height: "100%" }}
          >
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control border-0 shadow-none"
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
