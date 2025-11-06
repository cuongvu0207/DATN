import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import ProductDetailCard from "../common/ProductDetailCard";
import EditProductDetailCard from "../common/EditProductDetailCard";
import { formatCurrency } from "../../utils/formatters";


export default function ProductTable({
  products,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setRowsPerPage,
  selectedProducts,
  onSelectOne,
  onSelectAll,
  onEdit,
  onDelete,
  editingProduct,
  setEditingProduct,
  selectedProductId,
  setSelectedProductId,
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // --- Pagination ---
  const totalPages = Math.max(1, Math.ceil(products.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentRows = products.slice(startIndex, startIndex + rowsPerPage);

  // ✅ Kiểm tra xem có chọn hết trang hiện tại chưa
  const allChecked =
    currentRows.length > 0 &&
    currentRows.every((p) => selectedProducts.includes(p.id));

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
              <th>STT</th>
              <th>{t("products.barcode") || "Mã vạch"}</th>
              <th>{t("products.productName") || "Tên sản phẩm"}</th>
              <th>{t("products.category") || "Danh mục"}</th>
              <th>{t("products.brand") || "Thương hiệu"}</th> {/* ✅ Thêm cột mới */}
              <th>{t("products.unit") || "Đơn vị"}</th>
              <th>{t("products.sellingPrice") || "Giá bán"}</th>
              <th>{t("products.costOfCapital") || "Giá vốn"}</th>
              <th>{t("products.stock") || "Tồn kho"}</th>
              <th>{t("products.status") || "Trạng thái"}</th>
              <th>{t("products.createdDate") || "Ngày cập nhật"}</th>
            </tr>
          </thead>

          <tbody>
            {currentRows.length > 0 ? (
              currentRows.map((p, index) => (
                <React.Fragment key={p.id}>
                  <tr
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      setSelectedProductId((prev) =>
                        prev === p.id ? null : p.id
                      )
                    }
                  >
                    {/* Checkbox */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedProducts.includes(p.id)}
                        onChange={() => onSelectOne(p.id)}
                      />
                    </td>

                    {/* Số thứ tự */}
                    <td>{index + 1 + (currentPage - 1) * rowsPerPage}</td>

                    {/* Mã vạch */}
                    <td>{p.barcode || "-"}</td>

                    {/* Tên sản phẩm */}
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="rounded"
                          style={{ width: 45, height: 45, objectFit: "cover" }}
                        />
                        <span>{p.name}</span>
                      </div>
                    </td>

                    {/* Danh mục */}
                    <td>{p.category || "-"}</td>

                    {/* ✅ Thương hiệu */}
                    <td>
                      <span className="badge bg-light text-dark border">
                        {p.brand || p.brandName || t("common.undefined")}
                      </span>
                    </td>

                    {/* Đơn vị */}
                    <td>{p.unit || "-"}</td>

                    {/* Giá bán */}
                    <td>{formatCurrency(p.price)}</td>

                    {/* Giá vốn */}
                    <td>{formatCurrency(p.cost)}</td>

                    {/* Tồn kho */}
                    <td>{p.stock}</td>

                    {/* Trạng thái */}
                    <td
                      className={
                        p.status === "Đang kinh doanh"
                          ? "text-success fw-semibold"
                          : "text-danger fw-semibold"
                      }
                    >
                      {p.status}
                    </td>

                    {/* Ngày cập nhật */}
                    <td>{p.createdAt}</td>
                  </tr>

                  {/* Chi tiết sản phẩm */}
                  {selectedProductId === p.id && (
                    <tr className="bg-body-tertiary">
                      {/* ✅ Cập nhật colSpan để khớp với số cột mới (12 thay vì 11) */}
                      <td colSpan={12} className="p-0 border-0">
                        {editingProduct?.id === p.id ? (
                          <EditProductDetailCard
                            product={editingProduct}
                            onClose={() => setEditingProduct(null)}
                            onSave={(u) => onEdit(u)}
                          />
                        ) : (
                          <ProductDetailCard
                            product={p}
                            onEdit={() => setEditingProduct(p)}
                            onDelete={() => onDelete(p.id)}
                          />
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={12} className="text-center text-muted py-4">
                  {t("products.noData") || "Không có dữ liệu"}
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
          <span>{t("products.show") || "Hiển thị"}</span>
          <select
            className="form-select form-select-sm"
            style={{ width: 130 }}
            value={rowsPerPage >= products.length ? "all" : rowsPerPage}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "all") setRowsPerPage(products.length);
              else setRowsPerPage(Number(val));
              setCurrentPage(1);
            }}
          >
            {[15, 20, 30, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} {t("products.rows") || "dòng"}
              </option>
            ))}
            <option value="all">{t("products.all") || "Tất cả"}</option>
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
