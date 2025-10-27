import React from "react";
import { useTranslation } from "react-i18next";
import Select from "react-select";
import { useTheme } from "../../context/ThemeContext";

export default function InvoiceFilterPanel({ filters, onChange }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <aside className="col-lg-2 d-none d-lg-block">
      <div className="card shadow-sm border-0 h-100">
        <div className="card-body">
          <h6 className="fw-bold mb-4">{t("invoices.filterTitle")}</h6>

          {/* ===== Trạng thái ===== */}
          <div className="mb-4">
            <label className="form-label fw-medium mb-2">
              {t("invoices.status")}
            </label>
            <Select
              value={
                filters.status
                  ? { value: filters.status, label: filters.status }
                  : null
              }
              onChange={(opt) =>
                onChange("status", opt ? opt.value : "")
              }
              options={[
                { value: "Đã thanh toán", label: "Đã thanh toán" },
                { value: "Chưa thanh toán", label: "Chưa thanh toán" },
                { value: "Đã hủy", label: "Đã hủy" },
              ]}
              placeholder={t("invoices.selectStatus")}
              isSearchable
            />
          </div>

          {/* ===== Phương thức thanh toán ===== */}
          <div className="mb-4">
            <label className="form-label fw-medium mb-2">
              {t("invoices.paymentMethod")}
            </label>
            <Select
              value={
                filters.paymentMethod
                  ? { value: filters.paymentMethod, label: filters.paymentMethod }
                  : null
              }
              onChange={(opt) =>
                onChange("paymentMethod", opt ? opt.value : "")
              }
              options={[
                { value: "Tiền mặt", label: "Tiền mặt" },
                { value: "Chuyển khoản", label: "Chuyển khoản" },
                { value: "Thẻ", label: "Thẻ" },
              ]}
              placeholder={t("invoices.selectPayment")}
              isSearchable
            />
          </div>

          {/* ===== Nhân viên bán ===== */}
          <div className="mb-4">
            <label className="form-label fw-medium mb-2">
              {t("invoices.seller")}
            </label>
            <Select
              value={
                filters.seller
                  ? { value: filters.seller, label: filters.seller }
                  : null
              }
              onChange={(opt) =>
                onChange("seller", opt ? opt.value : "")
              }
              options={[
                { value: "Nhân viên A", label: "Nhân viên A" },
                { value: "Nhân viên B", label: "Nhân viên B" },
                { value: "Nhân viên C", label: "Nhân viên C" },
              ]}
              placeholder={t("invoices.selectSeller")}
              isSearchable
            />
          </div>

          {/* ===== Ngày tạo ===== */}
          <div className="mb-4">
            <label className="form-label fw-medium mb-2">
              {t("invoices.createdAt")}
            </label>
            <input
              type="date"
              className={`form-control form-control-sm border-${theme} shadow-sm`}
              value={filters.createdAt || ""}
              onChange={(e) => onChange("createdAt", e.target.value)}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
