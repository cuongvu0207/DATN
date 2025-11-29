import React from "react";
import { formatCurrency } from "../../utils/formatters";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

// Helper functions (đưa ra ngoài để tránh re-render không cần thiết)
const getStatusBadge = (status) => {
  switch (status) {
    case "COMPLETED":
      return "bg-success-subtle text-success border border-success";
    case "DRAFT":
    case "PENDING":
      return "bg-warning-subtle text-warning border border-warning";
    case "CANCELLED":
      return "bg-danger-subtle text-danger border border-danger";
    default:
      return "bg-secondary-subtle text-dark";
  }
};

export default function ImportTableList({
  data = [],
  selected = [],
  onSelectOne,
  onSelectAll,
  onExpand,
  expandedRow,
  loading = false, // Thêm prop loading
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // Logic map label trạng thái
  const getStatusLabel = (status) => {
    switch (status) {
      case "COMPLETED":
        return t("import.completed", "Hoàn tất");
      case "DRAFT":
      case "PENDING":
        return t("import.draft", "Phiếu tạm");
      case "CANCELLED":
        return t("import.cancelled", "Đã hủy");
      default:
        return status;
    }
  };

  const allChecked =
    data.length > 0 && data.every((row) => selected.includes(row.id));

  return (
    <div className="col-12">
      {/* Wrapper tạo khung viền, bo góc và bóng đổ giống InvoiceTable */}
      <div className="table-responsive rounded-3 shadow-sm border">
        <div style={{ maxHeight: "60vh", overflowX: "auto", overflowY: "auto" }}>
          <table className="table table-hover align-middle mb-0">
            {/* Header dính (Sticky) */}
            <thead
              className={`table-${theme}`}
              style={{ position: "sticky", top: 0, zIndex: 10 }}
            >
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={allChecked}
                    onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                  />
                </th>
                <th style={{ minWidth: "120px" }}>{t("import.code", "Mã phiếu")}</th>
                <th>{t("import.date", "Ngày tạo")}</th>
                <th>{t("import.supplier", "Nhà cung cấp")}</th>
                <th>{t("import.employee", "Người nhập")}</th>
                <th className="text-end">{t("import.total", "Tổng tiền")}</th>
                <th className="text-center">{t("import.status", "Trạng thái")}</th>
                <th style={{ width: 50 }}></th> {/* Cột cho icon mũi tên */}
              </tr>
            </thead>

            <tbody>
              {/* === LOADING STATE === */}
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-5">
                    <div className="spinner-border text-primary mb-2"></div>
                    <div className="text-muted small">{t("common.loading", "Đang tải dữ liệu...")}</div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                /* === EMPTY STATE === */
                <tr>
                  <td colSpan={8} className="text-center text-muted py-5">

                    {t("import.noData", "Không có dữ liệu nhập hàng")}
                  </td>
                </tr>
              ) : (
                /* === DATA MAPPING === */
                data.map((row) => {
                  const isExpanded = expandedRow === row.id;
                  const isSelected = selected.includes(row.id);

                  return (
                    <React.Fragment key={row.id}>
                      {/* Dòng chính */}
                      <tr
                        className={isExpanded ? "table-active" : ""}
                        style={{ cursor: "pointer" }}
                        onClick={() => onExpand && onExpand(row.id)}
                      >
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()} // Chặn sự kiện để không bị xổ dòng khi tick
                            onChange={() => onSelectOne && onSelectOne(row.id)}
                          />
                        </td>
                        <td className="fw-medium text-primary">
                          PN-{row.id.toString().padStart(5, "0")}
                        </td>
                        <td>{new Date(row.createdAt).toLocaleDateString("vi-VN")}</td>
                        <td>{row.supplier || "—"}</td>
                        <td>{row.employee || "—"}</td>
                        <td className="text-end fw-bold">
                          {formatCurrency(Number(row?.total ?? 0))}
                        </td>
                        <td className="text-center">
                          <span className={`badge px-2 py-1 fw-semibold ${getStatusBadge(row.status)}`}>
                            {getStatusLabel(row.status)}
                          </span>
                        </td>
                        <td className="text-center text-muted">
                          <i className={`bi ${isExpanded ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
                        </td>
                      </tr>

                      {/* Dòng chi tiết (Expanded) */}

                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="p-0 border-bottom">
                            <div className="bg-light p-3 border-top shadow-inner">
                              <div className="d-flex align-items-center mb-2">
                                <i className="bi bi-box-seam text-primary me-2"></i>
                                <strong className="text-dark small text-uppercase">
                                  {t("import.details", "Danh sách sản phẩm")}
                                </strong>
                              </div>

                              {/* ===== BẢNG CHI TIẾT ĐÃ SỬA ===== */}
                              <div className="bg-white rounded overflow-hidden">
                                <table className="table table-sm mb-0 small detail-table">
                                  <thead>
                                    <tr>
                                      <th className="text-center" style={{ width: 40 }}>#</th>
                                      <th>{t("products.barcode")}</th>
                                      <th>{t("products.name")}</th>
                                      <th className="text-center">{t("products.unit")}</th>
                                      <th className="text-end">{t("products.quantity")}</th>
                                      <th className="text-end">{t("products.price")}</th>
                                      <th className="text-end">{t("products.subtotal")}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {row.details?.map((d, i) => (
                                      <tr key={i}>
                                        <td className="text-center text-muted">{i + 1}</td>
                                        <td>{d.barcode}</td>
                                        <td className="fw-medium text-dark">{d.productName}</td>
                                        <td className="text-center">{d.unit}</td>
                                        <td className="text-end">{d.quantity}</td>
                                        <td className="text-end text-muted">{formatCurrency(d.price)}</td>
                                        <td className="text-end fw-semibold text-dark">
                                          {formatCurrency(d.subtotal)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}