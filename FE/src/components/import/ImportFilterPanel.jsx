import React from "react";
import { useTranslation } from "react-i18next";

export default function ImportFilterPanel({ filters, onChange }) {
  const { t } = useTranslation();

  const toggleStatus = (status) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onChange({ ...filters, status: newStatus });
  };

  return (
    <div className="border-end px-3 py-3 bg-white" style={{ width: 260, minHeight: "100%" }}>
      <h6 className="fw-bold mb-3">{t("import.filter") || "Bộ lọc"}</h6>

      {/* Trạng thái */}
      <div className="mb-3">
        <label className="fw-medium mb-2">{t("import.status") || "Trạng thái"}</label>
        <div className="form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="chk-temp"
            checked={filters.status.includes("temporary")}
            onChange={() => toggleStatus("temporary")}
          />
          <label htmlFor="chk-temp" className="form-check-label">
            {t("import.temp") || "Phiếu tạm"}
          </label>
        </div>
        <div className="form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="chk-imported"
            checked={filters.status.includes("imported")}
            onChange={() => toggleStatus("imported")}
          />
          <label htmlFor="chk-imported" className="form-check-label">
            {t("import.done") || "Đã nhập hàng"}
          </label>
        </div>
      </div>

      {/* Thời gian */}
      <div className="mb-3">
        <label className="fw-medium mb-2">{t("import.time") || "Thời gian"}</label>
        <select
          className="form-select form-select-sm"
          value={filters.timeRange}
          onChange={(e) => onChange({ ...filters, timeRange: e.target.value })}
        >
          <option value="thisMonth">{t("import.thisMonth") || "Tháng này"}</option>
          <option value="custom">{t("import.custom") || "Tùy chỉnh"}</option>
        </select>
      </div>

      {/* Người tạo */}
      <div className="mb-3">
        <label className="fw-medium mb-2">{t("import.creator") || "Người tạo"}</label>
        <input
          className="form-control form-control-sm"
          placeholder={t("import.selectCreator") || "Chọn người tạo"}
          value={filters.creator}
          onChange={(e) => onChange({ ...filters, creator: e.target.value })}
        />
      </div>

      {/* Người nhập */}
      <div className="mb-3">
        <label className="fw-medium mb-2">{t("import.importer") || "Người nhập"}</label>
        <input
          className="form-control form-control-sm"
          placeholder={t("import.selectImporter") || "Chọn người nhập"}
          value={filters.importer}
          onChange={(e) => onChange({ ...filters, importer: e.target.value })}
        />
      </div>
    </div>
  );
}
