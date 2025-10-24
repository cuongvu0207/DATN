import React from "react";
import { useTranslation } from "react-i18next";

export default function ImportFileModal({ theme, handleImportFile, onClose }) {
  const { t } = useTranslation();

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{ background: "rgba(0,0,0,0.4)", zIndex: 1050 }}
    >
      <div className="bg-white rounded-4 shadow-lg p-4" style={{ width: "600px" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">
            <i className="bi bi-file-earmark-arrow-up me-2"></i>{" "}
            {t("import.importFile") || "Nhập dữ liệu từ file"}
          </h5>
          <button className="btn btn-outline-danger btn-sm" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <p className="text-muted small mb-1">📘 {t("import.fileFormat") || "Định dạng:"}</p>
        <pre className="bg-light p-2 rounded small mb-3">
          Mã hàng, Tên hàng, ĐVT, Số lượng, Giá nhập, Giảm giá
        </pre>

        <input
          type="file"
          accept=".csv, .xlsx, .xls"
          className="form-control mb-3"
          onChange={handleImportFile}
        />

        <div className="text-end">
          <button className={`btn btn-${theme} text-white`} onClick={onClose}>
            <i className="bi bi-check2 me-1"></i> {t("import.done") || "Hoàn tất"}
          </button>
        </div>
      </div>
    </div>
  );
}
