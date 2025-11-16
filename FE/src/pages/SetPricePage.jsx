import React, { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import { API_BASE_URL } from "../services/api";
import { formatCurrency } from "../utils/formatters";

export default function SetPricePage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const token = localStorage.getItem("accessToken");
  const resolveText = (key, fallback) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatingBarcode, setUpdatingBarcode] = useState(null);

  /* === FETCH DATA FROM API === */
  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/inventory/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formatted = (res.data || []).map((item) => {
        const sellingPrice = Number(item.sellingPrice || 0);
        const discountValue = Number(item.discount || 0);
        return {
          id: item.productId ? String(item.productId) : "",
          barcode: item.barcode || "",
          name: item.productName || "Kh�ng c� t�n",
          brand: item.brandName || t("products.unknownBrand"),
          category: item.categoryName || t("products.unknownCategory"),
          cost: Number(item.costOfCapital || 0),
          price: sellingPrice,
          draftPrice: sellingPrice,
          discount: discountValue,
          draftDiscount: discountValue,
          createdAt: item.lastUpdated
            ? new Date(item.lastUpdated).toLocaleDateString("vi-VN")
            : "",
          image: item.image
            ? `${API_BASE_URL}/uploads/${item.image}`
            : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23dee2e6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='%23777'%3EIMG%3C/text%3E%3C/svg%3E",
        };
      });

      setProducts(formatted);
    } catch (err) {
      console.error(err);
      setError(t("prices.loadFail") || "Kh�ng th? t?i danh s�ch s?n ph?m!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  /* === UPDATE PRICE === */
  const attemptPut = (segment, payload) =>
    axios.put(
      `${API_BASE_URL}/inventory/products/${segment}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

  const updatePrice = async (product, newPrice) => {
    const payload = {
      sellingPrice: Number(newPrice),
    };
    const candidates = [
      product.id ? `${product.id}/price` : null,
      product.barcode ? `${product.barcode}/price` : null,
    ].filter(Boolean);

    let lastError;
    for (const path of candidates) {
      try {
        await attemptPut(path, payload);
        return;
      } catch (err) {
        if (err?.response?.status !== 404) throw err;
        lastError = err;
      }
    }
    if (lastError) throw lastError;
    throw new Error("No valid identifier for price update.");
  };

  /* === UPDATE DISCOUNT === */
  const updateDiscount = async (product, newDiscount) => {
    const payload = {
      discount: Number(newDiscount),
    };
    const candidates = [
      product.id ? `${product.id}/discount` : null,
      product.barcode ? `${product.barcode}/discount` : null,
    ].filter(Boolean);

    let lastError;
    for (const path of candidates) {
      try {
        await attemptPut(path, payload);
        return;
      } catch (err) {
        if (err?.response?.status !== 404) throw err;
        lastError = err;
      }
    }
    if (lastError) throw lastError;
    throw new Error("No valid identifier for discount update.");
  };

  const handleDraftChange = (barcode, field, value) => {
    if (Number(value) < 0) return;
    setProducts((prev) =>
      prev.map((p) =>
        p.barcode === barcode ? { ...p, [field]: Number(value) } : p
      )
    );
  };

  const handleConfirmUpdate = async (barcode, productId) => {
    const current = products.find((p) => p.barcode === barcode);
    if (!current) return;

    const priceChanged = current.draftPrice !== current.price;
    const discountChanged = current.draftDiscount !== current.discount;

    if (!priceChanged && !discountChanged) {
      alert(resolveText("prices.noChange", "Khong co thay doi."));
      return;
    }

    const confirmed =
      window.confirm(
        resolveText(
          "prices.confirmUpdate",
          "Xac nhan cap nhat gia/khuyen mai cho san pham nay?"
        )
      );
    if (!confirmed) return;

    setUpdatingBarcode(barcode);
    try {
      if (priceChanged) {
        await updatePrice(current, current.draftPrice);
      }
      if (discountChanged) {
        await updateDiscount(current, current.draftDiscount);
      }
      setProducts((prev) =>
        prev.map((p) =>
          p.barcode === barcode
            ? { ...p, price: p.draftPrice, discount: p.draftDiscount }
            : p
        )
      );
      alert(resolveText("prices.updateSuccess", "Da cap nhat thanh cong!"));
    } catch (err) {
      console.error(err);
      alert(
        resolveText(
          "prices.updateFail",
          "Khong the cap nhat. Vui long thu lai."
        )
      );
    } finally {
      setUpdatingBarcode(null);
    }
  };

  /* === FILTER & PAGINATION === */
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
  const rowsSelectValue = rowsPerPage > 100 ? "all" : rowsPerPage;
  const headerCellStyle = { whiteSpace: "nowrap" };

  /* === UI LAYOUT === */
  return (
    <MainLayout>
      <div className="container-fluid py-3">
        {/* ===== HEADER ===== */}
        <div className="row align-items-center gy-2 mb-3">
          <div className="col-md-3">
            <h4 className="fw-bold mb-0">
              {t("prices.title") || "Thi?t l?p gi� & gi?m gi�"}
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
                  "T�m ki?m theo m� v?ch ho?c t�n s?n ph?m"
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
        <div
          className="table-responsive rounded-3 shadow-sm" style={{ borderRadius: 16, overflow: "hidden", paddingRight: 8, paddingBottom: 8, backgroundColor: "#fff" }}
        >
          <div style={{ maxHeight: "60vh", overflowX: "auto", overflowY: "auto", borderRadius: 12 }}><table className="table align-middle table-hover mb-0">
            <thead className={`table-${theme}`} style={{ position: "sticky", top: 0, zIndex: 2 }}>
                <tr>
                  <th style={{ ...headerCellStyle, width: 40 }}>
                    <input
                      type="checkbox"
                      checked={
                        selectedProducts.length > 0 &&
                        selectedProducts.length === filtered.length
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th style={headerCellStyle}>{t("products.barcode") || "Ma vach"}</th>
                  <th style={headerCellStyle}></th>
                  <th style={headerCellStyle}>{t("products.name") || "Ten san pham"}</th>
                  <th style={headerCellStyle}>{t("products.category") || "Danh muc"}</th>
                  <th style={headerCellStyle}>{t("products.brand") || "Thuong hieu"}</th>
                  <th style={headerCellStyle}>{t("products.cost") || "Gia von"}</th>
                  <th style={headerCellStyle}>{t("products.price") || "Gia ban"}</th>
                  <th style={headerCellStyle}>{t("products.discount") || "Giam gia (%)"}</th>
                  <th style={headerCellStyle}>{t("products.createdAt") || "Ngay cap nhat"}</th>
                  <th style={headerCellStyle}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="text-center py-4">
                      <div className="spinner-border text-primary" />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={11} className="text-center text-danger py-3">
                      {error}
                    </td>
                  </tr>
                ) : currentRows.length > 0 ? (
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
                      <td>{formatCurrency(p.cost)}</td>

                      {/* Gi� b�n */}
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={p.draftPrice}
                          onChange={(e) =>
                            handleDraftChange(
                              p.barcode,
                              "draftPrice",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      {/* Gi?m gi� (%) */}
                      <td>
                        <div className="input-group input-group-sm">
                          <input
                            type="number"
                            className="form-control"
                            value={p.draftDiscount}
                            onChange={(e) =>
                              handleDraftChange(
                                p.barcode,
                                "draftDiscount",
                                e.target.value
                              )
                            }
                          />
                          <span className="input-group-text">%</span>
                        </div>
                      </td>

                      <td>{p.createdAt}</td>
                      <td>
                        <button
                          className={`btn btn-sm btn-${theme}`}
                          onClick={() => handleConfirmUpdate(p.barcode, p.id)}
                          disabled={updatingBarcode === p.barcode}
                        >
                          {updatingBarcode === p.barcode
                            ? t("common.saving") || "Dang luu..."
                            : t("common.save") || "Luu"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="text-center text-muted py-3">
                      {t("common.noData") || "Kh�ng c� d? li?u ph� h?p"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== PAGINATION ===== */}
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="d-flex align-items-center gap-2">
            <span>{t("common.show")}</span>
            <select
              className="form-select form-select-sm"
              style={{ width: 130 }}
              value={rowsSelectValue}
              onChange={(e) => {
                const val = e.target.value;
                setRowsPerPage(val === "all" ? Number.MAX_SAFE_INTEGER : Number(val));
                setCurrentPage(1);
              }}
            >
              {[15, 30, 50, 100].map((n) => (
                <option key={n} value={n}>{`${n} ${t("common.rows")}`}</option>
              ))}
              <option value="all">{t("common.all") || "All"}</option>
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




