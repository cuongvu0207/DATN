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
    brand: `Thương hiệu ${i % 3 === 0 ? "A" : i % 3 === 1 ? "B" : "C"}`,
    price: 10000 + i * 1000,
    cost: 8000 + i * 900,
    stock: 50 - i,
    createdAt: i % 2 === 0 ? "22/10/2025" : "21/10/2025",
    image: "https://via.placeholder.com/80x80.png?text=IMG",
    category: i % 2 === 0 ? "Danh mục A" : "Danh mục B",
    supplier: i % 2 === 0 ? "Nhà cung cấp A" : "Nhà cung cấp B",
  }));

  // --- STATE ---
  const [query, setQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // --- Bộ lọc ---
  const [filters, setFilters] = useState({
    category: "",
    brand: "",
    supplier: "",
    createdAt: "",
    stock: "all",
  });

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  // --- Lọc dữ liệu ---
  const filtered = products.filter((p) => {
    const matchesQuery =
      p.id.toLowerCase().includes(query.toLowerCase()) ||
      p.name.toLowerCase().includes(query.toLowerCase());

    const matchesCategory = !filters.category || p.category === filters.category;
    const matchesBrand = !filters.brand || p.brand === filters.brand;
    const matchesSupplier = !filters.supplier || p.supplier === filters.supplier;

    const matchesStock =
      filters.stock === "all"
        ? true
        : filters.stock === "in"
        ? p.stock > 0
        : p.stock === 0;

    const matchesDate =
      !filters.createdAt ||
      p.createdAt ===
        new Date(filters.createdAt).toLocaleDateString("vi-VN");

    return (
      matchesQuery &&
      matchesCategory &&
      matchesBrand &&
      matchesSupplier &&
      matchesStock &&
      matchesDate
    );
  });

  // --- PHÂN TRANG ---
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentRows = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // --- CHỨC NĂNG BẢNG ---
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

  // --- CHỌN SẢN PHẨM ---
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

  const handleSelectOne = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allChecked = currentRows.every((p) => selectedProducts.includes(p.id));

  // --- IN MÃ VẠCH ---
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

  // --- GIAO DIỆN ---
  return (
    <MainLayout>
      <div className="container-fluid py-3">
        {/* ================= HEADER ================= */}
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
                placeholder={t("products.searchPlaceholder") || "Theo mã, tên hàng"}
              />
            </div>
          </div>

          {/* Nhóm nút chức năng */}
          <div className="col-12 col-md-4 col-lg-5 d-flex justify-content-end gap-2 flex-wrap">
            <button
              className={`btn btn-outline-${theme} d-flex align-items-center justify-content-center rounded-3 d-lg-none`}
              style={{ width: 40, height: 40 }}
              onClick={() => setShowFilter(true)}
            >
              <i className="bi bi-funnel"></i>
            </button>

            <button
              className={`btn btn-${theme} text-white fw-semibold d-flex align-items-center rounded-3 px-3`}
              onClick={() => setAddingProduct(true)}
            >
              <i className="bi bi-plus-lg"></i>
              <span className="ms-1 d-none d-sm-inline">
                {t("products.create") || "Tạo mới"}
              </span>
            </button>

            <button className={`btn btn-outline-${theme} d-flex align-items-center fw-semibold rounded-3 px-3`}>
              <i className="bi bi-upload"></i>
              <span className="ms-1 d-none d-md-inline">
                {t("products.import") || "Nhập file"}
              </span>
            </button>

            <button
              className={`btn btn-outline-${theme} d-flex align-items-center fw-semibold rounded-3 px-3`}
              onClick={() => exportProductsToExcel(filtered, t)}
            >
              <i className="bi bi-download"></i>
              <span className="ms-1 d-none d-md-inline">
                {t("products.export") || "Xuất file"}
              </span>
            </button>

            <button
              className={`btn btn-outline-${theme} d-flex align-items-center fw-semibold rounded-3 px-3 position-relative`}
              onClick={handlePrintBarcode}
            >
              <i className="bi bi-upc"></i>
              <span className="ms-1 d-none d-md-inline">
                {t("products.printBarcode") || "In mã vạch"}
              </span>
              {selectedProducts.length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {selectedProducts.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ================= BODY ================= */}
        <div className="row g-3 mt-1">
          {/* ==== Sidebar bộ lọc ==== */}
          <aside className="col-lg-2 d-none d-lg-block">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <h6 className="fw-bold mb-4">
                  {t("products.filterTitle") || "Bộ lọc"}
                </h6>

                {/* Danh mục */}
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <label className="form-label mb-0">
                      {t("products.category") || "Danh mục"}
                    </label>
                    <button
                      className={`btn btn-outline-${theme} btn-sm p-0 rounded-circle`}
                      style={{ width: 22, height: 22 }}
                      onClick={handleAddCategory}
                    >
                      <i className="bi bi-plus-lg" style={{ fontSize: "11px" }}></i>
                    </button>
                  </div>
                  <select
                    className="form-select form-select-sm shadow-sm"
                    value={filters.category}
                    onChange={(e) => handleFilterChange("category", e.target.value)}
                  >
                    <option value="">Chọn danh mục</option>
                    <option value="Danh mục A">Danh mục A</option>
                    <option value="Danh mục B">Danh mục B</option>
                  </select>
                </div>

                {/* Thương hiệu */}
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <label className="form-label mb-0">Thương hiệu</label>
                    <button
                      className={`btn btn-outline-${theme} btn-sm p-0 rounded-circle`}
                      style={{ width: 22, height: 22 }}
                      onClick={() => alert("Thêm thương hiệu mới")}
                    >
                      <i className="bi bi-plus-lg" style={{ fontSize: "11px" }}></i>
                    </button>
                  </div>
                  <select
                    className="form-select form-select-sm shadow-sm"
                    value={filters.brand}
                    onChange={(e) => handleFilterChange("brand", e.target.value)}
                  >
                    <option value="">Chọn thương hiệu</option>
                    <option value="Thương hiệu A">Thương hiệu A</option>
                    <option value="Thương hiệu B">Thương hiệu B</option>
                    <option value="Thương hiệu C">Thương hiệu C</option>
                  </select>
                </div>

                {/* Nhà cung cấp */}
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <label className="form-label mb-0">Nhà cung cấp</label>
                    <button
                      className={`btn btn-outline-${theme} btn-sm p-0 rounded-circle`}
                      style={{ width: 22, height: 22 }}
                      onClick={() => alert("Thêm nhà cung cấp mới")}
                    >
                      <i className="bi bi-plus-lg" style={{ fontSize: "11px" }}></i>
                    </button>
                  </div>
                  <select
                    className="form-select form-select-sm shadow-sm"
                    value={filters.supplier}
                    onChange={(e) => handleFilterChange("supplier", e.target.value)}
                  >
                    <option value="">Chọn nhà cung cấp</option>
                    <option value="Nhà cung cấp A">Nhà cung cấp A</option>
                    <option value="Nhà cung cấp B">Nhà cung cấp B</option>
                  </select>
                </div>

                {/* Ngày tạo */}
                <div className="mb-4">
                  <label className="form-label fw-medium mb-2">Ngày tạo</label>
                  <input
                    type="date"
                    className={`form-control form-control-sm border-${theme} shadow-sm`}
                    value={filters.createdAt}
                    onChange={(e) => handleFilterChange("createdAt", e.target.value)}
                  />
                  <div className="form-text">Định dạng: dd/mm/yyyy</div>
                </div>

                {/* Tồn kho */}
                <div className="mb-4">
                  <label className="form-label fw-medium mb-2">Tồn kho</label>
                  <select
                    className="form-select form-select-sm shadow-sm"
                    value={filters.stock}
                    onChange={(e) => handleFilterChange("stock", e.target.value)}
                  >
                    <option value="all">Tất cả</option>
                    <option value="in">Còn hàng</option>
                    <option value="out">Hết hàng</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>

          {/* ==== Main Content ==== */}
          <main className="col-lg-10 col-12">
            {addingProduct && (
              <div className={`border border-${theme} rounded-3 mb-3 p-3 shadow-sm bg-body-tertiary`}>
                <AddProductCard onCancel={() => setAddingProduct(false)} onSave={handleAddNew} />
              </div>
            )}

            {/* ==== Bảng sản phẩm ==== */}
            <div className={`table-responsive rounded-2 border border-${theme} shadow-sm`}>
              <table className="table table-hover align-middle mb-0">
                <thead className={`table-${theme}`}>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input type="checkbox" checked={allChecked} onChange={handleSelectAll} />
                    </th>
                    <th>Mã SP</th>
                    <th></th>
                    <th>Tên sản phẩm</th>
                    <th>Thương hiệu</th>
                    <th>Giá bán</th>
                    <th>Giá vốn</th>
                    <th>Tồn kho</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.length > 0 ? (
                    currentRows.map((p) => (
                      <React.Fragment key={p.id}>
                        <tr
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            setSelectedProductId((prev) => (prev === p.id ? null : p.id))
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
                            <img src={p.image} alt="" className="rounded" style={{ width: 50, height: 50 }} />
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
                        {t("products.noData") || "Không có dữ liệu"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ==== PHÂN TRANG ==== */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="d-flex align-items-center gap-2">
                <span>Hiển thị</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: 130 }}
                  value={rowsPerPage >= filtered.length ? "all" : rowsPerPage}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "all") {
                      setRowsPerPage(filtered.length);
                    } else {
                      setRowsPerPage(Number(val));
                    }
                    setCurrentPage(1);
                  }}
                >
                  {[15, 20, 30, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n} hàng
                    </option>
                  ))}
                  <option value="all">Tất cả</option>
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
                <span className={`btn btn-${theme} text-white fw-bold`}>{currentPage}</span>
                <button
                  className={`btn btn-outline-${theme}`}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
