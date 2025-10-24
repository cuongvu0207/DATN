import React from "react";
import { useTranslation } from "react-i18next";

export default function ImportTableList({ data = [] }) {
  const { t } = useTranslation();

  return (
    <div className="card shadow-sm">
      <table className="table table-hover mb-0 align-middle">
        <thead className="table-light">
          <tr>
            <th style={{ width: 40 }}>
              <input type="checkbox" />
            </th>
            <th>{t("import.code") || "Mã nhập hàng"}</th>
            <th>{t("import.time") || "Thời gian"}</th>
            <th>{t("import.supplierCode") || "Mã NCC"}</th>
            <th>{t("import.supplier") || "Nhà cung cấp"}</th>
            <th className="text-end">{t("import.debt") || "Cần trả NCC"}</th>
            <th className="text-center">{t("import.status") || "Trạng thái"}</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center text-muted py-3">
                {t("import.noData") || "Không có dữ liệu"}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <input type="checkbox" />
                </td>
                <td className="fw-medium">{row.id}</td>
                <td>{row.time}</td>
                <td>{row.supplierCode}</td>
                <td>{row.supplier}</td>
                <td className="text-end">{row.total.toLocaleString()}</td>
                <td className="text-center">
                  <span
                    className={`badge px-2 py-1 ${
                      row.status === "Đã nhập hàng"
                        ? "bg-success-subtle text-success border border-success"
                        : "bg-warning-subtle text-warning border border-warning"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* --- Phân trang giả lập --- */}
      <div className="d-flex justify-content-between align-items-center p-2 border-top small text-muted">
        <span>
          Hiển thị {data.length} dòng
        </span>
        <span>1–{data.length} trong {data.length} giao dịch</span>
      </div>
    </div>
  );
}
