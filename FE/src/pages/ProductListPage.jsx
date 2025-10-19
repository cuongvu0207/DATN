import React, { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import ProductDetailCard from "../components/common/ProductDetailCard";
import EditProductDetailCard from "../components/common/EditProductDetailCard";
import AddProductCard from "../components/common/AddProductCard";
import { exportProductsToExcel } from "../utils/exportProductsUtils";

export default function ProductListPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // Demo dữ liệu
  const products = Array.from({ length: 35 }, (_, i) => ({
    id: `SP00${i + 1}`,
    name: `Sản phẩm ${i + 1}`,
    brand: `Thương hiệu ${i + 1}`,
    price: 10000 + i * 1000,
    cost: 8000 + i * 900,
    stock: 50 - i,
    createdAt: "2025-10-17",
    image: "https://via.placeholder.com/80x80.png?text=IMG",
    category: "Danh mục A",
    supplier: "Nhà cung cấp A",
  }));

  const [query, setQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [addingProduct, setAddingProduct] = useState(false);

  const filtered = products.filter(
    (p) =>
      p.id.toLowerCase().includes(query.toLowerCase()) ||
      p.name.toLowerCase().includes(query.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentRows = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const changeRows = (n) => {
    setRowsPerPage(n);
    setCurrentPage(1);
  };

  const handleSaveEdit = (updatedProduct) => {
    console.log(t("products.savedProduct"), updatedProduct);
    setEditingProduct(null);
  };

  const handleDelete = (id) => {
    const confirmMsg = t("common.confirmDelete");
    if (window.confirm(confirmMsg)) {
      console.log(t("products.deletedProduct"), id);
    }
  };

  const handleAddNew = (newProduct) => {
    console.log(t("products.addedProduct"), newProduct);
    setAddingProduct(false);
  };

  // Tạm thời chỉ log hành động thêm danh mục
  const handleAddCategory = () => {
    alert("Thêm danh mục mới (chức năng đang được phát triển).");
  };

  return (
    <MainLayout>
      <div className="container-fluid py-3">
        {/* ------------------- HEADER ------------------- */}
        <div className="row align-items-center mb-3">
          <div className="col-md-2 col-sm-12">
            <h4 className="fw-bold text-capitalize mb-0">
              {t("products.title") || "Hàng Hóa"}
            </h4>
          </div>

          <div className="col-md-10 col-sm-12">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              {/* Thanh tìm kiếm */}
              <div
                className={`input-group flex-grow-1 border border-${theme} rounded-3`}
                style={{ maxWidth: "600px", overflow: "hidden" }}
              >
                <span
                  className={`input-group-text bg-white border-0 text-${theme}`}
                  style={{ borderRight: `1px solid var(--bs-${theme})` }}
                >
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="form-control border-0 shadow-none"
                  placeholder={t("products.searchPlaceholder") || "Theo mã, tên hàng"}
                />
              </div>

              {/* Nhóm 3 nút căn phải */}
              <div className="d-flex align-items-center gap-2">
                <button
                  className={`btn btn-${theme} text-white fw-semibold d-flex align-items-center rounded-3 px-3`}
                  onClick={() => setAddingProduct(true)}
                >
                  <i className="bi bi-plus-lg me-1"></i>
                  {t("products.create") || "Tạo mới"}
                </button>

                <button
                  className={`btn btn-outline-${theme} d-flex align-items-center fw-semibold rounded-3 px-3`}
                >
                  <i className="bi bi-upload me-1"></i>
                  {t("products.import") || "Nhập từ file"}
                </button>

                <button
                  className={`btn btn-outline-${theme} d-flex align-items-center fw-semibold rounded-3 px-3`}
                  onClick={() => exportProductsToExcel(filtered, t)}
                >
                  <i className="bi bi-download me-1"></i>
                  {t("products.export") || "Xuất file"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------- BODY ------------------- */}
        <div className="row g-3">
          {/* Sidebar bộ lọc */}
          <aside className="col-md-2">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <h6 className="fw-bold mb-4">{t("products.filterTitle") || "Bộ lọc"}</h6>

                {/* DANH MỤC - moved lên đầu và thêm nút + nhỏ gọn */}
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <label className="form-label mb-0">
                      {t("products.category") || "Danh mục"}
                    </label>
                    <button
                      className={`btn btn-outline-${theme} btn-sm p-0 d-flex align-items-center justify-content-center rounded-circle`}
                      style={{
                        width: "22px",
                        height: "22px",
                        lineHeight: "1",
                        borderWidth: "1px",
                      }}
                      onClick={handleAddCategory}
                      title={t("products.addCategory") || "Thêm danh mục"}
                    >
                      <i className="bi bi-plus-lg" style={{ fontSize: "11px" }}></i>
                    </button>
                  </div>
                  <select className="form-select form-select-sm shadow-sm">
                    <option>{t("products.chooseCategory") || "Chọn danh mục"}</option>
                  </select>
                </div>

                {/* THỜI GIAN TẠO */}
                <div className="mb-4">
                  <label className="form-label fw-medium mb-2">
                    {t("products.createdAt") || "Thời gian tạo"}
                  </label>
                  <select className="form-select form-select-sm shadow-sm">
                    <option>{t("products.allTime") || "Tất cả"}</option>
                  </select>
                </div>

                {/* NHÀ CUNG CẤP */}
                <div className="mb-4">
                  <label className="form-label fw-medium mb-2">
                    {t("products.supplier") || "Nhà cung cấp"}
                  </label>
                  <select className="form-select form-select-sm shadow-sm">
                    <option>{t("products.chooseSupplier") || "Chọn nhà cung cấp"}</option>
                  </select>
                </div>

                {/* THƯƠNG HIỆU */}
                <div className="mb-4">
                  <label className="form-label fw-medium mb-2">
                    {t("products.brand") || "Thương hiệu"}
                  </label>
                  <select className="form-select form-select-sm shadow-sm">
                    <option>{t("products.chooseBrand") || "Chọn thương hiệu"}</option>
                  </select>
                </div>

                {/* TỒN KHO */}
                <div className="mb-2">
                  <label className="form-label fw-medium mb-2">
                    {t("products.stock") || "Tồn kho"}
                  </label>
                  <select className="form-select form-select-sm shadow-sm">
                    <option>{t("products.all") || "Tất cả"}</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>


          {/* Main content */}
          <main className="col-md-10">
            {addingProduct && (
              <div
                className={`border border-${theme} border-opacity-25 rounded-3 mb-3 p-3 shadow-sm bg-body-tertiary`}
              >
                <AddProductCard
                  onCancel={() => setAddingProduct(false)}
                  onSave={handleAddNew}
                />
              </div>
            )}

            {/* Bảng sản phẩm */}
            <div
              className={`table-responsive rounded-2 border border-${theme} border-opacity-25 shadow-sm overflow-hidden`}
            >
              <table className="table table-hover align-middle mb-0">
                <thead className={`table-${theme}`}>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input type="checkbox" />
                    </th>
                    <th>{t("products.productId")}</th>
                    <th></th>
                    <th>{t("products.productName")}</th>
                    <th>{t("products.brand")}</th>
                    <th>{t("products.sellingPrice")}</th>
                    <th>{t("products.costOfCapital")}</th>
                    <th>{t("products.quantityInStock")}</th>
                    <th>{t("products.createdAt")}</th>
                  </tr>
                </thead>

                <tbody>
                  {currentRows.length > 0 ? (
                    currentRows.map((p) => (
                      <React.Fragment key={p.id}>
                        <tr
                          className="border-bottom border-opacity-25"
                          style={{
                            borderColor: `var(--bs-${theme})`,
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            setSelectedProductId((prev) =>
                              prev === p.id ? null : p.id
                            )
                          }
                        >
                          <td>
                            <input
                              type="checkbox"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td>{p.id}</td>
                          <td>
                            <img
                              src={p.image}
                              alt=""
                              className="rounded"
                              style={{
                                width: 50,
                                height: 50,
                                objectFit: "cover",
                              }}
                              onClick={(e) => e.stopPropagation()}
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
                              <div
                                className={`border-top border-2 border-${theme} border-opacity-25 rounded-0 m-0`}
                              >
                                {editingProduct?.id === p.id ? (
                                  <EditProductDetailCard
                                    product={editingProduct}
                                    onClose={() => setEditingProduct(null)}
                                    onSave={handleSaveEdit}
                                  />
                                ) : (
                                  <ProductDetailCard
                                    product={p}
                                    onEdit={() => setEditingProduct(p)}
                                    onDelete={handleDelete}
                                  />
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="text-center text-muted">
                        {t("products.noData")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Phân trang */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="d-flex align-items-center gap-2">
                <span>{t("products.show")}</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: 110 }}
                  value={rowsPerPage}
                  onChange={(e) => changeRows(Number(e.target.value))}
                >
                  {[15, 20, 30, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n} {t("products.rows")}
                    </option>
                  ))}
                </select>
              </div>

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
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                >
                  &gt;
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </MainLayout>
  );
}
