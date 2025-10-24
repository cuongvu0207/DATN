import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

/**
 * 🔍 SearchBar — Thanh tìm kiếm hỗ trợ 2 chế độ:
 * - Nhập thủ công (manual)
 * - Quét mã (scan: có thể là mã vạch, mã hàng, QR, SKU, ...)
 */
export default function SearchBar({
  value,
  onChange,
  onModeChange,
  className = "",
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [mode, setMode] = useState("manual"); // manual | scan

  const toggleMode = () => {
    const next = mode === "manual" ? "scan" : "manual";
    setMode(next);
    if (onModeChange) onModeChange(next);
  };

  return (
    <div
      className={`d-flex align-items-center border border-${theme} rounded-3 bg-white ${className}`}
      style={{ height: 42, overflow: "hidden" }}
    >
      {/* Icon tìm kiếm */}
      <span
        className="px-2 d-flex align-items-center justify-content-center"
        style={{ fontSize: 18, color: `var(--bs-${theme})` }}
      >
        <i className="bi bi-search"></i>
      </span>

      {/* Ô nhập liệu */}
      <input
        type="text"
        className="form-control border-0 shadow-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          mode === "manual"
            ? t("import.searchProduct") // ví dụ: "Tìm sản phẩm, mã hàng..."
            : t("import.scanPlaceholder") // ví dụ: "Nhập hoặc quét mã sản phẩm (mã vạch / mã hàng)..."
        }
        style={{ fontSize: 14 }}
      />

      {/* Nút chuyển chế độ */}
      <button
        type="button"
        onClick={toggleMode}
        className={`btn border-0 border-start border-${theme} rounded-0 d-flex align-items-center justify-content-center`}
        style={{
          width: 44,
          height: "100%",
          borderLeft: `1px solid var(--bs-${theme})`,
          backgroundColor:
            mode === "scan"
              ? `rgba(var(--bs-${theme}-rgb), 0.15)` // Nền nhẹ khi bật
              : "transparent",
          transition: "all 0.2s ease",
        }}
        title={
          mode === "manual"
            ? t("import.switchToScan")
            : t("import.switchToManual")
        }
      >
        <i
          className={`bi bi-upc ${
            mode === "scan" ? `fw-bold text-${theme}` : "text-muted"
          }`}
          style={{
            fontSize: 18,
            transform: mode === "scan" ? "scale(1.05)" : "none",
            transition: "all 0.2s ease",
          }}
        ></i>
      </button>
    </div>
  );
}
