import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { API_BASE_URL } from "../../services/api";

export default function BrandAddCard({ onSave, onCancel }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const token = localStorage.getItem("accessToken");

  const [form, setForm] = useState({
    brandName: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);

  // 🔹 Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Gửi dữ liệu lên API
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.brandName.trim()) {
      alert(t("brand.enterName") || "Vui lòng nhập tên thương hiệu!");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${API_BASE_URL}/inventory/brand`, form, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const newBrand = res.data;

      alert(t("brand.addSuccess") || "✅ Thêm thương hiệu thành công!");
      if (onSave) onSave(newBrand);

      // Reset form
      setForm({ brandName: "", description: "" });
    } catch (err) {
      console.error("❌ Lỗi thêm thương hiệu:", err);
      alert(t("brand.addFail") || "❌ Không thể thêm thương hiệu. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="row g-3">
      {/* === Tên thương hiệu === */}
      <div className="col-md-12">
        <label className="form-label fw-semibold">
          {t("brand.brandName") || "Tên thương hiệu"}
        </label>
        <input
          type="text"
          name="brandName"
          value={form.brandName}
          onChange={handleChange}
          className="form-control shadow-sm"
          placeholder={t("brand.placeholder.name") || "Nhập tên thương hiệu"}
          required
        />
      </div>

      {/* === Mô tả === */}
      <div className="col-md-12">
        <label className="form-label fw-semibold">
          {t("brand.description") || "Mô tả"}
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="form-control shadow-sm"
          rows="3"
          placeholder={t("brand.placeholder.description") || "Nhập mô tả thương hiệu"}
        ></textarea>
      </div>

      {/* === Nút hành động === */}
      <div className="col-12 text-end mt-3">
        <button
          type="button"
          className="btn btn-secondary me-2"
          onClick={onCancel}
          disabled={loading}
        >
          {t("common.cancel") || "Hủy"}
        </button>
        <button
          type="submit"
          className={`btn btn-${theme} text-white fw-semibold`}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              {t("common.saving") || "Đang lưu..."}
            </>
          ) : (
            <>
              <i className="bi bi-save me-2"></i>
              {t("common.save") || "Lưu"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
