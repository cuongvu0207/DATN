import React, { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import { API_BASE_URL } from "../services/api";
import { formatCurrency } from "../utils/formatters";
import TablePagination from "../components/common/TablePagination";

export default function SetPricePage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const token = localStorage.getItem("accessToken");

  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    brand: "all",
  });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [selectedProducts, setSelectedProducts] = useState([]); // chứa id sản phẩm
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  /* ================================
      FETCH SẢN PHẨM TỪ API
  ================================= */
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
          name: item.productName || t("products.unnamed"),
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
        };
      });

      setProducts(formatted);

      // set filter options
      setCategories([
        ...new Set(
          formatted
            .map((p) => p.category)
            .filter((v) => v && v !== t("products.unknownCategory"))
        ),
      ]);
      setBrands([
        ...new Set(
          formatted
            .map((p) => p.brand)
            .filter((v) => v && v !== t("products.unknownBrand"))
        ),
      ]);
    } catch (err) {
      console.error(err);
      setError(
        t("prices.loadFail") || "Không thể tải danh sách sản phẩm!"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================================
      API UPDATE GIÁ & GIẢM GIÁ
  ================================= */
  const updatePrice = async (product, newPrice) => {
    const formData = new FormData();
    formData.append("sellingPrice", Number(newPrice));
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
  };

  const updateDiscount = async (product, newDiscount) => {
    const formData = new FormData();
    formData.append("sellingPrice", product.price || 0);
    // Chỉ khác: thêm discount
    formData.append("discount", Number(newDiscount));
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
  };

  /* ================================
      HANDLER CHỈNH GIÁ / GIẢM GIÁ
  ================================= */
  const handleDraftChange = (id, field, value) => {
    if (Number(value) < 0) return;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, [field]: Number(value) } : p
      )
    );
  };

  const handleConfirmUpdate = async (product) => {
    const priceChanged = product.draftPrice !== product.price;
    const discountChanged = product.draftDiscount !== product.discount;

    if (!priceChanged && !discountChanged) {
      alert(t("prices.noChange") || "Không có thay đổi để lưu.");
      return;
    }

    const confirmed = window.confirm(
      t("prices.confirmUpdate") ||
        "Bạn có chắc muốn cập nhật giá / giảm giá cho sản phẩm này?"
    );
    if (!confirmed) return;

    setUpdatingId(product.id);
    try {
      if (priceChanged) {
        await updatePrice(product, product.draftPrice);
      }
      if (discountChanged) {
        await updateDiscount(product, product.draftDiscount);
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                price: p.draftPrice,
                discount: p.draftDiscount,
              }
            : p
        )
      );
      alert(t("prices.updateSuccess") || "Cập nhật thành công!");
    } catch (err) {
      console.error(err);
      alert(t("prices.updateFail") || "Không thể cập nhật giá!");
    } finally {
      setUpdatingId(null);
    }
  };

  /* ================================
      FILTER & SEARCH
  ================================= */
  const filtered = products.filter((p) => {
    const q = (query || "").toLowerCase();

    const matchesQuery =
      p.barcode.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q);

    const matchesCategory =
      filters.category === "all" || p.category === filters.category;

    const matchesBrand =
      filters.brand === "all" || p.brand === filters.brand;

    return matchesQuery && matchesCategory && matchesBrand;
  });

  const totalItems = filtered.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentRows = filtered.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  const rowsSelectValue =
    rowsPerPage >= totalItems && totalItems > 0 ? "all" : rowsPerPage;

  const handleRowsPerPageChange = (value) => {
    const num =
      value === "all" ? (filtered.length || 1) : Number(value);
    setRowsPerPage(num);
    setCurrentPage(1);
  };

  /* ================================
      SELECT SẢN PHẨM & IN BẢNG GIÁ
  ================================= */
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(filtered.map((p) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const handlePrintSelected = () => {
    const selectedList = products.filter((p) =>
      selectedProducts.includes(p.id)
    );
    if (selectedList.length === 0) {
      alert(
        t("prices.selectToPrint") ||
          "Vui lòng chọn ít nhất một sản phẩm để in."
      );
      return;
    }

    const win = window.open("", "_blank");
    const title =
      t("prices.printTitle") || "BẢNG GIÁ SẢN PHẨM";

    const rowsHtml = selectedList
      .map(
        (p, idx) => `
      <tr>
        <td style="padding:6px 8px; border:1px solid #ccc; text-align:center;">${
          idx + 1
        }</td>
        <td style="padding:6px 8px; border:1px solid #ccc;">${
          p.barcode || ""
        }</td>
        <td style="padding:6px 8px; border:1px solid #ccc;">${
          p.name || ""
        }</td>
        <td style="padding:6px 8px; border:1px solid #ccc; text-align:right;">${formatCurrency(
          p.cost
        )}</td>
        <td style="padding:6px 8px; border:1px solid #ccc; text-align:right;">${formatCurrency(
          p.price
        )}</td>
        <td style="padding:6px 8px; border:1px solid #ccc; text-align:center;">${
          p.discount || 0
        }%</td>
      </tr>`
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; }
            h2 { text-align:center; margin-bottom: 16px; }
            table { border-collapse: collapse; width: 100%; font-size: 13px; }
            th { background:#f1f3f5; }
            @media print {
              button { display:none; }
            }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <table>
            <thead>
              <tr>
                <th style="padding:6px 8px; border:1px solid #ccc;">#</th>
                <th style="padding:6px 8px; border:1px solid #ccc;">${
                  t("products.barcode") || "Mã sản phẩm"
                }</th>
                <th style="padding:6px 8px; border:1px solid #ccc;">${
                  t("products.productName") || "Tên sản phẩm"
                }</th>
                <th style="padding:6px 8px; border:1px solid #ccc;">${
                  t("products.costOfCapital") || "Giá vốn"
                }</th>
                <th style="padding:6px 8px; border:1px solid #ccc;">${
                  t("products.sellingPrice") || "Giá bán"
                }</th>
                <th style="padding:6px 8px; border:1px solid #ccc;">${
                  t("products.discount") || "Giảm giá"
                }</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div style="margin-top:16px; text-align:right;">
            <button onclick="window.print()">In</button>
          </div>
        </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
  };

  /* ================================
      RENDER
  ================================= */
  const headerCellStyle = { whiteSpace: "nowrap" };

  return (
    <MainLayout>
      <div className="container-fluid py-3">
        {/* ===== PAGE HEADER (CHUẨN SẢN PHẨM) ===== */}
        <div className="row align-items-center gy-2 mb-3">

        {/* Tiêu đề */}
        <div className="col-12 col-md-3 col-lg-2">
          <h4 className="fw-bold mb-0">
            {t("prices.title") || "Thiết lập giá"}
          </h4>
        </div>

        {/* Ô tìm kiếm giống hệt ProductListPage */}
        <div className="col-12 col-md-5 col-lg-6">
          <div className="position-relative">
            <i 
              className={`bi bi-search position-absolute top-50 start-0 translate-middle-y ps-3 text-${theme}`} 
            />
            <input
              type="text"
              className="form-control ps-5"
              style={{
                height: 40,
                paddingLeft: 45,
                border: "1px solid #ced4da",
                boxShadow: "none",
                outline: "none",
              }}
              placeholder={
                t("prices.searchPlaceholder") || 
                "Tìm theo mã vạch hoặc tên sản phẩm"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Các nút thao tác: giống ProductListPage */}
        <div className="col-12 col-md-4 col-lg-4 d-flex justify-content-end gap-2 flex-wrap">

          {/* Làm mới */}
          <button
            className={`btn btn-outline-${theme} d-flex align-items-center fw-semibold rounded-3 px-3`}
            onClick={fetchProducts}
          >
            <i className="bi bi-arrow-repeat"></i>
            <span className="ms-1 d-none d-md-inline">{t("common.refresh")}</span>
          </button>

          {/* In tem */}
          <button
            className={`btn btn-${theme} text-white d-flex align-items-center fw-semibold rounded-3 px-3`}
            onClick={handlePrintSelected}
          >
            <i className="bi bi-printer"></i>
            <span className="ms-1 d-none d-md-inline">
              {t("prices.printButton") || "In tem"}
            </span>
          </button>

        </div>
        </div>


        {/* ===== BỘ LỌC ===== */}
        <div className="row g-3">
          {/* Filter panel bên trái giống ProductList */}
          <div className="col-lg-2 col-md-3">
            <div className="card shadow-sm border-0 rounded-3">
              <div className="card-body">
                <h6 className="fw-semibold mb-3">
                  {t("products.filters") || "Bộ lọc"}
                </h6>

                {/* Danh mục */}
                <div className="mb-3">
                  <label className="form-label">
                    {t("products.category") || "Danh mục"}
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={filters.category}
                    onChange={(e) => {
                      setFilters((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }));
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all">
                      {t("common.all") || "Tất cả"}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Thương hiệu */}
                <div className="mb-2">
                  <label className="form-label">
                    {t("products.brand") || "Thương hiệu"}
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={filters.brand}
                    onChange={(e) => {
                      setFilters((prev) => ({
                        ...prev,
                        brand: e.target.value,
                      }));
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all">
                      {t("common.all") || "Tất cả"}
                    </option>
                    {brands.map((br) => (
                      <option key={br} value={br}>
                        {br}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ===== BẢNG SẢN PHẨM ===== */}
          <div className="col-lg-10 col-md-9">
            <div
              className="table-responsive rounded-3 shadow-sm"
              style={{
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: "#fff",
              }}
            >
              <div
                style={{
                  maxHeight: "60vh",
                  overflowX: "auto",
                  overflowY: "auto",
                  borderRadius: 12,
                }}
              >
                <table className="table align-middle table-hover mb-0">
                  <thead
                    className={`table-${theme}`}
                    style={{ position: "sticky", top: 0, zIndex: 2 }}
                  >
                    <tr>
                      <th style={{ ...headerCellStyle, width: 40 }}>
                        <input
                          type="checkbox"
                          checked={
                            filtered.length > 0 &&
                            selectedProducts.length === filtered.length
                          }
                          onChange={(e) =>
                            handleSelectAll(e.target.checked)
                          }
                        />
                      </th>
                      <th style={headerCellStyle}>
                        {t("products.barcode") || "Mã sản phẩm"}
                      </th>
                      <th style={headerCellStyle}>
                        {t("products.productName") || "Tên sản phẩm"}
                      </th>
                      <th style={headerCellStyle}>
                        {t("products.costOfCapital") || "Giá vốn"}
                      </th>
                      <th style={headerCellStyle}>
                        {t("products.sellingPrice") || "Giá bán"}
                      </th>
                      <th style={headerCellStyle}>
                        {t("products.discount") || "Giảm giá (%)"}
                      </th>
                      <th style={headerCellStyle}></th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          <div className="spinner-border text-primary" />
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center text-danger py-3"
                        >
                          {error}
                        </td>
                      </tr>
                    ) : currentRows.length > 0 ? (
                      currentRows.map((p) => {
                        const priceChanged =
                          p.draftPrice !== p.price;
                        const discountChanged =
                          p.draftDiscount !== p.discount;

                        return (
                          <tr key={p.id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedProducts.includes(
                                  p.id
                                )}
                                onChange={() =>
                                  handleSelectOne(p.id)
                                }
                              />
                            </td>
                            <td>{p.barcode}</td>
                            <td>{p.name}</td>
                            <td>{formatCurrency(p.cost)}</td>

                            {/* Giá bán */}
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={p.draftPrice}
                                onChange={(e) =>
                                  handleDraftChange(
                                    p.id,
                                    "draftPrice",
                                    e.target.value
                                  )
                                }
                                style={
                                  priceChanged
                                    ? {
                                        background:
                                          "#fff3cd",
                                      }
                                    : {}
                                }
                              />
                            </td>

                            {/* Giảm giá (%) */}
                            <td>
                              <div className="input-group input-group-sm">
                                <input
                                  type="number"
                                  className="form-control"
                                  value={p.draftDiscount}
                                  onChange={(e) =>
                                    handleDraftChange(
                                      p.id,
                                      "draftDiscount",
                                      e.target.value
                                    )
                                  }
                                  style={
                                    discountChanged
                                      ? {
                                          background:
                                            "#fff3cd",
                                        }
                                      : {}
                                  }
                                />
                                <span className="input-group-text">
                                  %
                                </span>
                              </div>
                            </td>

                            <td>
                              <button
                                className={`btn btn-sm btn-${theme}`}
                                onClick={() =>
                                  handleConfirmUpdate(p)
                                }
                                disabled={updatingId === p.id}
                              >
                                {updatingId === p.id
                                  ? t("common.saving") ||
                                    "Đang lưu..."
                                  : t("common.save") || "Lưu"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center text-muted py-3"
                        >
                          {t("common.noData") ||
                            "Không có dữ liệu phù hợp"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <TablePagination
              currentPage={currentPage}
              totalItems={totalItems}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[15, 30, 50, 100]}
              rowsPerPageValue={rowsSelectValue}
              onPageChange={setCurrentPage}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
