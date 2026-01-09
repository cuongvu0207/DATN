import React, { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import ConfirmImportDialog from "../components/notifications/ConfirmImportDialog";

/* === Import child components === */
import ImportHeader from "../components/import/ImportHeader";
import ImportTable from "../components/import/ImportTable";
import ImportFileModal from "../components/import/ImportFileModal";
import AddProductCard from "../components/common/AddProductCard";
import SupplierAddCard from "../components/import/SupplierAddCard";
import { API_BASE_URL } from "../services/api";
import { formatCurrency } from "../utils/formatters";

export default function ImportDetailPage() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation();

  const defaultUnitLabel = t("import.defaultUnit");
  const loadProductsErrorMessage = t("import.errors.loadProducts");
  const loadSuppliersErrorMessage = t("import.errors.loadSuppliers");
  const payloadLogMessage = t("import.logs.payload");

  /* === STATE === */
  const [productList, setProductList] = useState([]); // Data fetched from API
  const [supplier, setSupplier] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState(t("import.draft"));
  const [total, setTotal] = useState(0);
  const [discount, setDiscount] = useState(0); // (giữ lại nếu bạn dùng ở chỗ khác)
  const [items, setItems] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showImportPopup, setShowImportPopup] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [importFile, setImportFile] = useState(null);
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);

  const token = localStorage.getItem("accessToken");

  /* === Load product data from backend === */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/inventory/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const formatted = res.data.map((p) => ({
          product_id: p.productId?.toString(),
          barcode: p.barcode,
          cost_of_capital: p.costOfCapital,
          selling_price: p.sellingPrice,
          product_name: p.productName,
          quantity_in_stock: p.quantityInStock,
          unit: p.unit || defaultUnitLabel,
        }));

        setProductList(formatted);
      } catch (error) {
        console.error(loadProductsErrorMessage, error);
      }
    };

    fetchProducts();
  }, [token, defaultUnitLabel, loadProductsErrorMessage]);

  /* === Load supplier data from backend === */
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/inventory/supplier`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuppliers(res.data || []);
      } catch (error) {
        console.error(loadSuppliersErrorMessage, error);
      }
    };

    fetchSuppliers();
  }, [token, loadSuppliersErrorMessage]);

  /* === Populate state when editing === */
  useEffect(() => {
    if (state?.importData) {
      const { importData } = state;
      setSupplier(importData.supplier);
      setStatus(importData.status);
      setNote(importData.note || "");
      setTotal(importData.total || 0);
    }
  }, [state]);

  /* === Calculate total === */
  const recalcTotal = (data) => {
    const sum = data.reduce((acc, i) => acc + (Number(i.subtotal) || 0), 0);
    setTotal(sum);
  };

  /* === Add product === */
  const handleAddProduct = (product) => {
    const exists = items.find((i) => i.product_id === product.product_id);
    if (exists) {
      const updated = items.map((i) =>
        i.product_id === product.product_id
          ? {
              ...i,
              quantity: (Number(i.quantity) || 0) + 1,
              subtotal:
                ((Number(i.quantity) || 0) + 1) * (Number(i.importPrice) || 0) -
                (Number(i.discount) || 0),
            }
          : i
      );
      setItems(updated);
      recalcTotal(updated);
      return;
    }

    const newItem = {
      ...product,
      quantity: 1,
      importPrice: Number(product.cost_of_capital) || 0,
      discount: 0,
      subtotal: Number(product.cost_of_capital) || 0,
    };
    const updated = [...items, newItem];
    setItems(updated);
    recalcTotal(updated);
  };

  /* === Search products === */
  const handleChangeSearch = (e) => {
    const value = e.target.value.trim();
    setSearchValue(value);

    if (value === "") {
      setSearchResults([]);
      return;
    }

    if (barcodeMode) {
      const found = productList.find(
        (p) =>
          (p.barcode || "").toLowerCase() === value.toLowerCase() ||
          (p.product_id || "").toLowerCase() === value.toLowerCase()
      );
      if (found) {
        handleAddProduct(found);
        setSearchValue("");
        setSearchResults([]);
      }
      return;
    }

    const filtered = productList.filter((p) => {
      const name = (p.product_name || "").toLowerCase();
      const pid = (p.product_id || "").toLowerCase();
      const bc = (p.barcode || "").toLowerCase();
      const v = value.toLowerCase();
      return name.includes(v) || pid.includes(v) || bc.includes(v);
    });
    setSearchResults(filtered);
  };

  /* === Update table values === */
  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    const q = Number(updated[index].quantity) || 0;
    const p = Number(updated[index].importPrice) || 0;
    const d = Number(updated[index].discount) || 0;
    updated[index].subtotal = q * p - d;

    setItems(updated);
    recalcTotal(updated);
  };

  /* === Delete product === */
  const handleDeleteItem = (index) => {
    if (!window.confirm(t("import.confirmDelete"))) return;
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    recalcTotal(updated);
  };

  /* ==========================
     ✅ Parse Excel / CSV file
     - Nhận header TRÙNG với file mẫu xuất ra:
       Mã vạch | Tên sản phẩm | Đơn vị | Số lượng | Đơn giá | Giảm giá
     ========================== */
  const parseImportFile = (file) =>
    new Promise((resolve, reject) => {
      if (!file) {
        resolve([]);
        return;
      }

      const reader = new FileReader();
      const ext = file.name.split(".").pop().toLowerCase();

      reader.onload = (evt) => {
        try {
          let data = [];

          if (ext === "csv") {
            const textContent = evt.target.result;
            const rows = textContent
              .replace(/\r\n/g, "\n")
              .split("\n")
              .filter((r) => r.trim() !== "");

            if (rows.length === 0) {
              resolve([]);
              return;
            }

            const header = rows[0].split(",").map((h) => h.trim());
            const body = rows.slice(1);

            data = body.map((r) => {
              const values = r.split(",");
              const obj = {};
              header.forEach((h, idx) => (obj[h] = values[idx]?.trim() || ""));
              return obj;
            });
          } else if (ext === "xlsx" || ext === "xls") {
            const workbook = XLSX.read(evt.target.result, { type: "binary" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
          } else {
            reject(new Error("Unsupported file format"));
            return;
          }

          // ✅ Header mapping: ưu tiên đúng chuẩn file mẫu + giữ alias cũ + giữ i18n
          const headerKeys = {
            barcode: [
              "Mã vạch",
              "Ma vach",
              "Mã hàng",
              "Ma hang",
              "Barcode",
              "Product Code",
              t("import.templateHeaders.barcode"),
            ],
            name: [
              "Tên sản phẩm",
              "Ten san pham",
              "Tên hàng",
              "Ten hang",
              "Product Name",
              t("import.templateHeaders.name"),
            ],
            unit: [
              "Đơn vị",
              "Don vi",
              "Đơn vị tính",
              "Don vi tinh",
              "DVT",
              "Unit",
              t("import.templateHeaders.unit"),
            ],
            quantity: [
              "Số lượng",
              "So luong",
              "Quantity",
              t("import.templateHeaders.quantity"),
            ],
            price: [
              "Đơn giá",
              "Don gia",
              "Giá nhập",
              "Gia nhap",
              "Import Price",
              "Price",
              t("import.templateHeaders.price"),
            ],
            discount: [
              "Giảm giá",
              "Giam gia",
              "Discount",
              t("import.templateHeaders.discount"),
            ],
          };

          const pickValue = (row, keys, fallback = "") => {
            for (const key of keys) {
              if (row[key] !== undefined && row[key] !== "") return row[key];
            }
            return fallback;
          };

          const formatted = data.map((r, idx) => {
            const quantityValue = Number(pickValue(r, headerKeys.quantity, 1)) || 1;
            const priceValue = Number(pickValue(r, headerKeys.price, 0)) || 0;
            const discountValue = Number(pickValue(r, headerKeys.discount, 0)) || 0;

            return {
              barcode: pickValue(r, headerKeys.barcode, `00000${idx + 1}`),
              product_name: pickValue(
                r,
                headerKeys.name,
                t("import.unnamedProduct")
              ),
              unit: pickValue(r, headerKeys.unit, defaultUnitLabel),
              quantity: quantityValue,
              importPrice: priceValue,
              discount: discountValue,
              subtotal: quantityValue * priceValue - discountValue,
            };
          });

          resolve(formatted);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error(t("import.errors.readFile")));

      if (ext === "csv") reader.readAsText(file, "UTF-8");
      else reader.readAsBinaryString(file);
    });

  const handleConfirmImportFile = async () => {
    if (!importFile) {
      alert(t("import.alerts.selectFile"));
      return;
    }
    try {
      const formatted = await parseImportFile(importFile);

      // ✅ Merge chống trùng theo barcode (nếu muốn cho phép trùng thì nói mình bỏ đoạn này)
      const map = new Map();
      [...items, ...formatted].forEach((it) => {
        const key = (it.barcode || "").trim().toLowerCase();
        if (!key) return;

        if (!map.has(key)) {
          map.set(key, { ...it });
        } else {
          // cộng dồn số lượng + giữ giá/giảm giá theo dòng mới nhất
          const prev = map.get(key);
          const newQty = (Number(prev.quantity) || 0) + (Number(it.quantity) || 0);
          const price = Number(it.importPrice) || Number(prev.importPrice) || 0;
          const disc = Number(it.discount) || Number(prev.discount) || 0;

          map.set(key, {
            ...prev,
            ...it,
            quantity: newQty,
            importPrice: price,
            discount: disc,
            subtotal: newQty * price - disc,
          });
        }
      });

      const merged = Array.from(map.values());

      setItems(merged);
      recalcTotal(merged);
      setImportFile(null);
      setShowImportPopup(false);
      alert(t("import.alerts.importSuccess"));
    } catch (error) {
      console.error("Import file failed:", error);
      console.error(t("import.errors.readFile"), error);
      alert(t("import.alerts.submitFail"));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImportFile(file);
  };

  /* ==========================
     ✅ Download template (TRÙNG CỘT CẦN NHẬP)
     ========================== */
  const handleDownloadTemplate = () => {
    // Header chuẩn y như bảng nhập
    const headers = ["Mã vạch", "Tên sản phẩm", "Đơn vị", "Số lượng", "Đơn giá", "Giảm giá"];

    // Dòng mẫu
    const sample = ["8935000000012", "Bút bi Thiên Long", "cây", 10, 5000, 0];

    const rows = [headers, sample];

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Độ rộng cột cho dễ nhìn
    worksheet["!cols"] = [
      { wch: 18 }, // Mã vạch
      { wch: 30 }, // Tên sản phẩm
      { wch: 12 }, // Đơn vị
      { wch: 10 }, // Số lượng
      { wch: 12 }, // Đơn giá
      { wch: 12 }, // Giảm giá
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ImportTemplate");

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const tempLink = document.createElement("a");
    tempLink.href = url;
    tempLink.download = "import_template.xlsx";
    tempLink.click();
    URL.revokeObjectURL(url);
  };

  /* === Submit import data === */
  const sendImportData = async (isComplete) => {
    try {
      if (!supplier) {
        alert(t("import.alerts.requireSupplier"));
        return;
      }
      if (items.length === 0) {
        alert(t("import.alerts.emptyItems"));
        return;
      }

      const payload = {
        supplierId: Number(supplier),
        complete: isComplete,
        note,
        details: items.map((item) => ({
          barcode: item.barcode,
          productName: item.product_name,
          unit: item.unit || defaultUnitLabel,
          quantity: Number(item.quantity),
          price: Number(item.importPrice),
          discount: Number(item.discount),
        })),
      };

      console.log(payloadLogMessage, payload);

      await axios.post(`${API_BASE_URL}/inventory/import-product`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (isComplete) alert(t("import.alerts.completed"));
      else alert(t("import.alerts.savedDraft"));

      navigate("/products/import");
    } catch (error) {
      console.error(t("import.errors.submit"), error);
      alert(t("import.alerts.submitFail"));
    }
  };

  const handleAddRow = () => {
    const newItem = {
      barcode: "",
      product_name: "",
      unit: defaultUnitLabel,
      quantity: 1,
      importPrice: 0,
      discount: 0,
      subtotal: 0,
    };
    const updated = [...items, newItem];
    setItems(updated);
  };

  /* === Save and complete buttons === */
  const handleSave = () => sendImportData(false);
  const handleComplete = () => sendImportData(true);

  /* === JSX === */
  return (
    <MainLayout>
      <div className="container-fluid py-3">
        <ImportHeader
          theme={theme}
          barcodeMode={barcodeMode}
          setBarcodeMode={setBarcodeMode}
          searchValue={searchValue}
          handleChangeSearch={handleChangeSearch}
          searchResults={searchResults}
          handleSelectSearchResult={handleAddProduct}
          setShowImportPopup={setShowImportPopup}
          onAddProductClick={() => setShowAddProduct(true)}
        />

        <div className="row g-3">
          <div className="col-lg-9">
            <ImportTable
              theme={theme}
              items={items}
              updateItem={updateItem}
              total={total}
              onDeleteItem={handleDeleteItem}
              onAddRow={handleAddRow}
            />
          </div>

          <div className="col-lg-3">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <label className="form-label fw-semibold mb-0">
                    {t("import.supplier")}
                  </label>
                  <button
                    type="button"
                    className={`btn btn-outline-${theme} btn-sm d-flex align-items-center`}
                    onClick={() => setShowAddSupplier(true)}
                  >
                    <i className="bi bi-plus-lg"></i>
                  </button>
                </div>

                <select
                  className="form-select mb-3"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                >
                  <option value="">{t("import.selectsupplier")}</option>
                  {suppliers.map((s) => (
                    <option key={s.supplierId} value={s.supplierId}>
                      {s.supplierName}
                    </option>
                  ))}
                </select>

                <label className="form-label mb-1">{t("import.total")}</label>
                <input
                  type="text"
                  className="form-control text-end"
                  value={formatCurrency(total || 0)}
                  readOnly
                />

                <label className="form-label mb-1 mt-2">{t("import.note")}</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder={t("import.notePlaceholder")}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                ></textarea>

                <div className="d-flex justify-content-between mt-4">
                  <button
                    className={`btn btn-outline-${theme} w-50 me-2`}
                    onClick={handleSave}
                  >
                    <i className="bi bi-lock me-1"></i> {t("import.saveDraft")}
                  </button>

                  <button
                    className={`btn btn-${theme} text-white w-50`}
                    onClick={() => setShowConfirmComplete(true)}
                  >
                    <i className="bi bi-check2-circle me-1"></i> {t("import.complete")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showImportPopup && (
          <ImportFileModal
            theme={theme}
            onFileChange={handleFileChange}
            onConfirm={handleConfirmImportFile}
            onDownloadTemplate={handleDownloadTemplate}
            hasFile={!!importFile}
            onClose={() => {
              setShowImportPopup(false);
              setImportFile(null);
            }}
          />
        )}

        {showAddProduct && (
          <AddProductCard
            onCancel={() => setShowAddProduct(false)}
            onSave={(newProduct) => {
              const newItem = {
                product_id: newProduct.id,
                barcode: newProduct.barcode,
                product_name: newProduct.name,
                importPrice: Number(newProduct.cost) || 0,
                unit: defaultUnitLabel,
                discount: 0,
                quantity: 1,
                subtotal: Number(newProduct.cost) || 0,
              };
              const updated = [...items, newItem];
              setItems(updated);
              recalcTotal(updated);
              alert(t("import.alerts.addProductSuccess"));
            }}
          />
        )}

        {showAddSupplier && (
          <div
            className="modal fade show"
            style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className={`modal-header bg-${theme} text-white py-2 px-3`}>
                  <h6 className="modal-title m-0">
                    <i className="bi bi-building-add me-2"></i>
                    {t("supplier.addTitle")}
                  </h6>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowAddSupplier(false)}
                  ></button>
                </div>

                <div className="modal-body">
                  <SupplierAddCard
                    onSave={(newSupplier) => {
                      setSuppliers((prev) => [...prev, newSupplier]);
                      setSupplier(newSupplier.supplierId?.toString() || "");
                      setShowAddSupplier(false);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmImportDialog
        show={showConfirmComplete}
        supplierName={suppliers.find((s) => s.supplierId == supplier)?.supplierName || ""}
        itemCount={items.length}
        totalAmount={total}
        onCancel={() => setShowConfirmComplete(false)}
        onConfirm={() => {
          setShowConfirmComplete(false);
          sendImportData(true);
        }}
      />
    </MainLayout>
  );
}
