import React from "react";
import { formatCurrency } from "../../utils/formatters";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import TablePagination from "../common/TablePagination";

export default function InvoiceTable({
  invoices,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setRowsPerPage,
  selectedInvoices,
  onSelectOne,
  onSelectAll,
  loading, // 👈 THÊM loading
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentRows = invoices.slice(startIndex, startIndex + rowsPerPage);
  const rowsSelectValue = rowsPerPage > 100 ? "all" : rowsPerPage;

  const allChecked =
    currentRows.length > 0 &&
    currentRows.every((inv) => selectedInvoices.includes(inv.id));

  const mapPaymentMethod = (method) => {
    switch (method) {
      case "CASH":
        return t("payment.cash", "Tiền mặt");
      case "BANK":
        return t("payment.bank", "Chuyển khoản");
      case "WALLET":
        return t("payment.wallet", "Ví điện tử");
      default:
        return t("payment.other", "Khác");
    }
  };

  const mapStatus = (status) => {
    switch (status) {
      case "COMPLETED":
        return t("invoices.completed", "Đã thanh toán");
      case "PENDING":
        return t("invoices.pending", "Chưa thanh toán");
      default:
        return status;
    }
  };

  const statusBadgeClass = (status) => {
    if (status === "COMPLETED")
      return "bg-success-subtle text-success border border-success";
    if (status === "PENDING")
      return "bg-warning-subtle text-warning border border-warning";
    return "bg-secondary-subtle text-dark";
  };

  return (
    <div className="col-lg-10 col-12">
      <div className="table-responsive rounded-3 shadow-sm">
        <div style={{ maxHeight: "60vh", overflowX: "auto", overflowY: "auto" }}>
          <table className="table table-hover align-middle mb-0">
            <thead className={`table-${theme}`}>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={allChecked}
                    onChange={(e) => onSelectAll(e.target.checked, currentRows)}
                  />
                </th>
                <th>{t("invoices.invoiceId")}</th>
                <th>{t("invoices.customer")}</th>
                <th>{t("invoices.phone")}</th>
                <th>{t("invoices.total")}</th>
                <th>{t("invoices.paymentMethod")}</th>
                <th>{t("invoices.status")}</th>
                <th>{t("invoices.seller")}</th>
                <th>{t("invoices.createdAt")}</th>
              </tr>
            </thead>

            <tbody>
              {/* ============================
                   LOADING (HIỆN TRONG BẢNG)
                 ============================ */}
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-4">
                    <div className="spinner-border text-primary"></div>
                    <div className="mt-2 text-muted">{t("common.loading")}</div>
                  </td>
                </tr>
              ) : currentRows.length > 0 ? (
                currentRows.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedInvoices.includes(inv.id)}
                        onChange={() => onSelectOne(inv.id)}
                      />
                    </td>

                    <td>{inv.id}</td>
                    <td>{inv.customer}</td>
                    <td>{inv.phone}</td>
                    <td>{formatCurrency(inv.total)}</td>
                    <td>{mapPaymentMethod(inv.paymentMethod)}</td>

                    <td>
                      <span className={`badge ${statusBadgeClass(inv.status)}`}>
                        {mapStatus(inv.status)}
                      </span>
                    </td>

                    <td>{inv.seller}</td>
                    <td>{inv.createdAt}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="text-center text-muted py-4">
                    {t("invoices.noData")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalItems={invoices.length}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[15, 30, 50, 100]}
        rowsPerPageValue={rowsSelectValue}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(value) => {
          const next = value === "all" ? Number.MAX_SAFE_INTEGER : Number(value);
          setRowsPerPage(next);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
