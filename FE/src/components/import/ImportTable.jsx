import React from "react";
import { formatCurrency } from "../../utils/formatters";
import { useTranslation } from "react-i18next";

export default function ImportTable({ theme, items, updateItem, total, onDeleteItem, onAddRow }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-3 shadow-sm bg-white" style={{ overflow: "hidden" }}>
      <table className="table align-middle text-center mb-0 border-0">
        <thead className={`table-${theme}`}>
          <tr>
            <th>#</th>
            <th>{t("importProducts.barcode") || "Mã vạch"}</th>
            <th>{t("importProducts.name") || "Tên sản phẩm"}</th>
            <th>{t("importProducts.unit") || "Đơn vị tính"}</th>
            <th>{t("importProducts.stock") || "Số lượng"}</th>
            <th>{t("importProducts.cost") || "Đơn giá"}</th>
            <th>{t("importProducts.discount") || "Giảm giá (%)"}</th>
            <th>{t("importProducts.total") || "Thành tiền"}</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {items.length > 0 ? (
            items.map((item, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>

                {/* Mã vạch */}
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm text-center"
                    value={item.barcode}
                    onChange={(e) => updateItem(idx, "barcode", e.target.value)}
                  />
                </td>

                {/* Tên sản phẩm */}
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm text-start"
                    value={item.product_name}
                    onChange={(e) => updateItem(idx, "product_name", e.target.value)}
                  />
                </td>

                {/* Đơn vị tính */}
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm text-center"
                    value={item.unit}
                    onChange={(e) => updateItem(idx, "unit", e.target.value)}
                  />
                </td>

                {/* Số lượng */}
                <td>
                  <input
                    type="number"
                    min="1"
                    className="form-control form-control-sm text-end"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                  />
                </td>

                {/* Đơn giá */}
                <td>
                  <input
                    type="number"
                    min="0"
                    className="form-control form-control-sm text-end"
                    value={item.importPrice}
                    onChange={(e) => updateItem(idx, "importPrice", e.target.value)}
                  />
                </td>

                {/* Giảm giá */}
                <td>
                  <div className="input-group input-group-sm">
                    <input
                      type="number"
                      min="0"
                      className="form-control text-end"
                      value={item.discount}
                      onChange={(e) => updateItem(idx, "discount", e.target.value)}
                    />
                    <span className="input-group-text">%</span>
                  </div>
                </td>

                {/* Thành tiền */}
                <td className="text-end text-success fw-semibold">
                  {formatCurrency(item.subtotal)}
                </td>

                {/* Xóa sản phẩm */}
                <td>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    title={t("product.delete") || "Xóa sản phẩm"}
                    onClick={() => onDeleteItem(idx)}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="py-5 text-muted">
                {t("import.noItems") ||
                  "Chưa có sản phẩm. Hãy thêm mới hoặc nhập từ file Excel."}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Tác vụ và tổng tiền */}
      <div className="d-flex justify-content-between align-items-center border-top px-3 py-2 flex-wrap gap-3">
        <button
          className={`btn btn-outline-${theme} btn-sm d-flex align-items-center`}
          onClick={onAddRow}
        >
          <i className="bi bi-plus-circle me-1"></i>
          {t("import.addRow") || "Thêm dòng sản phẩm"}
        </button>

        <div className="d-flex align-items-center">
          <h6 className="fw-bold me-3 mb-0">{t("import.total") || "Tổng tiền hàng:"}</h6>
          <h5 className="text-success mb-0">{formatCurrency(total)}</h5>
        </div>
      </div>
    </div>
  );
}
