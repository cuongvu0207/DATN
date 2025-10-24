import React from "react";
import { useTranslation } from "react-i18next";

export default function ImportHeader({
  theme,
  barcodeMode,
  setBarcodeMode,
  searchValue,
  handleChangeSearch,
  searchResults,
  handleSelectSearchResult,
  setShowImportPopup,
}) {
  const { t } = useTranslation();

  return (
    <div className="d-flex align-items-center justify-content-between mb-3 position-relative">
      <h5 className="fw-bold mb-0">
        {t("import.newImport") || "Tạo phiếu nhập mới"}
      </h5>

      <div className="d-flex align-items-center gap-2">
        {/* Ô tìm kiếm */}
        <div className="input-group" style={{ width: 300 }}>
          <span className="input-group-text bg-white">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control"
            value={searchValue}
            onChange={handleChangeSearch}
            placeholder={t("import.searchProduct") || "Tìm hàng hóa (F3)"}
          />
        </div>

        {/* Nút quét mã */}
        <button
          className={`btn btn-outline-${theme}`}
          onClick={() => setBarcodeMode((p) => !p)}
        >
          <i className="bi bi-upc-scan me-1"></i>
          {barcodeMode
            ? t("import.barcodeMode") || "Đang quét mã"
            : t("import.scan") || "Bắn mã vạch"}
        </button>

        {/* Nút nhập file */}
        <button
          className={`btn btn-outline-${theme}`}
          onClick={() => setShowImportPopup(true)}
        >
          <i className="bi bi-file-earmark-arrow-up me-1"></i>
          {t("import.importFile") || "Nhập từ file"}
        </button>

        {/* Dropdown kết quả tìm kiếm */}
        {searchResults.length > 0 && !barcodeMode && (
          <div
            className="position-absolute bg-white shadow rounded-3 p-2"
            style={{ top: "110%", right: 0, width: 300, zIndex: 1000 }}
          >
            {searchResults.map((p) => (
              <button
                key={p.product_id}
                className="btn btn-light text-start w-100 mb-1"
                onClick={() => handleSelectSearchResult(p)}
              >
                {p.product_name}{" "}
                <span className="text-success fw-semibold">
                  {p.cost_of_capital.toLocaleString()}₫
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
