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
import ProductBulkUploadModal from "../components/product/ProductBulkUploadModal";


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
    category: "all",
    brand: "all",
    supplier: "all",
    stockLevel: "all", // ✅ all | above | below
  });

  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkStatus, setBulkStatus] = useState(null);

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
        brand: p?.brandName || "",
        supplier:
          p?.supplierName ||
          p?.supplier?.supplierName ||
          p?.supplier ||
          "",
        unit: p?.unit || "",
        price: p?.sellingPrice || 0,
        cost: p?.costOfCapital || 0,
        stock: p?.quantityInStock || 0,
        minimumStock: p?.minimumStock || 0,

        statusBoolean: p?.isActive ?? true,

        status: p?.isActive
          ? t("products.active")
          : t("products.inactive"),

        createdAt: p?.lastUpdated
          ? new Date(p.lastUpdated).toLocaleDateString("vi-VN")
          : "",
        image: p?.image || "",
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
      🔹 BATCH IMPORT
     ============================== */
  const handleOpenBulkModal = () => {
    setBulkStatus(null);
    setShowBulkModal(true);
  };

  const handleCloseBulkModal = () => {
    setShowBulkModal(false);
    setBulkProcessing(false);
  };

  const handleBulkFileSelect = async (file) => {
    if (!file) return;

    setBulkProcessing(true);
    setBulkStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await axios.post(
        `${API_BASE_URL}/inventory/import-product/upload-excel`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setBulkStatus({
        type: "success",
        message: data.message || "Nhập hàng thành công!",
        details: data.importDetails,
      });

      // 🔥 reload lại danh sách sản phẩm sau khi import
      fetchProducts();
    } catch (err) {
      console.error("❌ Lỗi import:", err);

      setBulkStatus({
        type: "error",
        message: "Import thất bại!",
      });
    } finally {
      setBulkProcessing(false);
    }
  };


  const handleSheetImport = (sheetUrl) => {
    if (!sheetUrl) return;
    setBulkProcessing(true);
    setBulkStatus(null);

    setTimeout(() => {
      setBulkProcessing(false);
      setBulkStatus({
        type: "success",
        message: t("products.bulkUpload.sheetQueued") || "Đã nhận Google Sheet!",
      });
    }, 800);
  };

  /* ==============================
      🔹 THÊM SẢN PHẨM
     ============================== */
  const handleAddNew = async (newProduct) => {
    try {
      const formData = new FormData();

      formData.append("productName", newProduct.name);
      formData.append("unit", newProduct.unit || "");
      formData.append("barcode", newProduct.barcode);
      formData.append("sellingPrice", newProduct.price);
      formData.append("costOfCapital", newProduct.cost || 0);
      formData.append("quantityInStock", newProduct.stock);
      formData.append("minimumStock", newProduct.minimumStock || 0);
      // formData.append("isActive", true);
      formData.append("categoryId", newProduct.categoryId || 1);
      formData.append("brandId", newProduct.brandId || 1);

      if (newProduct.imageFile) {
        formData.append("file", newProduct.imageFile);
      }

      await axios.post(`${API_BASE_URL}/inventory/products`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert(t("products.addSuccess"));
      setAddingProduct(false);
      fetchProducts();
    } catch (err) {
      console.error("❌ Lỗi thêm sản phẩm:", err);
      alert(t("products.addError"));
    }
  };

  /* ==============================
      🔹 SỬA SẢN PHẨM
     ============================== */
  const handleEdit = async (updated) => {
    try {
      const formData = new FormData();

      // Các field text phải append vào FormData

      formData.append("productName", updated.name);
      formData.append("barcode", updated.barcode);
      formData.append("unit", updated.unit || "");
      formData.append("sellingPrice", updated.price || 0);
      formData.append("costOfCapital", updated.cost || 0);
      formData.append("quantityInStock", updated.stock || 0);
      formData.append("minimumStock", updated.minimumStock || 0);
      // formData.append("isActive", updated.statusBoolean);
      formData.append("categoryId", updated.categoryId || "");
      formData.append("brandId", updated.brandId || "");

      // 🔥 Nếu người dùng CHỌN ẢNH MỚI
      if (updated.imageFile) {
        formData.append("file", updated.imageFile);
      }

      const token = localStorage.getItem("accessToken");

      await axios.put(
        `${API_BASE_URL}/inventory/products/${updated.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );




      alert(t("products.updateSuccess"));
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error("❌ Lỗi cập nhật:", err);
      alert(t("products.updateError"));
    }
  };




  /* ==============================
      🔹 KÍCH HOẠT / VÔ HIỆU HOÁ
     ============================== */
  const handleToggleActive = async (product) => {
    try {
      const formData = new FormData();

      // --- Append các field text ---
      formData.append("productName", product.name);
      formData.append("barcode", product.barcode);
      formData.append("unit", product.unit || "");
      formData.append("sellingPrice", product.price || 0);
      formData.append("costOfCapital", product.cost || 0);
      formData.append("quantityInStock", product.stock || 0);
      formData.append("minimumStock", Number(product.minimumStock || 0));

      // 🔥 Toggle trạng thái
      formData.append("isActive", !product.statusBoolean);

      formData.append("categoryId", product.categoryId || "");
      formData.append("brandId", product.brandId || "");

      // ❌ Không đổi ảnh nên KHÔNG append file

      const token = localStorage.getItem("accessToken");

      await axios.put(
        `${API_BASE_URL}/inventory/products/${product.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert(
        !product.statusBoolean
          ? t("products.activated") || "Đã kích hoạt!"
          : t("products.deactivated") || "Đã vô hiệu hóa!"
      );

      fetchProducts();
    } catch (err) {
      console.error("❌ Toggle Error:", err);
      alert(t("products.updateError") || "Không thể cập nhật sản phẩm!");
    }
  };



  /* ==============================
      🔹 LỌC + TÌM KIẾM
     ============================== */
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const filtered = products.filter((p) => {
    const queryLower = (query || "").toLowerCase();
    const matchesQuery =
      p.name.toLowerCase().includes(queryLower) ||
      p.barcode.toLowerCase().includes(queryLower) ||
      p.id.toLowerCase().includes(queryLower);

    const matchesCategory =
      !filters.category || filters.category === "all" || p.category === filters.category;

    const matchesBrand =
      !filters.brand || filters.brand === "all" || p.brand === filters.brand;

    const matchesSupplier =
      !filters.supplier || filters.supplier === "all" || p.supplier === filters.supplier;

    const stock = Number(p.stock || 0);
    const minStock = Number(p.minimumStock || 0);

    const matchesStockLevel =
      !filters.stockLevel || filters.stockLevel === "all"
        ? true
        : filters.stockLevel === "above"
          ? stock > minStock
          : stock <= minStock; // below

    return (
      matchesQuery &&
      matchesCategory &&
      matchesBrand &&
      matchesSupplier &&
      matchesStockLevel
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
          onImport={handleOpenBulkModal}
          onExport={handleExportSelected}
          onPrint={handlePrintBarcode}
        />

        {addingProduct && (
          <AddProductCard
            onCancel={() => setAddingProduct(false)}
            onSave={handleAddNew}
          />
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
                setSelectedProducts((prev) => [...new Set([...prev, ...allIds])]);
              } else {
                const pageIds = currentPageItems.map((p) => p.id);
                setSelectedProducts((prev) =>
                  prev.filter((id) => !pageIds.includes(id))
                );
              }
            }}
            onEdit={handleEdit}
            onToggleActive={handleToggleActive}
            editingProduct={editingProduct}
            setEditingProduct={setEditingProduct}
            selectedProductId={selectedProductId}
            setSelectedProductId={setSelectedProductId}
            isLoading={loading}
            fetchError={error}
          />
        </div>
      </div>

      <ProductBulkUploadModal
        show={showBulkModal}
        onClose={handleCloseBulkModal}
        onFileSelect={handleBulkFileSelect}
        onSheetImport={handleSheetImport}
        isProcessing={bulkProcessing}
        status={bulkStatus}
      />
    </MainLayout>
  );
}
