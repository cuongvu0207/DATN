import React from "react";
import { useTranslation } from "react-i18next";
import Select from "react-select";
import { useTheme } from "../../context/ThemeContext";

export default function InvoiceFilterPanel({ filters, onChange, sellerList }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const ALL_OPTION = { value: "all", label: t("common.all") };

  const statusOptions = [
    ALL_OPTION,
    { value: "PENDING", label: t("invoices.pending", "Chờ thanh toán") }, // gộp PENDING + DRAFT
    { value: "COMPLETED", label: t("invoices.completed", "Hoàn thành") },
  ];

  const getStatusLabel = (status) => {
    const s = String(status || "").trim().toUpperCase();
    if (s === "PENDING" || s === "DRAFT") return t("invoices.pending", "Chờ thanh toán");
    if (s === "COMPLETED") return t("invoices.completed", "Hoàn thành");
    return t("common.all");
  };

  const getPaymentLabel = (method) => {
    const m = String(method || "").trim().toUpperCase();
    switch (m) {
      case "CASH":
        return t("invoices.cash", "Tiền mặt");
      case "BANK":
      case "TRANSFER":
      case "BANK_TRANSFER":
        return t("invoices.bank", "Chuyển khoản");
      case "WALLET":
      case "E_WALLET":
        return t("invoices.wallet", "Ví điện tử");
      default:
        return t("invoices.other", "Khác");
    }
  };

  return (
    <aside className="col-lg-2 d-none d-lg-block">
      <div className="card shadow-sm border-0 h-100">
        <div className="card-body">
          <div className="mb-4">
            <label className="form-label fw-medium mb-2">
              {t("invoices.status")}
            </label>

            <Select
              value={
                filters.status
                  ? { value: filters.status, label: getStatusLabel(filters.status) }
                  : ALL_OPTION
              }
              onChange={(opt) =>
                onChange("status", opt && opt.value !== "all" ? opt.value : "")
              }
              options={statusOptions}
              isSearchable
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-medium mb-2">
              {t("invoices.paymentMethod")}
            </label>

            <Select
              value={
                filters.paymentMethod
                  ? {
                      value: filters.paymentMethod,
                      label: getPaymentLabel(filters.paymentMethod),
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
                { value: "CASH", label: t("invoices.cash", "Tiền mặt") },
                { value: "BANK", label: t("invoices.bank", "Chuyển khoản") },
                { value: "WALLET", label: t("invoices.wallet", "Ví điện tử") },
              ]}
              isSearchable
            />
          </div>

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
              options={[ALL_OPTION, ...sellerList]}
              placeholder={t("invoices.selectSeller")}
              isSearchable
            />
          </div>

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
