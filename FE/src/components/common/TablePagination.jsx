import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function TablePagination({
  currentPage = 1,
  totalItems = 0,
  rowsPerPage = 15,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [15, 30, 50, 100],
  rowsPerPageValue,
  showAllOption = true,
  className = "",
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const sanitizedRowsPerPage = rowsPerPage || 1;
  const totalPages = Math.max(1, Math.ceil(totalItems / sanitizedRowsPerPage));
  const selectValue = rowsPerPageValue ?? rowsPerPage;

  return (
    <div className={`d-flex justify-content-between align-items-center mt-3 ${className}`}>
      {/* LEFT */}
      <div className="d-flex align-items-center gap-2">
        <span>{t("common.show", "Hiển thị")}</span>

        <select
          className="form-select form-select-sm"
          style={{ width: 150 }}
          value={selectValue}
          onChange={(e) => onRowsPerPageChange(e.target.value)}
        >
          {rowsPerPageOptions.map((option) => (
            <option key={option} value={option}>
              {option} {t("common.rows", "hàng")}
            </option>
          ))}

          {showAllOption && (
            <option value="all">{t("common.all", "Tất cả")}</option>
          )}
        </select>
      </div>

      {/* RIGHT */}
      <div className="d-flex align-items-center gap-3">
        <button
          className={`btn text-${theme} border-0 shadow-none`}
          style={{ fontSize: 28, lineHeight: 1 }}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          &lsaquo;
        </button>

        <span
          className={`fw-bold text-${theme}`}
          style={{ minWidth: 80, textAlign: "center" }}
        >
          {currentPage}/{totalPages}
        </span>

        <button
          className={`btn text-${theme} border-0 shadow-none`}
          style={{ fontSize: 28, lineHeight: 1 }}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          &rsaquo;
        </button>
      </div>
    </div>
  );
}
