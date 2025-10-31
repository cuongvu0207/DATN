import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { API_BASE_URL } from "../../services/api";

export default function CategoryAddCard({ onSave, onCancel }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const token = localStorage.getItem("accessToken");

  const [form, setForm] = useState({
    categoryName: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  // 🔹 Cập nhật giá trị input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Gửi dữ liệu thêm danh mục
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.categoryName.trim()) {
      alert(t("category.enterName") || "Vui lòng nhập tên danh mục!");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${API_BASE_URL}/inventory/category`, form, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const newCategory = res.data;
      alert(t("category.addSuccess") || "✅ Thêm danh mục thành công!");
      if (onSave) onSave(newCategory);

      setForm({ categoryName: "", description: "" });
    } catch (err) {
      console.error("❌ Lỗi thêm danh mục:", err);
      alert(t("category.addFail") || "❌ Không thể thêm danh mục. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="row g-3">
      {/* === Tên danh mục === */}
      <div className="col-md-12">
        <label className="form-label fw-semibold">
          {t("category.categoryName") || "Tên danh mục"}
        </label>
        <input
          type="text"
          name="categoryName"
          value={form.categoryName}
          onChange={handleChange}
          className="form-control shadow-sm"
          placeholder={t("category.placeholder.name") || "Nhập tên danh mục"}
          required
        />
      </div>

      {/* === Mô tả === */}
      <div className="col-md-12">
        <label className="form-label fw-semibold">
          {t("category.description") || "Mô tả"}
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="form-control shadow-sm"
          rows="3"
          placeholder={t("category.placeholder.description") || "Nhập mô tả danh mục"}
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
