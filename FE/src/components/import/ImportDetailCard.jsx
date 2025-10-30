import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function ImportDetailCard({ data, onClose }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [showItems, setShowItems] = useState(true); //  có thể ẩn/hiện phần hàng hóa

  if (!data) return null;

  return (
    <div
      className="position-fixed top-0 end-0 h-100 bg-white shadow-lg border-start"
      style={{
        width: 460,
        zIndex: 1050,
        animation: "slideInRight 0.4s ease",
      }}
    >
      {/* --- Header --- */}
      <div
        className={`d-flex justify-content-between align-items-center border-bottom px-3 py-3 bg-${theme} bg-opacity-10`}
      >
        <h5 className="fw-bold mb-0">
          <i className="bi bi-receipt-cutoff me-2 text-primary"></i>
          {t("import.detailCardTitle") || "Chi tiết phiếu nhập"}
        </h5>
        <button className="btn btn-outline-danger btn-sm" onClick={onClose}>
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      {/* --- Body --- */}
      <div className="p-3 overflow-auto" style={{ height: "calc(100% - 60px)" }}>
        {/* --- Thông tin chung --- */}
        <div className="mb-3">
          <label className="fw-semibold text-muted">{t("import.code") || "Mã phiếu"}</label>
          <div>{data.code}</div>
        </div>

        <div className="mb-3">
          <label className="fw-semibold text-muted">{t("import.supplier") || "Nhà cung cấp"}</label>
          <div>{data.supplier}</div>
        </div>

        <div className="mb-3">
          <label className="fw-semibold text-muted">{t("import.importer") || "Người nhập"}</label>
          <div>{data.importer}</div>
        </div>

        <div className="mb-3">
          <label className="fw-semibold text-muted">{t("import.status") || "Trạng thái"}</label>
          <div>
            <span
              className={`badge px-3 py-2 fw-semibold ${
                data.status === "Đã nhập hàng"
                  ? "bg-success-subtle text-success border border-success"
                  : "bg-warning-subtle text-warning border border-warning"
              }`}
            >
              {data.status}
            </span>
          </div>
        </div>

        <div className="mb-3">
          <label className="fw-semibold text-muted">{t("import.total") || "Tổng tiền"}</label>
          <div className="text-success fw-bold">{data.total?.toLocaleString()} ₫</div>
        </div>

        <div className="mb-3">
          <label className="fw-semibold text-muted">{t("import.date") || "Ngày tạo"}</label>
          <div>{new Date(data.createdAt).toLocaleDateString("vi-VN")}</div>
        </div>

        {/* --- Ghi chú --- */}
        {data.note && (
          <div className="mb-3">
            <label className="fw-semibold text-muted">{t("import.note") || "Ghi chú"}</label>
            <textarea
              className="form-control"
              defaultValue={data.note}
              disabled
              rows="2"
            ></textarea>
          </div>
        )}

        {/* --- DANH SÁCH HÀNG HÓA --- */}
        <div className="border-top pt-3 mt-3">
          <div
            className="d-flex justify-content-between align-items-center mb-2"
            onClick={() => setShowItems((p) => !p)}
            style={{ cursor: "pointer" }}
          >
            <h6 className="fw-bold mb-0">
              <i className="bi bi-box-seam me-2 text-primary"></i>
              {t("import.items") || "Chi tiết hàng hóa"}
            </h6>
            <i
              className={`bi ${
                showItems ? "bi-chevron-up" : "bi-chevron-down"
              } text-secondary`}
            ></i>
          </div>

          {showItems && (
            <div className="table-responsive">
              <table className="table table-sm table-bordered align-middle text-center mb-0">
                <thead className={`table-${theme}`}>
                  <tr>
                    <th>{t("import.index") || "#"}</th>
                    <th>{t("import.productName") || "Tên hàng"}</th>
                    <th>{t("import.quantity") || "SL"}</th>
                    <th>{t("import.importPrice") || "Giá nhập"}</th>
                    <th>{t("import.subtotal") || "Thành tiền"}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items?.length > 0 ? (
                    data.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td className="text-start">{item.product_name}</td>
                        <td>{item.quantity}</td>
                        <td>{item.importPrice?.toLocaleString()} ₫</td>
                        <td className="text-success fw-semibold">
                          {(item.quantity * item.importPrice)?.toLocaleString()} ₫
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-muted py-3">
                        {t("import.noItems") || "Không có hàng hóa trong phiếu."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- Hiệu ứng --- */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
