import React, { useState, useEffect } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../services/api";
import { exportProductsToExcel } from "../utils/exportProductsUtils";
import ProductHeaderBar from "../components/product/ProductHeaderBar";
import ProductFilterPanel from "../components/product/ProductFilterPanel";
import ProductTable from "../components/product/ProductTable";
import AddProductCard from "../components/common/AddProductCard";

export default function ProductListPage() {
  const { t } = useTranslation();

  // --- STATE ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: "",
    brand: "",
    supplier: "",
    stock: "all",
  });

  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [addingProduct, setAddingProduct] = useState(false);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const token = localStorage.getItem("accessToken");

  // --- AXIOS INSTANCE ---
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  /* ==============================
      🔹 LẤY DANH SÁCH SẢN PHẨM
     ============================== */
  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosInstance.get("/inventory/products");
      const formatted = (data || []).map((p) => ({
        id: p?.productId?.toString() || "",
        barcode: p?.barcode || "",
        name: p?.productName || t("products.unnamed"),
        category: p?.categoryName || t("products.uncategorized"),
        brand: "",
        supplier: "",
        unit: p?.unit || "",
        price: p?.sellingPrice || 0,
        cost: 0,
        stock: p?.quantityInStock || 0,
        createdAt: p?.lastUpdated
          ? new Date(p.lastUpdated).toLocaleDateString("vi-VN")
          : "",
        image: "https://via.placeholder.com/80x80.png?text=No+Image",
      }));

      setProducts(formatted);
      setCategories([...new Set(formatted.map((p) => p.category).filter(Boolean))]);
      setBrands([...new Set(formatted.map((p) => p.brand).filter(Boolean))]);
      setSuppliers([...new Set(formatted.map((p) => p.supplier).filter(Boolean))]);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError(t("products.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  /* ==============================
      🔹 THÊM SẢN PHẨM
     ============================== */
  const handleAddNew = async (newProduct) => {
    try {
      await axiosInstance.post("/inventory/products", {
        productName: newProduct.name,
        categoryName: newProduct.category,
        unit: newProduct.unit,
        barcode: newProduct.barcode,
        sellingPrice: newProduct.price,
        quantityInStock: newProduct.stock,
      });
      alert(t("products.addSuccess") || "Thêm sản phẩm thành công!");
      setAddingProduct(false);
      fetchProducts();
    } catch (err) {
      console.error("❌ Lỗi thêm sản phẩm:", err);
      alert(t("products.addError") || "Không thể thêm sản phẩm!");
    }
  };

  /* ==============================
      🔹 SỬA SẢN PHẨM
     ============================== */
  const handleEdit = async (updated) => {
    try {
      await axiosInstance.put(`/inventory/products/${updated.id}`, {
        productId: updated.id,
        productName: updated.name,
        categoryName: updated.category,
        unit: updated.unit,
        barcode: updated.barcode,
        sellingPrice: updated.price,
        quantityInStock: updated.stock,
      });
      alert(t("products.updateSuccess") || "Cập nhật thành công!");
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error("❌ Lỗi cập nhật:", err);
      alert(t("products.updateError") || "Không thể cập nhật sản phẩm!");
    }
  };

  /* ==============================
      🔹 XOÁ SẢN PHẨM
     ============================== */
  const handleDelete = async (id) => {
    if (!window.confirm(t("common.confirmDelete") || "Bạn có chắc muốn xoá?")) return;
    try {
      await axiosInstance.delete(`/inventory/products/${id}`);
      alert(t("products.deleteSuccess") || "Đã xoá sản phẩm thành công!");
      fetchProducts();
    } catch (err) {
      console.error("❌ Lỗi xoá sản phẩm:", err);
      alert(t("products.deleteError") || "Không thể xoá sản phẩm!");
    }
  };

  /* ==============================
      🔹 BỘ LỌC & TÌM KIẾM
     ============================== */
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const filtered = products.filter((p) => {
    const queryLower = (query || "").toLowerCase();
    const matchesQuery =
      (p.name?.toLowerCase?.() || "").includes(queryLower) ||
      (p.id?.toLowerCase?.() || "").includes(queryLower) ||
      (p.barcode?.toLowerCase?.() || "").includes(queryLower);

    const matchesCategory = !filters.category || p.category === filters.category;
    const matchesBrand = !filters.brand || p.brand === filters.brand;
    const matchesSupplier = !filters.supplier || p.supplier === filters.supplier;
    const matchesStock =
      filters.stock === "all"
        ? true
        : filters.stock === "in"
        ? p.stock > 0
        : p.stock === 0;

    return (
      matchesQuery &&
      matchesCategory &&
      matchesBrand &&
      matchesSupplier &&
      matchesStock
    );
  });

  /* ==============================
      🔹 EXPORT + PRINT
     ============================== */
  const handleExportSelected = () => {
    const selectedList = products.filter((p) => selectedProducts.includes(p.id));
    if (selectedList.length === 0) return alert(t("products.selectToExport"));
    exportProductsToExcel(selectedList, t);
  };

  const handlePrintBarcode = () => {
    const selectedList = products.filter((p) => selectedProducts.includes(p.id));
    if (selectedList.length === 0) return alert(t("products.selectToPrint"));

    const win = window.open("", "_blank");
    const html = `
      <html>
        <head>
          <title>${t("products.barcodeTitle")}</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
            .item { text-align: center; border: 1px solid #ccc; border-radius: 8px; padding: 10px; }
          </style>
        </head>
        <body>
          <h2>${t("products.barcodeTitle")}</h2>
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

  /* ==============================
      🔹 RENDER
     ============================== */
  return (
    <MainLayout>
      <div className="container-fluid py-3">
        <ProductHeaderBar
          query={query}
          setQuery={setQuery}
          onAdd={() => setAddingProduct(true)}
          onExport={handleExportSelected}
          onPrint={handlePrintBarcode}
        />

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
              addCategory: (cat) => setCategories((prev) => [...prev, cat]),
              addBrand: (brand) => setBrands((prev) => [...prev, brand]),
              addSupplier: (sup) => setSuppliers((prev) => [...prev, sup]),
              change: handleFilterChange,
            }}
            categories={categories}
            brands={brands}
            suppliers={suppliers}
          />

          {loading ? (
            <p className="text-center mt-3">{t("common.loadingProducts")}</p>
          ) : error ? (
            <p className="text-center text-danger mt-3">{error}</p>
          ) : (
            <ProductTable
              products={filtered}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              selectedProducts={selectedProducts}
              onSelectOne={(id) =>
                setSelectedProducts((prev) =>
                  prev.includes(id)
                    ? prev.filter((x) => x !== id)
                    : [...prev, id]
                )
              }
              onSelectAll={(checked, currentPageItems) => {
                if (checked) {
                  const allIds = currentPageItems.map((p) => p.id);
                  setSelectedProducts((prev) => [
                    ...new Set([...prev, ...allIds]),
                  ]);
                } else {
                  const pageIds = currentPageItems.map((p) => p.id);
                  setSelectedProducts((prev) =>
                    prev.filter((id) => !pageIds.includes(id))
                  );
                }
              }}
              onEdit={handleEdit}
              onDelete={handleDelete}
              editingProduct={editingProduct}
              setEditingProduct={setEditingProduct}
              selectedProductId={selectedProductId}
              setSelectedProductId={setSelectedProductId}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
