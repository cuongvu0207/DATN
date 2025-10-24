import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function SupplierAddCard({ onSave }) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    supplierId: "",
    supplierName: "",
    address: "",
    email: "",
    phone: "",
    note: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (onSave) onSave(form);
    alert("✅ Đã thêm nhà cung cấp mới!");

    // Reset form sau khi lưu
    setForm({
      supplierId: "",
      supplierName: "",
      address: "",
      email: "",
      phone: "",
      note: "",
    });
  };

  return (
    <div className={`card border-${theme} shadow-sm`}>
      <div className={`card-header bg-${theme} text-white fw-semibold`}>
        <i className="bi bi-building-add me-2"></i>
        {t("supplier.addTitle") || "Thêm nhà cung cấp mới"}
      </div>

      <div className="card-body">
        <form onSubmit={handleSubmit} className="row g-3">
          {/* Mã NCC */}
          <div className="col-md-6">
            <label className="form-label fw-medium">
              {t("supplier.supplierId") || "Mã nhà cung cấp"}
            </label>
            <input
              type="text"
              name="supplierId"
              value={form.supplierId}
              onChange={handleChange}
              className="form-control"
              placeholder="Nhập mã NCC..."
              required
            />
          </div>

          {/* Tên NCC */}
          <div className="col-md-6">
            <label className="form-label fw-medium">
              {t("supplier.supplierName") || "Tên nhà cung cấp"}
            </label>
            <input
              type="text"
              name="supplierName"
              value={form.supplierName}
              onChange={handleChange}
              className="form-control"
              placeholder="Nhập tên nhà cung cấp..."
              required
            />
          </div>

          {/* Địa chỉ */}
          <div className="col-md-6">
            <label className="form-label fw-medium">
              {t("supplier.address") || "Địa chỉ"}
            </label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="form-control"
              placeholder="Nhập địa chỉ..."
            />
          </div>

          {/* Email */}
          <div className="col-md-6">
            <label className="form-label fw-medium">
              {t("supplier.email") || "Email"}
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="form-control"
              placeholder="Nhập email liên hệ..."
            />
          </div>

          {/* Số điện thoại */}
          <div className="col-md-6">
            <label className="form-label fw-medium">
              {t("supplier.phone") || "Số điện thoại"}
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="form-control"
              placeholder="Nhập số điện thoại..."
            />
          </div>

          {/* Ghi chú */}
          <div className="col-md-6">
            <label className="form-label fw-medium">
              {t("supplier.note") || "Ghi chú"}
            </label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              className="form-control"
              rows="2"
              placeholder="Ghi chú thêm (nếu có)..."
            ></textarea>
          </div>

          {/* Nút lưu */}
          <div className="col-12 text-end mt-3">
            <button
              type="submit"
              className={`btn btn-${theme} text-white fw-semibold`}
            >
              <i className="bi bi-save me-2"></i>
              {t("common.save") || "Lưu nhà cung cấp"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
