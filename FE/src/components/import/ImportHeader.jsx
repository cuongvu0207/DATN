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
  onAddProductClick,
}) {
  const { t } = useTranslation();

  // 🎨 Style nút cơ bản
  const baseButtonStyle = {
    backgroundColor: "#fff",
    border: `2px solid var(--bs-${theme})`,
    color: `var(--bs-${theme})`,
    transition: "all 0.25s ease",
  };

  // 🎨 Style khi hover hoặc active
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
    <div className="d-flex align-items-center justify-content-between mb-3 position-relative flex-wrap gap-2">
      {/* --- Cụm trái: tiêu đề + thanh tìm kiếm --- */}
      <div className="d-flex align-items-center gap-3 flex-wrap">
        <h5 className="fw-bold mb-0">
          {t("import.newImport") || "Tạo phiếu nhập mới"}
        </h5>

        {/* Thanh tìm kiếm */}
        <div className="input-group" style={{ width: 360 }}>
          <span className="input-group-text bg-white border-end-0">
            <i className="bi bi-search"></i>
          </span>

          <input
            type="text"
            className={`form-control border-start-0 border-end-0 ${
              barcodeMode ? `border-${theme}` : ""
            }`}
            value={searchValue}
            onChange={handleChangeSearch}
            placeholder={
              barcodeMode
                ? t("import.scanPlaceholder") || "Quét mã vạch..."
                : t("import.searchProduct") || "Tìm hàng hóa (F3)"
            }
          />

          {/* Nút quét mã */}
          <button
            className={`btn`}
            type="button"
            onClick={() => setBarcodeMode((p) => !p)}
            title={
              barcodeMode
                ? t("import.barcodeModeOn") || "Đang bật chế độ quét mã"
                : t("import.barcodeModeOff") || "Chuyển sang chế độ quét mã"
            }
            style={{
              ...baseButtonStyle,
              backgroundColor: barcodeMode ? `var(--bs-${theme})` : "#fff",
              color: barcodeMode ? "#fff" : `var(--bs-${theme})`,
            }}
            onMouseEnter={applyHover}
            onMouseLeave={removeHover}
          >
            <i className="bi bi-upc-scan"></i>
          </button>
        </div>
      </div>

      {/* --- Cụm phải: các nút thao tác --- */}
      <div className="d-flex align-items-center gap-2 flex-wrap">
        {/* Nút tạo mới sản phẩm */}
        <button
          className="btn"
          onClick={onAddProductClick}
          style={baseButtonStyle}
          onMouseEnter={applyHover}
          onMouseLeave={removeHover}
        >
          <i className="bi bi-plus-circle me-1"></i>
          {t("import.addProduct") || "Tạo mới hàng hóa"}
        </button>

        {/* Nút nhập file */}
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

      {/* --- Dropdown kết quả tìm kiếm --- */}
      {searchResults.length > 0 && !barcodeMode && (
        <div
          className="position-absolute bg-white shadow rounded-3 p-2"
          style={{ top: "100%", left: 200, width: 360, zIndex: 1000 }}
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
  );
}
