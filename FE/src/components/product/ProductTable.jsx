import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import ProductDetailCard from "../common/ProductDetailCard";
import EditProductDetailCard from "../common/EditProductDetailCard";
import TablePagination from "../common/TablePagination";
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
  onToggleActive,
  editingProduct,
  setEditingProduct,
  selectedProductId,
  setSelectedProductId,
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  /* =============================
        PAGINATION
  ============================== */
  const totalPages = Math.max(1, Math.ceil(products.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentRows = products.slice(startIndex, startIndex + rowsPerPage);

  const rowsSelectValue = rowsPerPage >= products.length ? "all" : rowsPerPage;

  const allChecked =
    currentRows.length > 0 &&
    currentRows.every((p) => selectedProducts.includes(p.id));

  const handleRowsPerPageChange = (value) => {
    if (value === "all") {
      setRowsPerPage(products.length || 1);
    } else {
      setRowsPerPage(Number(value));
    }
    setCurrentPage(1);
  };

  /* =============================
           RENDER
  ============================== */
  return (
    <div className="col-lg-10 col-12">
      <div className="table-responsive rounded-3 shadow-sm">
        <div
          style={{ maxHeight: "60vh", overflowX: "auto", overflowY: "auto" }}
        >
          <table className="table table-hover align-middle mb-0">
            <thead
              className={`table-${theme}`}
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                backgroundColor: "var(--bs-body-bg)",
              }}
            >
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={allChecked}
                    onChange={(e) => onSelectAll(e.target.checked, currentRows)}
                  />
                </th>
                <th>#</th>
                <th>{t("products.barcode")}</th>
                <th>{t("products.productName")}</th>
                <th>{t("products.category")}</th>
                <th>{t("products.brand")}</th>
                <th>{t("products.unit")}</th>
                <th>{t("products.costOfCapital")}</th>
                <th>{t("products.sellingPrice")}</th>
                <th>{t("products.stock")}</th>
                <th>{t("products.minimumStock")}</th>
                <th>{t("products.status")}</th>
                {/* <th>{t("products.createdDate")}</th> */}
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

                      {/* STT */}
                      <td>{index + 1 + startIndex}</td>

                      {/* Barcode */}
                      <td>{p.code || p.barcode || "-"}</td>

                      {/* Tên + Ảnh */}
                      <td className="text-wrap" style={{ maxWidth: "220px" }}>
                        <div className="d-flex align-items-center gap-2">

                          <img
                            src={p.image || "/no-image.png"}
                            alt={p.name}
                            className="rounded"
                            style={{ width: 45, height: 45, objectFit: "cover" }}
                          />
                          <span>{p.name}</span>
                        </div>
                      </td>

                      {/* Danh mục */}
                      <td>{p.category || "-"}</td>

                      {/* Thương hiệu */}
                      <td>
                        <span className="badge bg-light text-dark border">
                          {p.brand || t("common.undefined")}
                        </span>
                      </td>

                      {/* Đơn vị */}
                      <td>{p.unit || "-"}</td>

                      {/* Giá vốn */}
                      <td>{formatCurrency(p.cost)}</td>

                      {/* Giá bán */}
                      <td>{formatCurrency(p.price)}</td>

                      {/* Tồn kho */}
                      <td>{p.stock}</td>

                      {/* Tồn kho */}
                      <td>{p.minimumStock}</td>

                      {/* Trạng thái */}
                      <td
                        className={
                          p.active || p.isActive || p.statusBoolean
                            ? "text-success fw-semibold"
                            : "text-danger fw-semibold"
                        }
                      >
                        {p.active || p.isActive || p.statusBoolean
                          ? t("products.active", "Đang bán")
                          : t("products.inactive", "Ngừng bán")}
                      </td>

                      {/* Ngày tạo */}
                      {/* <td>{p.createdAt ? p.createdAt : "-"}</td> */}
                    </tr>

                    {/* Row chi tiết */}
                    {selectedProductId === p.id && (
                      <tr className="bg-body-tertiary">
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
                              onToggleActive={() => onToggleActive(p)}
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
                    {t("products.noData")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalItems={products.length}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[15, 20, 30, 50, 100]}
        rowsPerPageValue={rowsSelectValue}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </div>
  );
}
