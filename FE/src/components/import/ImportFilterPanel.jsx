import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import SupplierAddCard from "./SupplierAddCard"; // 🔹 import form thêm NCC

export default function ImportFilterPanel({ filters, onChange }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [showAddSupplier, setShowAddSupplier] = useState(false); // Trạng thái mở modal

  const toggleStatus = (status) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onChange({ ...filters, status: newStatus });
  };

  return (
    <div
      className="border-end px-3 py-3 bg-white"
      style={{ width: 260, minHeight: "100%" }}
    >
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

      {/* 🔹 Nhà cung cấp + nút Thêm */}
      <div className="mb-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <label className="fw-medium mb-0">
            {t("supplier.title") || "Nhà cung cấp"}
          </label>
          <button
            type="button"
            className={`btn btn-outline-${theme} btn-sm d-flex align-items-center`}
            onClick={() => setShowAddSupplier(true)}
            title={t("supplier.addTitle") || "Thêm nhà cung cấp"}
          >
            <i className="bi bi-plus-lg"></i>
          </button>
        </div>
        <input
          className="form-control form-control-sm"
          placeholder={t("supplier.selectSupplier") || "Chọn nhà cung cấp"}
          value={filters.supplier}
          onChange={(e) => onChange({ ...filters, supplier: e.target.value })}
        />
      </div>

      {/* 🔹 Modal Thêm Nhà Cung Cấp */}
      {showAddSupplier && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div
                className={`modal-header bg-${theme} text-white py-2 px-3 d-flex justify-content-between align-items-center`}
              >
                <h6 className="modal-title m-0">
                  <i className="bi bi-building-add me-2"></i>
                  {t("supplier.addTitle") || "Thêm nhà cung cấp mới"}
                </h6>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAddSupplier(false)}
                ></button>
              </div>
              <div className="modal-body">
                <SupplierAddCard
                  onSave={(data) => {
                    console.log("✅ Đã thêm NCC:", data);
                    setShowAddSupplier(false);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
