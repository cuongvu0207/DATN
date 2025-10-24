import React from "react";
import { useTranslation } from "react-i18next";

export default function ImportTable({ theme, items, updateItem, total, onDeleteItem }) {
  const { t } = useTranslation();

  return (
    <div className={`border border-${theme} rounded-3 shadow-sm bg-white`}>
      <table className="table table-bordered align-middle text-center mb-0">
        <thead className={`table-${theme}`}>
          <tr>
            <th>STT</th>
            <th>{t("product.barcode") || "Mã vạch"}</th>
            <th>{t("product.name") || "Tên sản phẩm"}</th>
            <th>{t("product.unit") || "Đơn vị tính"}</th>
            <th>{t("product.quantity") || "Số lượng"}</th>
            <th>{t("product.cost") || "Đơn giá"}</th>
            <th>{t("product.discount") || "Giảm giá"}</th>
            <th>{t("product.total") || "Thành tiền"}</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {items.length > 0 ? (
            items.map((item, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td className="fw-semibold">{item.barcode}</td>
                <td className="text-start">{item.product_name}</td>
                <td>{item.unit}</td>
                <td>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    className="form-control form-control-sm text-end"
                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    value={item.importPrice}
                    className="form-control form-control-sm text-end"
                    onChange={(e) => updateItem(idx, "importPrice", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    value={item.discount}
                    className="form-control form-control-sm text-end"
                    onChange={(e) => updateItem(idx, "discount", e.target.value)}
                  />
                </td>
                <td className="text-end text-success fw-semibold">
                  {item.subtotal.toLocaleString()} ₫
                </td>
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
                  "Chưa có sản phẩm. Hãy quét mã hoặc nhập từ file Excel."}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="d-flex justify-content-end align-items-center mt-3 pe-3">
        <h6 className="fw-bold me-3">{t("import.total") || "Tổng tiền hàng:"}</h6>
        <h5 className="text-success">{total.toLocaleString()} ₫</h5>
      </div>
    </div>
  );
}
