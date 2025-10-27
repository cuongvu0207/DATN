import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import ProductDetailCard from "../common/ProductDetailCard";
import EditProductDetailCard from "../common/EditProductDetailCard";

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
                  onChange={(e) =>
                    onSelectAll(e.target.checked, currentRows)
                  }
                />
              </th>
              <th>{t("products.productId")}</th>
              <th></th>
              <th>{t("products.productName")}</th>
              <th>{t("products.brand")}</th>
              <th>{t("products.sellingPrice")}</th>
              <th>{t("products.costOfCapital")}</th>
              <th>{t("products.stock")}</th>
              <th>{t("products.createdDate")}</th>
            </tr>
          </thead>

          <tbody>
            {currentRows.length > 0 ? (
              currentRows.map((p) => (
                <React.Fragment key={p.id}>
                  <tr
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      setSelectedProductId((prev) =>
                        prev === p.id ? null : p.id
                      )
                    }
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedProducts.includes(p.id)}
                        onChange={() => onSelectOne(p.id)}
                      />
                    </td>
                    <td>{p.id}</td>
                    <td>
                      <img
                        src={p.image}
                        alt={p.name}
                        className="rounded"
                        style={{ width: 50, height: 50 }}
                      />
                    </td>
                    <td>{p.name}</td>
                    <td>{p.brand}</td>
                    <td>{p.price.toLocaleString()}</td>
                    <td>{p.cost.toLocaleString()}</td>
                    <td>{p.stock}</td>
                    <td>{p.createdAt}</td>
                  </tr>

                  {selectedProductId === p.id && (
                    <tr className="bg-body-tertiary">
                      <td colSpan={9} className="p-0 border-0">
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
                <td colSpan={9} className="text-center text-muted py-4">
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
