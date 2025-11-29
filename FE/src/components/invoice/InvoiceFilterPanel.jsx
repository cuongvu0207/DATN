import React from "react";
import { useTranslation } from "react-i18next";
import Select from "react-select";
import { useTheme } from "../../context/ThemeContext";

export default function InvoiceFilterPanel({ filters, onChange, sellerList }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const ALL_OPTION = { value: "all", label: t("common.all") };

  return (
    <aside className="col-lg-2 d-none d-lg-block">
      <div className="card shadow-sm border-0 h-100">
        <div className="card-body">

          {/* ===== Trạng thái ===== */}
          <div className="mb-4">
            <label className="form-label fw-medium mb-2">
              {t("invoices.status")}
            </label>

            <Select
              value={
                filters.status
                  ? {
                      value: filters.status,
                      label:
                        filters.status === "COMPLETED"
                          ? t("invoices.completed")
                          : filters.status === "PENDING"
                          ? t("invoices.pending")
                          : t("invoices.cancelled"),
                    }
                  : ALL_OPTION
              }
              onChange={(opt) =>
                onChange("status", opt && opt.value !== "all" ? opt.value : "")
              }
              options={[
                ALL_OPTION,
                { value: "COMPLETED", label: t("invoices.completed") },
                { value: "PENDING", label: t("invoices.pending") },
                { value: "CANCELLED", label: t("invoices.cancelled") },
              ]}
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
                  ? {
                      value: filters.paymentMethod,
                      label:
                        filters.paymentMethod === "CASH"
                          ? t("invoices.cash")
                          : filters.paymentMethod === "BANK"
                          ? t("invoices.bank")
                          : filters.paymentMethod === "WALLET"
                          ? t("invoices.wallet")
                          : t("invoices.other"),
                    }
                  : ALL_OPTION
              }
              onChange={(opt) =>
                onChange(
                  "paymentMethod",
                  opt && opt.value !== "all" ? opt.value : ""
                )
              }
              options={[
                ALL_OPTION,
                { value: "CASH", label: t("invoices.cash") },
                { value: "BANK", label: t("invoices.bank") },
                { value: "WALLET", label: t("invoices.wallet") },
              ]}
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
                  ? sellerList.find((s) => s.value === filters.seller)
                  : ALL_OPTION
              }
              onChange={(opt) =>
                onChange("seller", opt && opt.value !== "all" ? opt.value : "")
              }
              options={[
                ALL_OPTION,
                ...sellerList, // ❗ CHỈ sellerList, không chứa "all"
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
