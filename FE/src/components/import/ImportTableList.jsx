import React from "react";
import { formatCurrency } from "../../utils/formatters";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

export default function ImportTableList({
  data = [],
  selected = [],
  onSelectOne,
  onSelectAll,
  onExpand, // callback khi click dòng để xổ chi tiết
  expandedRow,
  emptyMessage = "",
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const allChecked =
    data.length > 0 && data.every((row) => selected.includes(row.id));

  return (
    <div className="card shadow-sm">
      <table className="table table-hover mb-0 align-middle">
        <thead className={`table-${theme}`} style={{ position: "sticky", top: 0, zIndex: 2 }}>
          <tr>
            <th style={{ width: 40 }}>
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
              />
            </th>
            <th>{t("import.code") || "Mã nhập hàng"}</th>
            <th>{t("import.date") || "Ngày tạo"}</th>
            <th>{t("import.supplier") || "Nhà cung cấp"}</th>
            <th>{t("import.employee") || "Người nhập"}</th>
            <th className="text-end">{t("import.total") || "Tổng tiền"}</th>
            <th className="text-center">{t("import.status") || "Trạng thái"}</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center text-muted py-3">
                {emptyMessage || t("import.noData") || "Không có dữ liệu"}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <React.Fragment key={row.id}>
                <tr
                  className={expandedRow === row.id ? "table-active" : ""}
                  style={{ cursor: "pointer" }}
                  onClick={() => onExpand && onExpand(row.id)}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(row.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => onSelectOne && onSelectOne(row.id)}
                    />
                  </td>
                  <td>
                    <i
                      className={`bi me-2 ${
                        expandedRow === row.id
                          ? "bi-caret-down-fill"
                          : "bi-caret-right-fill"
                      }`}
                    ></i>
                    PN-{row.id.toString().padStart(5, "0")}
                  </td>
                  <td>{new Date(row.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td>{row.supplier || "—"}</td>
                  <td>{row.employee || "—"}</td>
                  <td className="text-end">
                    {formatCurrency(Number(row?.total ?? 0))}
                  </td>

                  <td className="text-center">
                    <span
                      className={`badge px-2 py-1 fw-semibold ${
                        row.status === "COMPLETED"
                          ? "bg-success-subtle text-success border border-success"
                          : "bg-warning-subtle text-warning border border-warning"
                      }`}
                    >
                      {row.status === "COMPLETED"
                        ? t("import.completed") || "Hoàn tất"
                        : t("import.draft") || "Phiếu tạm"}
                    </span>

                  </td>
                </tr>

                {/* Khi xổ chi tiết */}
                {expandedRow === row.id && (
                  <tr className="bg-light">
                    <td colSpan="7">
                      <div className="p-3 bg-white rounded-bottom">
                        <h6 className="fw-bold text-primary mb-2">
                          <i className="bi bi-receipt-cutoff me-2"></i>
                          {t("import.details") || "Chi tiết sản phẩm"}
                        </h6>

                        <table className="table table-sm align-middle mb-0">
                          <thead className="table-secondary">
                            <tr>
                              <th>#</th>
                              <th>{t("product.barcode") || "Mã vạch"}</th>
                              <th>{t("product.name") || "Tên sản phẩm"}</th>
                              <th>{t("product.unit") || "Đơn vị"}</th>
                              <th className="text-end">
                                {t("product.quantity") || "Số lượng"}
                              </th>
                              <th className="text-end">
                                {t("product.price") || "Đơn giá"}
                              </th>
                              <th className="text-end">
                                {t("product.subtotal") || "Thành tiền"}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.details?.map((d, i) => (
                              <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{d.barcode}</td>
                                <td>{d.productName}</td>
                                <td>{d.unit}</td>
                                <td className="text-end">{d.quantity}</td>
                                <td className="text-end">
                                  {formatCurrency(d.price)}
                                </td>
                                <td className="text-end">
                                  {formatCurrency(d.subtotal)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>

    </div>
  );
}

