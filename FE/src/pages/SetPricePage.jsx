import React, { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import { API_BASE_URL } from "../services/api";

export default function SetPricePage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const token = localStorage.getItem("accessToken");

  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* === FETCH DỮ LIỆU TỪ API === */
  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/inventory/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formatted = (res.data || []).map((item) => ({
        barcode: item.barcode || "",
        name: item.productName || "Không có tên",
        brand: item.brandName || t("products.unknownBrand"),
        category: item.categoryName || t("products.unknownCategory"),
        cost: Number(item.costOfCapital || 0),
        price: Number(item.sellingPrice || 0),
        discount: Number(item.discount || 0),
        createdAt: item.lastUpdated
          ? new Date(item.lastUpdated).toLocaleDateString("vi-VN")
          : "",
        image: item.image
          ? `${API_BASE_URL}/uploads/${item.image}`
          : "https://via.placeholder.com/80x80.png?text=IMG",
      }));

      setProducts(formatted);
    } catch (err) {
      console.error(err);
      setError(t("prices.loadFail") || "Không thể tải danh sách sản phẩm!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  /* === CẬP NHẬT GIÁ BÁN === */
  const updatePrice = async (barcode, newPrice) => {
    try {
      await axios.put(
        `${API_BASE_URL}/inventory/products/${barcode}/price`,
        { sellingPrice: Number(newPrice) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts((prev) =>
        prev.map((p) =>
          p.barcode === barcode ? { ...p, price: Number(newPrice) } : p
        )
      );
      alert(t("prices.updatePriceSuccess"));
    } catch (err) {
      console.error(err);
      alert(t("prices.updatePriceFail"));
    }
  };

  /* === CẬP NHẬT GIẢM GIÁ === */
  const updateDiscount = async (barcode, newDiscount) => {
    try {
      await axios.put(
        `${API_BASE_URL}/inventory/products/${barcode}/discount`,
        { discount: Number(newDiscount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts((prev) =>
        prev.map((p) =>
          p.barcode === barcode
            ? { ...p, discount: Number(newDiscount) }
            : p
        )
      );
      alert(t("prices.updateDiscountSuccess"));
    } catch (err) {
      console.error(err);
      alert(t("prices.updateDiscountFail"));
    }
  };

  /* === LỌC & PHÂN TRANG === */
  const filtered = products.filter(
    (p) =>
      p.barcode.toLowerCase().includes(query.toLowerCase()) ||
      p.name.toLowerCase().includes(query.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentRows = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedProducts(filtered.map((p) => p.barcode));
    else setSelectedProducts([]);
  };

  const handleSelectOne = (barcode) => {
    setSelectedProducts((prev) =>
      prev.includes(barcode)
        ? prev.filter((x) => x !== barcode)
        : [...prev, barcode]
    );
  };

  /* === GIAO DIỆN === */
  return (
    <MainLayout>
      <div className="container-fluid py-3">
        {/* ===== HEADER ===== */}
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
                placeholder={
                  t("prices.searchPlaceholder") ||
                  "Tìm kiếm theo mã vạch hoặc tên sản phẩm"
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-4 d-flex justify-content-end gap-2">
            <button
              className={`btn btn-outline-${theme} fw-semibold`}
              onClick={fetchProducts}
            >
              <i className="bi bi-arrow-repeat"></i> {t("common.refresh")}
            </button>
          </div>
        </div>

        {/* ===== BODY ===== */}
        <div className="table-responsive border rounded-3 shadow-sm">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
            </div>
          ) : error ? (
            <div className="text-danger text-center py-3">{error}</div>
          ) : (
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
                  <th>{t("products.barcode") || "Mã vạch"}</th>
                  <th></th>
                  <th>{t("products.name") || "Tên sản phẩm"}</th>
                  <th>{t("products.category") || "Danh mục"}</th>
                  <th>{t("products.brand") || "Thương hiệu"}</th>
                  <th>{t("products.cost") || "Giá vốn"}</th>
                  <th>{t("products.price") || "Giá bán"}</th>
                  <th>{t("products.discount") || "Giảm giá (%)"}</th>
                  <th>{t("products.createdAt") || "Ngày cập nhật"}</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.length > 0 ? (
                  currentRows.map((p) => (
                    <tr key={p.barcode}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(p.barcode)}
                          onChange={() => handleSelectOne(p.barcode)}
                        />
                      </td>
                      <td>{p.barcode}</td>
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

                      {/* Giá bán */}
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          defaultValue={p.price}
                          onBlur={(e) =>
                            updatePrice(p.barcode, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              updatePrice(p.barcode, e.target.value);
                            }
                          }}
                        />
                      </td>

                      {/* Giảm giá (%) */}
                      <td>
                        <div className="input-group input-group-sm">
                          <input
                            type="number"
                            className="form-control"
                            defaultValue={p.discount}
                            onBlur={(e) =>
                              updateDiscount(p.barcode, e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                updateDiscount(p.barcode, e.target.value);
                              }
                            }}
                          />
                          <span className="input-group-text">%</span>
                        </div>
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
          )}
        </div>

        {/* ===== PHÂN TRANG ===== */}
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="d-flex align-items-center gap-2">
            <span>{t("common.show")}</span>
            <select
              className="form-select form-select-sm"
              style={{ width: 130 }}
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
            >
              {[10, 15, 20, 30, 50].map((n) => (
                <option key={n} value={n}>{`${n} ${t("common.rows")}`}</option>
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
