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
  onSelectAll
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // --- Pagination ---
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentRows = invoices.slice(startIndex, startIndex + rowsPerPage);
  const rowsSelectValue = rowsPerPage > 100 ? "all" : rowsPerPage;

  // ? Ki?m tra ch?n t?t c? trong trang hi?n t?i
  const allChecked =
    currentRows.length > 0 &&
    currentRows.every((inv) => selectedInvoices.includes(inv.id));
  const outerScrollStyle = {
    borderRadius: 16,
    overflow: "hidden",
    paddingRight: 8,
    paddingBottom: 8,
    backgroundColor: "#fff",
  };
  const innerScrollStyle = {
    maxHeight: "60vh",
    overflowX: "auto",
    overflowY: "auto",
    borderRadius: 12,
  };

  const handleRowsPerPageChange = (value) => {
    const nextValue = value === "all" ? Number.MAX_SAFE_INTEGER : Number(value);
    setRowsPerPage(nextValue);
    setCurrentPage(1);
  };

  return (
    <div className="col-lg-10 col-12">
      <div className={`table-responsive rounded-3 shadow-sm`} style={outerScrollStyle}>
        <div style={innerScrollStyle}>
          <table className="table table-hover align-middle mb-0">
            <thead className={`table-${theme}`} style={{ position: "sticky", top: 0, zIndex: 2 }}>
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
              <th>{t("invoices.discount")}</th>
              <th>{t("invoices.paymentMethod")}</th>
              <th>{t("invoices.status")}</th>
              <th>{t("invoices.seller")}</th>
              <th>{t("invoices.createdAt")}</th>
            </tr>
          </thead>

          <tbody>
            {currentRows.length > 0 ? (
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
                  <td>{formatCurrency(inv.discount)}</td>
                  <td>{inv.paymentMethod}</td>
                  <td>
                    <span
                      className={`badge ${
                        inv.status === "?? thanh to?n"
                          ? "bg-success"
                          : inv.status === "Chua thanh to?n"
                          ? "bg-warning text-dark"
                          : "bg-secondary"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td>{inv.seller}</td>
                  <td>{inv.createdAt}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="text-center text-muted py-4">
                  {t("invoices.noData") || "Kh?ng c? d? li?u"}
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
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </div>
  );
}





