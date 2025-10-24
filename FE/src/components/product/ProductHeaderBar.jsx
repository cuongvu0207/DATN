import React from "react";
import SearchBar from "../common/SearchBar";
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
    <div className="row align-items-center gy-2 mb-2">
      <div className="col-12 col-md-3 col-lg-2">
        <h4 className="fw-bold mb-0">{t("products.title")}</h4>
      </div>

      <div className="col-12 col-md-5 col-lg-5">
        <SearchBar
          value={query}
          onChange={setQuery}
          onModeChange={(mode) => console.log("Search mode:", mode)}
        />
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
