import React, { useState, useMemo, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

/* === Import các component con === */
import ImportHeader from "../components/import/ImportHeader";
import ImportTable from "../components/import/ImportTable";
import ImportFileModal from "../components/import/ImportFileModal";

export default function ImportDetailPage() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation();

  /* === Demo danh sách sản phẩm === */
  const productList = useMemo(
    () => [
      {
        product_id: "SP001",
        barcode: "8938505970011",
        cost_of_capital: 85000,
        selling_price: 120000,
        product_name: "Áo Thun Nam Cotton Trơn",
        quantity_in_stock: 120,
        unit: "Cái",
      },
      {
        product_id: "SP002",
        barcode: "8938505970028",
        cost_of_capital: 190000,
        selling_price: 250000,
        product_name: "Quần Jean Nữ Lưng Cao",
        quantity_in_stock: 80,
        unit: "Cái",
      },
      {
        product_id: "SP003",
        barcode: "8938505970035",
        cost_of_capital: 420000,
        selling_price: 600000,
        product_name: "Giày Sneaker Trắng Classic",
        quantity_in_stock: 60,
        unit: "Đôi",
      },
    ],
    []
  );

  /* === STATE === */
  const importData = state?.importData || null;
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

  /* === Load dữ liệu khi chỉnh sửa phiếu === */
  useEffect(() => {
    if (importData) {
      setSupplier(importData.supplier);
      setStatus(importData.status);
      setNote(importData.note || "");
      setTotal(importData.total || 0);
    }
  }, [importData]);

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
          p.barcode.toLowerCase() === value.toLowerCase() ||
          p.product_id.toLowerCase() === value.toLowerCase()
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
    if (!window.confirm(t("import.confirmDelete") || "Bạn có chắc muốn xóa sản phẩm này không?")) return;
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

  /* === Lưu / Hoàn thành === */
  const handleSave = () => {
    setStatus("Phiếu tạm");
    alert("💾 Phiếu đã lưu tạm!");
    navigate("/products/importlist");
  };

  const handleComplete = () => {
    setStatus("Hoàn thành");
    alert("✅ Phiếu nhập hoàn thành!");
    navigate("/products/importlist");
  };

  /* === JSX === */
  return (
    <MainLayout>
      <div className="container-fluid py-3">
        {/* HEADER */}
        <ImportHeader
          theme={theme}
          barcodeMode={barcodeMode}
          setBarcodeMode={setBarcodeMode}
          searchValue={searchValue}
          handleChangeSearch={handleChangeSearch}
          searchResults={searchResults}
          handleSelectSearchResult={handleAddProduct}
          setShowImportPopup={setShowImportPopup}
        />

        {/* TABLE */}
        <div className="row g-3">
          <div className="col-lg-9">
            <ImportTable
              theme={theme}
              items={items}
              updateItem={updateItem}
              total={total}
              onDeleteItem={handleDeleteItem}
            />
          </div>

          {/* FORM NHẬP PHIẾU */}
          <div className="col-lg-3">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <label className="form-label fw-semibold mb-1">
                  {t("import.supplier") || "Nhà cung cấp"}
                </label>
                <select
                  className="form-select mb-3"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                >
                  <option value="">Chọn nhà cung cấp</option>
                  <option value="Pharmedic">Công ty Pharmedic</option>
                  <option value="Citigo">Công ty TNHH Citigo</option>
                  <option value="Hồng Phúc">Đại lý Hồng Phúc</option>
                </select>

                <label className="form-label mb-1">
                  {t("import.total") || "Tổng tiền hàng"}
                </label>
                <input type="number" className="form-control text-end" value={total} disabled />

                <label className="form-label mb-1 mt-2">
                  {t("import.discount") || "Giảm giá"}
                </label>
                <input
                  type="number"
                  className="form-control text-end"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />

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

        {/* MODAL NHẬP FILE */}
        {showImportPopup && (
          <ImportFileModal
            theme={theme}
            handleImportFile={handleImportFile}
            onClose={() => setShowImportPopup(false)}
          />
        )}
      </div>
    </MainLayout>
  );
}
