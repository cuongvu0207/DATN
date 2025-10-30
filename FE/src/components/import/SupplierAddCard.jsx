import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { API_BASE_URL } from "../../services/api";

export default function SupplierAddCard({ onSave }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const token = localStorage.getItem("accessToken");

  const [form, setForm] = useState({
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/inventory/supplier`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newSupplier = res.data;
      alert(t("supplier.addSuccess") || "✅ Thêm nhà cung cấp thành công!");
      if (onSave) onSave(newSupplier);

      setForm({
        supplierName: "",
        address: "",
        email: "",
        phone: "",
        note: "",
      });
    } catch (err) {
      console.error("❌", err);
      alert(t("supplier.addFail") || "Không thể thêm nhà cung cấp!");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="row g-3">
      {/* Tên nhà cung cấp */}
      <div className="col-md-6">
        <label className="form-label fw-medium">
          {t("supplier.supplierName")}
        </label>
        <input
          type="text"
          name="supplierName"
          value={form.supplierName}
          onChange={handleChange}
          className="form-control"
          placeholder={t("supplier.placeholder.name")}
          required
        />
      </div>

      {/* Số điện thoại */}
      <div className="col-md-6">
        <label className="form-label fw-medium">{t("supplier.phone")}</label>
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="form-control"
          placeholder={t("supplier.placeholder.phone")}
        />
      </div>

      {/* Email */}
      <div className="col-md-6">
        <label className="form-label fw-medium">{t("supplier.email")}</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          className="form-control"
          placeholder={t("supplier.placeholder.email")}
        />
      </div>

      {/* Địa chỉ */}
      <div className="col-md-6">
        <label className="form-label fw-medium">{t("supplier.address")}</label>
        <input
          type="text"
          name="address"
          value={form.address}
          onChange={handleChange}
          className="form-control"
          placeholder={t("supplier.placeholder.address")}
        />
      </div>

      {/* Ghi chú */}
      <div className="col-12">
        <label className="form-label fw-medium">{t("supplier.note")}</label>
        <textarea
          name="note"
          value={form.note}
          onChange={handleChange}
          className="form-control"
          rows="2"
          placeholder={t("supplier.placeholder.note")}
        ></textarea>
      </div>

      {/* Nút lưu */}
      <div className="col-12 text-end mt-3">
        <button type="submit" className={`btn btn-${theme} text-white fw-semibold`}>
          <i className="bi bi-save me-2"></i>
          {t("common.save")}
        </button>
      </div>
    </form>
  );
}
