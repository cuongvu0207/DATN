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

  const handleRowsChange = (event) => {
    onRowsPerPageChange && onRowsPerPageChange(event.target.value);
  };

  const handlePrev = () => {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={`d-flex justify-content-between align-items-center mt-3 ${className}`}>
      <div className="d-flex align-items-center gap-2">
        <span>{t("common.show") || "Hien thi"}</span>
        <select
          className="form-select form-select-sm"
          style={{ width: 150 }}
          value={selectValue}
          onChange={handleRowsChange}
        >
          {rowsPerPageOptions.map((option) => (
            <option key={option} value={option}>
              {option} {t("common.rows") || "dong"}
            </option>
          ))}
          {showAllOption && <option value="all">{t("common.all") || "Tat ca"}</option>}
        </select>
      </div>

      <div className="btn-group align-items-stretch">
        <button
          className={`btn btn-outline-${theme}`}
          disabled={currentPage <= 1}
          onClick={handlePrev}
        >
          &lt;
        </button>
        <span className={`btn btn-${theme} text-white fw-bold`} style={{ minWidth: 80 }}>
          {currentPage}/{totalPages}
        </span>
        <button
          className={`btn btn-outline-${theme}`}
          disabled={currentPage >= totalPages}
          onClick={handleNext}
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
