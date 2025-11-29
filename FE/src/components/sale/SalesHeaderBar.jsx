import React, { useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import * as bootstrap from "bootstrap";

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
  onScanProduct,
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  /* === INIT TOOLTIP === */
  useEffect(() => {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map((el) => new bootstrap.Tooltip(el));
  }, []);

  /* === ENTER TO SCAN BARCODE === */
  const handleKeyDown = (e) => {
    if (barcodeMode && e.key === "Enter" && searchQuery.trim()) {
      onScanProduct(searchQuery.trim());
    }
  };

  return (
    <div
      className={`d-flex align-items-center px-3 py-2 bg-${theme} flex-wrap`}
      style={{
        borderBottom: "1px solid rgba(255,255,255,.15)",
        minHeight: 52,
        gap: 8,
      }}
    >
      {/* LEFT SIDE GROUP */}
      <div className="d-flex align-items-center gap-2 flex-grow-1 flex-wrap">

        {/* === SEARCH BOX (RESPONSIVE) === */}
        <div className="position-relative flex-shrink-0">
          <div
            className="d-flex align-items-center bg-white rounded-3 px-2"
            style={{
              width: "clamp(180px, 28vw, 320px)",  // ⭐ tự co giãn
              height: 38,
            }}
          >
            <i className="bi bi-search text-muted me-2" />
            <input
              type="text"
              placeholder={
                barcodeMode ? t("sales.scanBarcode") : t("sales.searchProduct")
              }
              className="form-control border-0 shadow-none bg-transparent"
              style={{ fontSize: 14, minWidth: 0 }}  // tránh vỡ layout
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        {/* === TOGGLE BARCODE SCAN === */}
        <button
          type="button"
          className={`btn ${
            barcodeMode ? `btn-${theme}` : "btn-outline-light"
          } d-flex align-items-center justify-content-center rounded-3`}
          style={{ height: 38, width: 45 }}
          onClick={() => setBarcodeMode(!barcodeMode)}
          data-bs-toggle="tooltip"
          title={t("sales.tooltipBarcode")}
        >
          <i className="bi bi-upc fs-6" />
        </button>

        {/* === TABS (SCROLLABLE) === */}
        {tabs.length > 0 && (
          <div
            className="d-flex align-items-center bg-white rounded-3 px-2 overflow-auto"
            style={{
              height: 38,
              fontSize: 14,
              maxWidth: "40vw", // ⭐ co giãn hợp lý
              whiteSpace: "nowrap",
            }}
          >
            <i
              className={`bi bi-receipt-cutoff text-${theme} me-2`}
              style={{ fontSize: 18 }}
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
                style={{ cursor: "pointer", display: "inline-flex", alignItems: "center" }}
              >
                {tab.name}
                <i
                  className="bi bi-x-lg ms-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTab(tab.id);
                  }}
                  style={{
                    cursor: "pointer",
                    fontSize: 12,
                    color: "#666",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "red")}
                  onMouseLeave={(e) => (e.target.style.color = "#666")}
                />
              </div>
            ))}
          </div>
        )}

        {/* === ADD NEW TAB === */}
        <button
          type="button"
          className="btn btn-outline-light d-flex align-items-center justify-content-center rounded-3"
          style={{ height: 38, width: 38 }}
          onClick={handleAddTab}
          data-bs-toggle="tooltip"
          title={t("sales.tooltipAddInvoice")}
        >
          <i className="bi bi-plus-lg fs-5" />
        </button>

      </div>
    </div>
  );
}
