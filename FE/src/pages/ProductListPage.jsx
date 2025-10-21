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
    createdAt: "12",
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
  const [showFilter, setShowFilter] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]); // ✅ Danh sách sản phẩm được chọn

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
    if (window.confirm(t("common.confirmDelete"))) {
      console.log(t("products.deletedProduct"), id);
    }
  };

  const handleAddNew = (newProduct) => {
    console.log(t("products.addedProduct"), newProduct);
    setAddingProduct(false);
  };

  const handleAddCategory = () => {
    alert(t("products.addCategoryMsg") || "Thêm danh mục mới (đang phát triển).");
  };

  // ✅ Chọn tất cả
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = currentRows.map((p) => p.id);
      setSelectedProducts((prev) => Array.from(new Set([...prev, ...allIds])));
    } else {
      setSelectedProducts((prev) =>
        prev.filter((id) => !currentRows.some((p) => p.id === id))
      );
    }
  };

  // ✅ Chọn từng sản phẩm
  const handleSelectOne = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ✅ In mã vạch chỉ cho sản phẩm được chọn
  const handlePrintBarcode = () => {
    const selectedList = products.filter((p) => selectedProducts.includes(p.id));
    if (!selectedList.length)
      return alert("Vui lòng chọn ít nhất một sản phẩm để in mã vạch!");
    const win = window.open("", "_blank");
    const html = `
      <html>
        <head>
          <title>In mã vạch sản phẩm</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
            .item { border: 1px solid #ccc; text-align: center; padding: 10px; border-radius: 8px; }
            svg { width: 160px; height: 60px; margin: 5px auto; }
            @media print { body { margin: 0; } .item { border: none; } }
          </style>
        </head>
        <body>
          <h2>Danh sách mã vạch sản phẩm</h2>
          <div class="grid">
            ${selectedList
              .map(
                (p, i) => `
                <div class="item">
                  <svg id="barcode-${i}"></svg>
                  <p>${p.name}</p>
                  <small>${p.id}</small>
                </div>`
              )
              .join("")}
          </div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
          <script>
            const data = ${JSON.stringify(selectedList)};
            window.onload = () => {
              data.forEach((p, i) => JsBarcode("#barcode-" + i, p.id, { format: "CODE128" }));
              setTimeout(() => window.print(), 800);
            };
          </script>
        </body>
      </html>`;
    win.document.write(html);
    win.document.close();
  };

  const allChecked = currentRows.every((p) => selectedProducts.includes(p.id));

  return (
    <MainLayout>
      <div className="container-fluid py-3">
        {/* ---------------- HEADER ---------------- */}
        <div className="row align-items-center gy-2 mb-2">
          {/* Tiêu đề */}
          <div className="col-12 col-md-3 col-lg-2 d-flex align-items-center">
            <h4 className="fw-bold text-capitalize mb-0">
              {t("products.title") || "Hàng Hóa"}
            </h4>
          </div>

          {/* Thanh tìm kiếm */}
          <div className="col-12 col-md-5 col-lg-5">
            <div
              className={`input-group border border-${theme} rounded-3 align-items-center`}
              style={{ height: "40px" }}
            >
              <span
                className={`input-group-text bg-white border-0 text-${theme}`}
                style={{
                  borderRight: `1px solid var(--bs-${theme})`,
                  height: "100%",
                }}
              >
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="form-control border-0 shadow-none"
                style={{ height: "100%" }}
                placeholder={t("products.searchPlaceholder") || "Theo mã, tên hàng"}
              />
            </div>
          </div>

          {/* Nhóm nút chức năng */}
          <div className="col-12 col-md-4 col-lg-5 d-flex justify-content-end gap-2 flex-wrap">
            {/* Nút lọc mobile */}
            <button
              className={`btn btn-outline-${theme} d-flex align-items-center justify-content-center rounded-3 d-lg-none`}
              style={{ width: 40, height: 40 }}
              onClick={() => setShowFilter(true)}
            >
              <i className="bi bi-funnel"></i>
            </button>

            {/* Tạo mới */}
            <button
              className={`btn btn-${theme} text-white fw-semibold d-flex align-items-center rounded-3 px-3`}
              style={{ height: 40 }}
              onClick={() => setAddingProduct(true)}
            >
              <i className="bi bi-plus-lg"></i>
              <span className="ms-1 d-none d-sm-inline">
                {t("products.create") || "Tạo mới"}
              </span>
            </button>

            {/* Nhập file */}
            <button
              className={`btn btn-outline-${theme} d-flex align-items-center fw-semibold rounded-3 px-3`}
              style={{ height: 40 }}
            >
              <i className="bi bi-upload"></i>
              <span className="ms-1 d-none d-md-inline">
                {t("products.import") || "Nhập file"}
              </span>
            </button>

            {/* Xuất file */}
            <button
              className={`btn btn-outline-${theme} d-flex align-items-center fw-semibold rounded-3 px-3`}
              style={{ height: 40 }}
              onClick={() => exportProductsToExcel(filtered, t)}
            >
              <i className="bi bi-download"></i>
              <span className="ms-1 d-none d-md-inline">
                {t("products.export") || "Xuất file"}
              </span>
            </button>

            {/* In mã vạch */}
            <button
              className={`btn btn-outline-${theme} d-flex align-items-center fw-semibold rounded-3 px-3 position-relative`}
              style={{ height: 40 }}
              onClick={handlePrintBarcode}
            >
              <i className="bi bi-upc"></i>
              <span className="ms-1 d-none d-md-inline">
                {t("products.printBarcode") || "In mã vạch"}
              </span>
              {selectedProducts.length > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style={{ fontSize: "0.7rem" }}
                >
                  {selectedProducts.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ---------------- BODY ---------------- */}
        <div className="row g-3 mt-1">
          {/* Sidebar bộ lọc giữ nguyên đầy đủ */}
          <aside className="col-lg-2 d-none d-lg-block">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <h6 className="fw-bold mb-4">
                  {t("products.filterTitle") || "Bộ lọc"}
                </h6>
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <label className="form-label mb-0">
                      {t("products.category") || "Danh mục"}
                    </label>
                    <button
                      className={`btn btn-outline-${theme} btn-sm p-0 d-flex align-items-center justify-content-center rounded-circle`}
                      style={{ width: 22, height: 22 }}
                      onClick={handleAddCategory}
                    >
                      <i className="bi bi-plus-lg" style={{ fontSize: "11px" }}></i>
                    </button>
                  </div>
                  <select className="form-select form-select-sm shadow-sm">
                    <option>
                      {t("products.chooseCategory") || "Chọn danh mục"}
                    </option>
                  </select>
                </div>

                {[t("products.createdAt"), t("products.supplier"), t("products.brand"), t("products.stock")].map(
                  (label, idx) => (
                    <div className="mb-4" key={idx}>
                      <label className="form-label fw-medium mb-2">
                        {label}
                      </label>
                      <select className="form-select form-select-sm shadow-sm">
                        <option>{t("products.all") || "Tất cả"}</option>
                      </select>
                    </div>
                  )
                )}
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="col-lg-10 col-12">
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
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>{t("products.productId") || "Mã SP"}</th>
                    <th></th>
                    <th>{t("products.productName") || "Tên sản phẩm"}</th>
                    <th>{t("products.brand") || "Thương hiệu"}</th>
                    <th>{t("products.sellingPrice") || "Giá bán"}</th>
                    <th>{t("products.costOfCapital") || "Giá vốn"}</th>
                    <th>{t("products.quantityInStock") || "Tồn kho"}</th>
                    <th>{t("products.createdAt") || "Ngày tạo"}</th>
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
                              checked={selectedProducts.includes(p.id)}
                              onChange={() => handleSelectOne(p.id)}
                            />
                          </td>
                          <td>{p.id}</td>
                          <td>
                            <img
                              src={p.image}
                              alt=""
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
                                  onSave={handleSaveEdit}
                                />
                              ) : (
                                <ProductDetailCard
                                  product={p}
                                  onEdit={() => setEditingProduct(p)}
                                  onDelete={() => handleDelete(p.id)}
                                />
                              )}
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
                <span>{t("products.show") || "Hiển thị"}</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: 110 }}
                  value={rowsPerPage}
                  onChange={(e) => changeRows(Number(e.target.value))}
                >
                  {[15, 20, 30, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n} hàng
                    </option>
                  ))}
                </select>
              </div>
              <div className="btn-group">
                <button
                  className={`btn btn-outline-${theme}`}
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                >
                  &lt;
                </button>
                <span
                  className={`btn btn-${theme} text-white fw-bold`}
                >
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

        {/* ✅ Offcanvas filter cho mobile */}
        {showFilter && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none"
            style={{ zIndex: 1050 }}
            onClick={() => setShowFilter(false)}
          >
            <div
              className="bg-white shadow p-3 position-absolute top-0 start-0 h-100"
              style={{ width: "80%", maxWidth: 350 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">
                  {t("products.filterTitle") || "Bộ lọc"}
                </h5>
                <button
                  className="btn btn-close"
                  onClick={() => setShowFilter(false)}
                ></button>
              </div>
              <hr />
              <div
                className="overflow-auto"
                style={{ maxHeight: "85vh" }}
              >
                <div className="mb-4">
                  <label className="form-label mb-1">
                    {t("products.category") || "Danh mục"}
                  </label>
                  <select className="form-select form-select-sm">
                    <option>
                      {t("products.chooseCategory") || "Chọn danh mục"}
                    </option>
                  </select>
                </div>
                {[t("products.createdAt"), t("products.supplier"), t("products.brand"), t("products.stock")].map(
                  (label, idx) => (
                    <div className="mb-4" key={idx}>
                      <label className="form-label fw-medium mb-1">
                        {label}
                      </label>
                      <select className="form-select form-select-sm">
                        <option>{t("products.all") || "Tất cả"}</option>
                      </select>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
