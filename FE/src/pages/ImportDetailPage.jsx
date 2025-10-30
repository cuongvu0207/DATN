import React, { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";

/* === Import các component con === */
import ImportHeader from "../components/import/ImportHeader";
import ImportTable from "../components/import/ImportTable";
import ImportFileModal from "../components/import/ImportFileModal";
import AddProductCard from "../components/common/AddProductCard";
import SupplierAddCard from "../components/import/SupplierAddCard";
import { API_BASE_URL } from "../services/api";

export default function ImportDetailPage() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation();

  /* === STATE === */
  const [productList, setProductList] = useState([]); // ✅ Lấy từ API
  const [supplier, setSupplier] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("Phiếu tạm");
  const [total, setTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showImportPopup, setShowImportPopup] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  const token = localStorage.getItem("accessToken");

  /* === Load dữ liệu sản phẩm thật từ BE === */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/inventory/products`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const formatted = res.data.map((p) => ({
          product_id: p.productId?.toString(),
          barcode: p.barcode,
          cost_of_capital: p.costOfCapital,
          selling_price: p.sellingPrice,
          product_name: p.productName,
          quantity_in_stock: p.quantityInStock,
          unit: p.unit || "Cái",
        }));

        setProductList(formatted);
      } catch (error) {
        console.error("❌ Lỗi tải danh sách sản phẩm:", error);
      }
    };

    fetchProducts();
  }, [token]);
  /* === Load danh sách nhà cung cấp thật từ BE === */
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/inventory/supplier`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSuppliers(res.data || []);
      } catch (error) {
        console.error("❌ Lỗi tải danh sách nhà cung cấp:", error);
      }
    };

    fetchSuppliers();
  }, [token]);
  /* === Load dữ liệu khi chỉnh sửa phiếu === */
  useEffect(() => {
    if (state?.importData) {
      const { importData } = state;
      setSupplier(importData.supplier);
      setStatus(importData.status);
      setNote(importData.note || "");
      setTotal(importData.total || 0);
    }
  }, [state]);

  /* === Tính tổng tiền === */
  const recalcTotal = (data) => {
    const sum = data.reduce((acc, i) => acc + (i.subtotal || 0), 0);
    setTotal(sum);
  };

  /* === Thêm sản phẩm === */
  const handleAddProduct = (product) => {
    const exists = items.find((i) => i.product_id === product.product_id);
    if (exists) {
      const updated = items.map((i) =>
        i.product_id === product.product_id
          ? {
              ...i,
              quantity: i.quantity + 1,
              subtotal: (i.quantity + 1) * i.importPrice - i.discount,
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
      importPrice: product.cost_of_capital,
      discount: 0,
      subtotal: product.cost_of_capital,
    };
    const updated = [...items, newItem];
    setItems(updated);
    recalcTotal(updated);
  };

  /* === Tìm kiếm sản phẩm === */
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
          p.barcode?.toLowerCase() === value.toLowerCase() ||
          p.product_id?.toLowerCase() === value.toLowerCase()
      );
      if (found) {
        handleAddProduct(found);
        setSearchValue("");
        setSearchResults([]);
      }
      return;
    }

    const filtered = productList.filter(
      (p) =>
        p.product_name.toLowerCase().includes(value.toLowerCase()) ||
        p.product_id.toLowerCase().includes(value.toLowerCase()) ||
        p.barcode.toLowerCase().includes(value.toLowerCase())
    );
    setSearchResults(filtered);
  };

  /* === Cập nhật giá trị trong bảng === */
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

  /* === Xóa sản phẩm === */
  const handleDeleteItem = (index) => {
    if (!window.confirm(t("import.confirmDelete") || "Bạn có chắc muốn xóa sản phẩm này không?"))
      return;
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    recalcTotal(updated);
  };

  /* === Đọc file Excel / CSV === */
  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const ext = file.name.split(".").pop().toLowerCase();

    reader.onload = (evt) => {
      let data = [];

      if (ext === "csv") {
        const text = evt.target.result;
        const rows = text.replace(/\r\n/g, "\n").split("\n").filter((r) => r.trim() !== "");
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
      }

      const formatted = data.map((r, idx) => ({
        barcode: r["Mã vạch"] || r["Barcode"] || `00000${idx + 1}`,
        product_name: r["Tên sản phẩm"] || "Không tên",
        unit: r["Đơn vị tính"] || r["ĐVT"] || "Cái",
        quantity: Number(r["Số lượng"]) || 1,
        importPrice: Number(r["Đơn giá"]) || Number(r["Giá nhập"]) || 0,
        discount: Number(r["Giảm giá"]) || 0,
        subtotal:
          (Number(r["Số lượng"]) || 1) * (Number(r["Đơn giá"]) || 0) -
          (Number(r["Giảm giá"]) || 0),
      }));

      const merged = [...items, ...formatted];
      setItems(merged);
      recalcTotal(merged);
      alert("✅ Nhập dữ liệu từ file Excel thành công!");
    };

    if (ext === "csv") reader.readAsText(file, "UTF-8");
    else reader.readAsBinaryString(file);
  };

 /* === Gửi dữ liệu lưu phiếu === */
const sendImportData = async (isComplete) => {
  try {
    if (!supplier) {
      alert("⚠️ Vui lòng chọn nhà cung cấp trước khi lưu!");
      return;
    }
    if (items.length === 0) {
      alert("⚠️ Danh sách sản phẩm trống!");
      return;
    }

    const payload = {
      supplierId: Number(supplier),
      complete: isComplete,
      note,
      details: items.map((item) => ({
        barcode: item.barcode,
        productName: item.product_name,
        unit: item.unit || "Cái",
        quantity: Number(item.quantity),
        price: Number(item.importPrice),
        discount: Number(item.discount),
      })),
    };

    console.log("📦 Payload gửi lên BE:", payload);

    const res = await axios.post(`${API_BASE_URL}/inventory/import-product`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (isComplete) {
      alert("✅ Phiếu nhập đã hoàn thành!");
    } else {
      alert("💾 Phiếu đã lưu tạm!");
    }

    navigate("/products/import");
  } catch (error) {
    console.error("❌ Lỗi khi gửi phiếu nhập:", error);
    alert("❌ Gửi phiếu nhập thất bại!");
  }
};

const handleAddRow = () => {
  const newItem = {
    barcode: "",
    product_name: "",
    unit: "Cái",
    quantity: 1,
    importPrice: 0,
    discount: 0,
    subtotal: 0,
  };
  const updated = [...items, newItem];
  setItems(updated);
};

/* === Nút lưu và hoàn thành === */
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
                    {t("import.supplier") || "Nhà cung cấp"}
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


                <label className="form-label mb-1">
                  {t("import.total") || "Tổng tiền hàng"}
                </label>
                <input type="number" className="form-control text-end" value={total} disabled />


                <label className="form-label mb-1 mt-2">
                  {t("import.note") || "Ghi chú"}
                </label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Nhập ghi chú..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                ></textarea>

                <div className="d-flex justify-content-between mt-4">
                  <button className={`btn btn-outline-${theme} w-50 me-2`} onClick={handleSave}>
                    <i className="bi bi-lock me-1"></i> {t("import.saveTemp") || "Lưu tạm"}
                  </button>
                  <button className={`btn btn-${theme} text-white w-50`} onClick={handleComplete}>
                    <i className="bi bi-check2-circle me-1"></i> {t("import.complete") || "Hoàn thành"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showImportPopup && (
          <ImportFileModal
            theme={theme}
            handleImportFile={handleImportFile}
            onClose={() => setShowImportPopup(false)}
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
                importPrice: Number(newProduct.cost),
                unit: "Cái",
                quantity: 1,
                discount: 0,
                subtotal: Number(newProduct.cost),
              };
              const updated = [...items, newItem];
              setItems(updated);
              recalcTotal(updated);
              setShowAddProduct(false);
              alert("✅ Đã thêm sản phẩm mới!");
            }}
          />
        )}

        {showAddSupplier && (
          <div
            className="modal fade show"
            style={{
              display: "block",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className={`modal-header bg-${theme} text-white py-2 px-3`}>
                  <h6 className="modal-title m-0">
                    <i className="bi bi-building-add me-2"></i>
                    {t("supplier.addTitle") || "Thêm nhà cung cấp mới"}
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
    </MainLayout>
  );
}
