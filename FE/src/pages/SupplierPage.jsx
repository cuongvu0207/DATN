import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../services/api";
import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";

import SupplierAddCard from "../components/import/SupplierAddCard";

export default function SupplierPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const token = localStorage.getItem("accessToken");

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  // edit
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

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
      // ✅ KHÔNG alert ở page nữa (để card xử lý alert; page chỉ log)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===== Mở modal Add ===== */
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingSupplier(null);
    setShowModal(true);
  };

  /* ===== Mở modal Edit ===== */
  const openEditModal = (supplier) => {
    setIsEditMode(true);
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  /* ===== Update local list sau khi card PUT thành công =====
     Lưu ý: SupplierAddCard đã PUT + alert rồi, page chỉ cập nhật state */
  const applyUpdatedSupplierToList = (updatedSupplier) => {
    const id = updatedSupplier?.supplierId ?? editingSupplier?.supplierId;
    if (!id) return;

    setSuppliers((prev) =>
      (prev || []).map((s) =>
        s?.supplierId === id ? { ...s, ...updatedSupplier } : s
      )
    );

    setShowModal(false);
    setIsEditMode(false);
    setEditingSupplier(null);
  };

  /* ===== Add local list sau khi card POST thành công ===== */
  const appendNewSupplierToList = (newSupplier) => {
    setSuppliers((prev) => [...(prev || []), newSupplier]);
    setShowModal(false);
  };

  /* ===== Bộ lọc tìm kiếm ===== */
  const q = (search || "").toLowerCase();
  const filteredSuppliers = (suppliers || []).filter((s) => {
    const name = String(s?.supplierName || "").toLowerCase();
    const phone = String(s?.phone || "").toLowerCase();
    const email = String(s?.email || "").toLowerCase();
    return !q || name.includes(q) || phone.includes(q) || email.includes(q);
  });

  return (
    <MainLayout>
      <div className="container-fluid py-3 px-4">
        {/* HEADER */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3 flex-wrap flex-grow-1">
            <h4 className={`fw-bold  mb-0 text-nowrap`}>
              {t("supplier.title") || "Quản lý nhà cung cấp"}
            </h4>

            {/* Search */}
            <div className="position-relative flex-grow-1" style={{ minWidth: 260 }}>
              <i
                className={`bi bi-search position-absolute top-50 start-0 translate-middle-y ps-3 text-${theme}`}
                style={{ opacity: 0.7 }}
              />
              <input
                type="text"
                className="form-control ps-5"
                style={{ height: 40 }}
                placeholder={t("supplier.searchPlaceholder") || "Tìm kiếm nhà cung cấp..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Add */}
          <button
            className={`btn btn-${theme} fw-semibold d-flex align-items-center rounded-3 px-3`}
            onClick={openAddModal}
          >
            <i className="bi bi-plus-circle me-1"></i>
            {t("supplier.addButton") || "Thêm nhà cung cấp"}
          </button>
        </div>

        {/* TABLE */}
        {loading ? (
          <p className="text-center my-3">{t("common.loading") || "Đang tải..."}</p>
        ) : (
          <div className="table-responsive rounded-3 shadow-sm">
            <table className="table table-hover align-middle mb-0">
              <thead
                className={`table-${theme}`}
                style={{ position: "sticky", top: 0, zIndex: 2 }}
              >
                <tr>
                  <th>#</th>
                  <th>{t("supplier.name") || "Tên nhà cung cấp"}</th>
                  <th>{t("supplier.phone") || "Số điện thoại"}</th>
                  <th>{t("supplier.email") || "Email"}</th>
                  <th>{t("supplier.address") || "Địa chỉ"}</th>
                  <th>{t("supplier.note") || "Ghi chú"}</th>
                  <th>{t("supplier.actions", "Hành động")}</th>
                </tr>
              </thead>

              <tbody>
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((s, i) => (
                    <tr key={s?.supplierId ?? i}>
                      <td>{i + 1}</td>
                      <td>{s?.supplierName || "—"}</td>
                      <td>{s?.phone || "—"}</td>
                      <td>{s?.email || "—"}</td>
                      <td>{s?.address || "—"}</td>
                      <td>{s?.note || "—"}</td>
                      <td>
                        <button
                          className={`btn btn-outline-${theme} btn-sm`}
                          onClick={() => openEditModal(s)}
                          title={t("common.edit") || "Chỉnh sửa"}
                        >
                          <i className="bi bi-pencil-square"></i>
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
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className={`modal-header bg-${theme} text-white`}>
                <h5 className="modal-title">
                  <i
                    className={`bi ${
                      isEditMode ? "bi-pencil-square" : "bi-building-add"
                    } me-2`}
                  />
                  {isEditMode
                    ? t("supplier.editTitle") || "Chỉnh sửa nhà cung cấp"
                    : t("supplier.addTitle") || "Thêm nhà cung cấp mới"}
                </h5>
                <button className="btn-close btn-close-white" onClick={closeModal} />
              </div>

              <div className="modal-body">
                <SupplierAddCard
                  initialData={isEditMode ? editingSupplier : null}
                  onSave={(payload) => {
                    // ✅ KHÔNG alert ở đây nữa (card đã alert)
                    if (isEditMode) {
                      applyUpdatedSupplierToList(payload);
                    } else {
                      appendNewSupplierToList(payload);
                    }
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
