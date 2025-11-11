import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function SalesHeaderBar({
  tabs,
  activeTab,
  setActiveTab,
  handleAddTab,
  handleRemoveTab,
  searchQuery,
  setSearchQuery,
  barcodeMode,
  setBarcodeMode,
  onScanProduct, // 🔹 thêm prop mới
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const handleKeyDown = (e) => {
    if (barcodeMode && e.key === "Enter" && searchQuery.trim()) {
      onScanProduct(searchQuery.trim());
    }
  };

  return (
    <div
      className={`d-flex align-items-center justify-content-between px-3 py-2 bg-${theme}`}
      style={{ borderBottom: "1px solid rgba(255,255,255,.15)", minHeight: 52 }}
    >
      <div className="d-flex align-items-center gap-2 flex-grow-1">
        {/* Ô tìm kiếm */}
        <div className="position-relative">
          <div
            className="d-flex align-items-center bg-white rounded-3 px-2"
            style={{ width: 320, height: 38 }}
          >
            <i className="bi bi-search text-muted me-2" />
            <input
              type="text"
              placeholder={
                barcodeMode
                  ? t("sales.scanBarcode") || "Quét mã sản phẩm..."
                  : t("sales.searchProduct") || "Tìm hàng hoá (F3)"
              }
              className="form-control border-0 shadow-none bg-transparent"
              style={{ fontSize: 14 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown} // 🔹 thêm vào đây
            />
          </div>
        </div>

        {/* Bật/tắt barcode */}
        <button
          type="button"
          className={`btn ${
            barcodeMode ? `btn-${theme}` : "btn-outline-light"
          } d-flex align-items-center justify-content-center rounded-3`}
          style={{ height: 38, width: 45 }}
          title={t("sales.barcodeMode")}
          onClick={() => setBarcodeMode(!barcodeMode)}
        >
          <i className="bi bi-upc fs-6 fs-6" />
        </button>

        {/* Tabs hoá đơn */}
        <div
          className="d-flex align-items-center bg-white rounded-3 ps-2"
          style={{ minHeight: 38, fontSize: 14 }}
        >
          <i
            className="bi bi-arrow-left-right text-success me-1"
            style={{ fontSize: 16 }}
          />
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded-3 me-1 ${
                activeTab === tab.id
                  ? "bg-light text-dark fw-semibold"
                  : "text-secondary"
              }`}
              style={{ cursor: "pointer" }}
            >
              {tab.name || `${t("sales.tabPrefix") || "Order"} ${tab.id}`}
              {tabs.length > 1 && (
                <i
                  className="bi bi-x ms-2 text-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTab(tab.id);
                  }}
                  style={{ cursor: "pointer", fontSize: 13 }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Thêm tab */}
        <button
          type="button"
          className="btn btn-outline-light d-flex align-items-center justify-content-center rounded-3"
          style={{ height: 38, width: 38 }}
          onClick={handleAddTab}
          title={t("sales.addInvoice")}
        >
          <i className="bi bi-plus-lg fs-5" />
        </button>
      </div>
    </div>
  );
}
