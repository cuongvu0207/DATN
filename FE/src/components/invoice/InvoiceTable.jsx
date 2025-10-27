import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

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
  const totalPages = Math.max(1, Math.ceil(invoices.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentRows = invoices.slice(startIndex, startIndex + rowsPerPage);

  // ✅ Kiểm tra chọn tất cả trong trang hiện tại
  const allChecked =
    currentRows.length > 0 &&
    currentRows.every((inv) => selectedInvoices.includes(inv.id));

  return (
    <div className="col-lg-10 col-12">
      <div className={`table-responsive rounded-2 border border-${theme} shadow-sm`}>
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
                  <td>{inv.total.toLocaleString()} ₫</td>
                  <td>{inv.discount.toLocaleString()} ₫</td>
                  <td>{inv.paymentMethod}</td>
                  <td>
                    <span
                      className={`badge ${
                        inv.status === "Đã thanh toán"
                          ? "bg-success"
                          : inv.status === "Chưa thanh toán"
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
                  {t("invoices.noData") || "Không có dữ liệu"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination control */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        {/* Số dòng hiển thị */}
        <div className="d-flex align-items-center gap-2">
          <span>{t("invoices.show") || "Hiển thị"}</span>
          <select
            className="form-select form-select-sm"
            style={{ width: 130 }}
            value={rowsPerPage >= invoices.length ? "all" : rowsPerPage}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "all") setRowsPerPage(invoices.length);
              else setRowsPerPage(Number(val));
              setCurrentPage(1);
            }}
          >
            {[15, 20, 30, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} {t("invoices.rows") || "dòng"}
              </option>
            ))}
            <option value="all">{t("invoices.all") || "Tất cả"}</option>
          </select>
        </div>

        {/* Phân trang */}
        <div className="btn-group">
          <button
            className={`btn btn-outline-${theme}`}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            &lt;
          </button>
          <span className={`btn btn-${theme} text-white fw-bold`}>
            {currentPage}
          </span>
          <button
            className={`btn btn-outline-${theme}`}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
