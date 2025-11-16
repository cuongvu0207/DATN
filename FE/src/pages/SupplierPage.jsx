import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../services/api";
import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";

/* 🔹 Import component form thêm nhà cung cấp đã có */
import SupplierAddCard from "../components/import/SupplierAddCard";

export default function SupplierPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const token = localStorage.getItem("accessToken");

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  /* ===== Lấy danh sách nhà cung cấp ===== */
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/inventory/supplier`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppliers(res.data || []);
    } catch (err) {
      console.error(err);
      setError(t("supplier.loadFail") || "❌ Không thể tải danh sách nhà cung cấp!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  /* ===== Xóa nhà cung cấp ===== */
  const handleDelete = async (id) => {
    if (!window.confirm(t("supplier.confirmDelete") || "Bạn có chắc muốn xóa nhà cung cấp này?"))
      return;
    try {
      await axios.delete(`${API_BASE_URL}/inventory/supplier/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(t("supplier.deleteSuccess") || "🗑️ Đã xóa nhà cung cấp!");
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      setError(t("supplier.deleteFail") || "❌ Xóa thất bại!");
    }
  };

  /* ===== Bộ lọc tìm kiếm ===== */
  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  /* ===== Render ===== */
  return (
    <MainLayout>
      <div className="container-fluid py-3 px-4">
        {/* HEADER */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <h4 className={`fw-bold text-${theme} mb-0`}>
              {t("supplier.title") || "Quản lý nhà cung cấp"}
            </h4>

            {/* Ô tìm kiếm có biểu tượng */}
            <div className="position-relative" style={{ width: 380, maxWidth: "100%" }}>
              <i
                className="bi bi-search position-absolute"
                style={{
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  opacity: 0.6,
                }}
              ></i>
              <input
                type="text"
                className="form-control ps-5"
                placeholder={t("supplier.searchPlaceholder") || "Tìm kiếm nhà cung cấp..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Nút thêm NCC */}
          <button className={`btn btn-${theme}`} onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-circle me-1"></i>
            {t("supplier.addButton") || "Thêm nhà cung cấp"}
          </button>
        </div>

        {/* Thông báo */}
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* BẢNG DANH SÁCH NHÀ CUNG CẤP */}
        <div className="bg-white rounded-3 shadow-sm p-3">
          {loading ? (
            <p className="text-center my-3">{t("common.loading") || "Đang tải..."}</p>
          ) : (
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 2 }}>
                <tr>
                  <th>#</th>
                  <th>{t("supplier.name") || "Tên nhà cung cấp"}</th>
                  <th>{t("supplier.phone") || "Số điện thoại"}</th>
                  <th>{t("supplier.email") || "Email"}</th>
                  <th>{t("supplier.address") || "Địa chỉ"}</th>
                  <th>{t("supplier.note") || "Ghi chú"}</th>
                  <th>{t("supplier.actions") || "Hành động"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((s, i) => (
                    <tr key={s.supplierId}>
                      <td>{i + 1}</td>
                      <td>{s.supplierName}</td>
                      <td>{s.phone}</td>
                      <td>{s.email}</td>
                      <td>{s.address}</td>
                      <td>{s.note}</td>
                      <td>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(s.supplierId)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-3 text-muted">
                      {t("supplier.noData") || "Không có nhà cung cấp nào"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ===== MODAL (xổ giữa màn hình) để thêm nhà cung cấp ===== */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className={`modal-header bg-${theme} text-white`}>
                <h5 className="modal-title">
                  <i className="bi bi-building-add me-2"></i>
                  {t("supplier.addTitle") || "Thêm nhà cung cấp mới"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Gọi lại component SupplierAddCard đã có */}
                <SupplierAddCard
                  onSave={(newSupplier) => {
                    setSuppliers((prev) => [...prev, newSupplier]);
                    setShowModal(false);
                    setMessage(t("supplier.addSuccess") || "✅ Thêm nhà cung cấp thành công!");
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}


