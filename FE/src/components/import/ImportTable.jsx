import React from "react";
import { useTranslation } from "react-i18next";

export default function ImportTable({ theme, items, updateItem, total, onDeleteItem, onAddRow }) {
  const { t } = useTranslation();

  return (
    <div className={`border border-${theme} rounded-3 shadow-sm bg-white`}>
      <table className="table table-bordered align-middle text-center mb-0">
        <thead className={`table-${theme}`}>
          <tr>
            <th>STT</th>
            <th>{t("importProducts.barcode") || "Mã vạch"}</th>
            <th>{t("importProducts.name") || "Tên sản phẩm"}</th>
            <th>{t("importProducts.unit") || "Đơn vị tính"}</th>
            <th>{t("importProducts.stock") || "Số lượng"}</th>
            <th>{t("importProducts.cost") || "Đơn giá"}</th>
            <th>{t("importProducts.discount") || "Giảm giá"}</th>
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
                  <input
                    type="number"
                    min="0"
                    className="form-control form-control-sm text-end"
                    value={item.discount}
                    onChange={(e) => updateItem(idx, "discount", e.target.value)}
                  />
                </td>

                {/* Thành tiền */}
                <td className="text-end text-success fw-semibold">
                  {item.subtotal.toLocaleString()}
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

      {/* Nút thêm dòng */}
      <div className="d-flex justify-content-start ps-3 py-2 border-top">
        <button
          className={`btn btn-outline-${theme} btn-sm d-flex align-items-center`}
          onClick={onAddRow}
        >
          <i className="bi bi-plus-circle me-1"></i>
          {t("import.addRow") || "Thêm dòng sản phẩm"}
        </button>
      </div>

      {/* Tổng tiền hàng */}
      <div className="d-flex justify-content-end align-items-center mt-3 pe-3">
        <h6 className="fw-bold me-3">{t("import.total") || "Tổng tiền hàng:"}</h6>
        <h5 className="text-success">{total.toLocaleString()}</h5>
      </div>
    </div>
  );
}