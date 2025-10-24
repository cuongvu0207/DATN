import React, { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";

export default function SetPricePage() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // Demo dữ liệu
  const products = Array.from({ length: 30 }, (_, i) => ({
    id: `SP${(i + 1).toString().padStart(3, "0")}`,
    name: `${t("products.sampleName") || "Sản phẩm"} ${i + 1}`,
    brand: i % 2 === 0 ? `${t("products.brandA") || "Thương hiệu A"}` : `${t("products.brandB") || "Thương hiệu B"}`,
    category: i % 2 === 0 ? `${t("products.categoryA") || "Danh mục A"}` : `${t("products.categoryB") || "Danh mục B"}`,
    cost: 10000 + i * 500,
    price: 15000 + i * 800,
    discount: 5 + (i % 3) * 5,
    createdAt: i % 2 === 0 ? "22/10/2025" : "21/10/2025",
    image: "https://via.placeholder.com/80x80.png?text=IMG",
  }));

  const [query, setQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  // --- Lọc theo tên hoặc mã ---
  const filtered = products.filter(
    (p) =>
      p.id.toLowerCase().includes(query.toLowerCase()) ||
      p.name.toLowerCase().includes(query.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const currentRows = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // --- Chọn sản phẩm ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(filtered.map((p) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleChangePrice = (id, newPrice) => {
    console.log(`${t("prices.changePrice") || "Thay đổi giá"} ${id}: ${newPrice}`);
  };

  const handleChangeDiscount = (id, newDiscount) => {
    console.log(`${t("prices.changeDiscount") || "Thay đổi giảm giá"} ${id}: ${newDiscount}%`);
  };

  return (
    <MainLayout>
      <div className="container-fluid py-3">
        {/* ========== HEADER ========== */}
        <div className="row align-items-center gy-2 mb-3">
          <div className="col-md-3">
            <h4 className="fw-bold mb-0">
              {t("prices.title") || "Thiết lập giá & giảm giá"}
            </h4>
          </div>
          <div className="col-md-5">
            <div
              className={`input-group border border-${theme} rounded-3 align-items-center`}
              style={{ height: 40 }}
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
                className="form-control border-0 shadow-none"
                placeholder={t("prices.searchPlaceholder") || "Tìm kiếm theo mã hoặc tên sản phẩm"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-4 d-flex justify-content-end gap-2">
            <button className={`btn btn-outline-${theme} fw-semibold`}>
              <i className="bi bi-download"></i> {t("prices.export") || "Xuất file"}
            </button>
          </div>
        </div>

        {/* ========== BODY ========== */}
        <div className="table-responsive border rounded-3 shadow-sm">
          <table className="table align-middle table-hover mb-0">
            <thead className={`table-${theme}`}>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={
                      selectedProducts.length > 0 &&
                      selectedProducts.length === filtered.length
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th>{t("products.id") || "Mã SP"}</th>
                <th></th>
                <th>{t("products.name") || "Tên sản phẩm"}</th>
                <th>{t("products.category") || "Danh mục"}</th>
                <th>{t("products.brand") || "Thương hiệu"}</th>
                <th>{t("products.cost") || "Giá vốn"}</th>
                <th>{t("products.price") || "Giá bán"}</th>
                <th>{t("products.discount") || "Giảm giá (%)"}</th>
                <th>{t("products.createdAt") || "Ngày tạo"}</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length > 0 ? (
                currentRows.map((p) => (
                  <tr key={p.id}>
                    <td>
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
                    <td>{p.category}</td>
                    <td>{p.brand}</td>
                    <td>{p.cost.toLocaleString()}</td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        defaultValue={p.price}
                        onBlur={(e) => handleChangePrice(p.id, e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        defaultValue={p.discount}
                        onBlur={(e) => handleChangeDiscount(p.id, e.target.value)}
                      />
                    </td>
                    <td>{p.createdAt}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="text-center text-muted py-3">
                    {t("common.noData") || "Không có dữ liệu phù hợp"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ========== PHÂN TRANG ========== */}
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="d-flex align-items-center gap-2">
            <span>{t("common.show") || "Hiển thị"}</span>
            <select
              className="form-select form-select-sm"
              style={{ width: 130 }}
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
            >
              {[10, 15, 20, 30, 50].map((n) => (
                <option key={n} value={n}>{`${n} ${t("common.rows") || "hàng"}`}</option>
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
      </div>
    </MainLayout>
  );
}