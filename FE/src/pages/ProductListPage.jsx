import React, { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { useTranslation } from "react-i18next";
import { exportProductsToExcel } from "../utils/exportProductsUtils";
import ProductHeaderBar from "../components/product/ProductHeaderBar";
import ProductFilterPanel from "../components/product/ProductFilterPanel";
import ProductTable from "../components/product/ProductTable";
import AddProductCard from "../components/common/AddProductCard";

export default function ProductListPage() {
  const { t } = useTranslation();

  // --- Fake Data ---
  const products = Array.from({ length: 30 }, (_, i) => ({
    id: `SP00${i + 1}`,
    barcode: `8934567890${i + 10}`, // ✅ thêm barcode demo
    name: `${t("products.product")} ${i + 1}`,
    category: i % 2 === 0 ? "Danh mục A" : "Danh mục B",
    brand: i % 2 ? "Thương hiệu B" : "Thương hiệu A",
    supplier: i % 2 === 0 ? "Nhà cung cấp A" : "Nhà cung cấp B",
    price: 10000 + i * 1000,
    cost: 8000 + i * 900,
    stock: 50 - i,
    createdAt: i % 2 === 0 ? "22/10/2025" : "21/10/2025",
    image: "https://via.placeholder.com/80x80.png?text=IMG",
  }));

  // --- STATE ---
  const [query, setQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState([]); // ✅ danh sách sản phẩm được chọn
  const [filters, setFilters] = useState({
    category: "",
    brand: "",
    supplier: "",
    stock: "all",
    createdAt: "",
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [addingProduct, setAddingProduct] = useState(false);

  // ✅ Thêm state quản lý danh sách filter động
  const [categories, setCategories] = useState(["Danh mục A", "Danh mục B"]);
  const [brands, setBrands] = useState(["Thương hiệu A", "Thương hiệu B"]);
  const [suppliers, setSuppliers] = useState(["Nhà cung cấp A", "Nhà cung cấp B"]);

  // --- HANDLERS ---
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  // ✅ Thêm mới danh mục / thương hiệu / NCC
  const handleAddCategory = (newCat) =>
    setCategories((prev) => [...prev, newCat]);
  const handleAddBrand = (newBrand) =>
    setBrands((prev) => [...prev, newBrand]);
  const handleAddSupplier = (newSup) =>
    setSuppliers((prev) => [...prev, newSup]);

  const handleAddNew = (newProduct) => {
    console.log(t("products.addedProduct"), newProduct);
    setAddingProduct(false);
  };

  const handleDelete = (id) => {
    if (window.confirm(t("common.confirmDelete"))) {
      console.log(t("products.deletedProduct"), id);
    }
  };

  const handleEdit = (updated) => {
    console.log(t("products.savedProduct"), updated);
    setEditingProduct(null);
  };

  // ✅ Lọc sản phẩm (tìm theo tên, ID, barcode, category, brand, supplier...)
  const filtered = products.filter((p) => {
    const queryLower = query.toLowerCase();

    const matchesQuery =
      p.name.toLowerCase().includes(queryLower) ||
      p.id.toLowerCase().includes(queryLower) ||
      (p.barcode && p.barcode.toLowerCase().includes(queryLower));

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
      p.createdAt === new Date(filters.createdAt).toLocaleDateString("vi-VN");

    return (
      matchesQuery &&
      matchesCategory &&
      matchesBrand &&
      matchesSupplier &&
      matchesStock &&
      matchesDate
    );
  });

  // ✅ Chọn sản phẩm (checkbox)
  const handleSelectOne = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked, currentPageItems) => {
    if (checked) {
      const allIds = currentPageItems.map((p) => p.id);
      setSelectedProducts((prev) => [...new Set([...prev, ...allIds])]);
    } else {
      const pageIds = currentPageItems.map((p) => p.id);
      setSelectedProducts((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  // ✅ In mã vạch cho sản phẩm được chọn
  const handlePrintBarcode = () => {
    const selectedList = products.filter((p) => selectedProducts.includes(p.id));
    if (selectedList.length === 0) {
      alert(t("products.selectToPrint") || "Vui lòng chọn sản phẩm để in mã vạch!");
      return;
    }

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
                  <small>${p.barcode || p.id}</small>
                </div>`
              )
              .join("")}
          </div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
          <script>
            const data = ${JSON.stringify(selectedList)};
            window.onload = () => {
              data.forEach((p, i) => JsBarcode("#barcode-" + i, p.barcode || p.id, { format: "CODE128" }));
              setTimeout(() => window.print(), 800);
            };
          </script>
        </body>
      </html>`;
    win.document.write(html);
    win.document.close();
  };

  // ✅ Xuất file Excel chỉ cho sản phẩm đã chọn
  const handleExportSelected = () => {
    const selectedList = products.filter((p) => selectedProducts.includes(p.id));
    if (selectedList.length === 0) {
      alert(t("products.selectToExport") || "Vui lòng chọn sản phẩm để xuất file!");
      return;
    }
    exportProductsToExcel(selectedList, t);
  };

  // --- JSX ---
  return (
    <MainLayout>
      <div className="container-fluid py-3">
        {/* Header */}
        <ProductHeaderBar
          query={query}
          setQuery={setQuery}
          onAdd={() => setAddingProduct(true)}
          onExport={handleExportSelected}
          onPrint={handlePrintBarcode}
        />

        {/* Popup thêm sản phẩm */}
        {addingProduct && (
          <div className="border border-primary rounded-3 mb-3 p-3 shadow-sm bg-body-tertiary">
            <AddProductCard
              onCancel={() => setAddingProduct(false)}
              onSave={handleAddNew}
            />
          </div>
        )}

        <div className="row g-3 mt-1">
          <ProductFilterPanel
            filters={filters}
            onChange={{
              addCategory: handleAddCategory,
              addBrand: handleAddBrand,
              addSupplier: handleAddSupplier,
              change: handleFilterChange,
            }}
            categories={categories}
            brands={brands}
            suppliers={suppliers}
          />

          <ProductTable
            products={filtered}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            selectedProducts={selectedProducts}
            onSelectOne={handleSelectOne}
            onSelectAll={handleSelectAll}
            onEdit={handleEdit}
            onDelete={handleDelete}
            editingProduct={editingProduct}
            setEditingProduct={setEditingProduct}
            selectedProductId={selectedProductId}
            setSelectedProductId={setSelectedProductId}
          />
        </div>
      </div>
    </MainLayout>
  );
}
