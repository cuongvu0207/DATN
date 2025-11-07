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

  // ðŸ”¹ Cáº­p nháº­t giÃ¡ trá»‹ input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ðŸ”¹ Gá»­i dá»¯ liá»‡u thÃªm danh má»¥c
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.categoryName.trim()) {
      alert(t("category.enterName") || "Vui lÃ²ng nháº­p tÃªn danh má»¥c!");
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

      const newCategory = { categoryId: res.data?.categoryId ?? res.data?.id, categoryName: res.data?.categoryName ?? res.data?.name ?? form.categoryName };
      alert(t("category.addSuccess") || "âœ… ThÃªm danh má»¥c thÃ nh cÃ´ng!");
      if (onSave) onSave(newCategory);

      setForm({ categoryName: "", description: "" });
    } catch (err) {
      console.error("âŒ Lá»—i thÃªm danh má»¥c:", err);
      alert(t("category.addFail") || "âŒ KhÃ´ng thá»ƒ thÃªm danh má»¥c. Vui lÃ²ng thá»­ láº¡i!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="row g-3">
      {/* === TÃªn danh má»¥c === */}
      <div className="col-md-12">
        <label className="form-label fw-semibold">
          {t("category.categoryName") || "TÃªn danh má»¥c"}
        </label>
        <input
          type="text"
          name="categoryName"
          value={form.categoryName}
          onChange={handleChange}
          className="form-control shadow-sm"
          placeholder={t("category.placeholder.name") || "Nháº­p tÃªn danh má»¥c"}
          required
        />
      </div>

      {/* === MÃ´ táº£ === */}
      <div className="col-md-12">
        <label className="form-label fw-semibold">
          {t("category.description") || "MÃ´ táº£"}
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="form-control shadow-sm"
          rows="3"
          placeholder={t("category.placeholder.description") || "Nháº­p mÃ´ táº£ danh má»¥c"}
        ></textarea>
      </div>

      {/* === NÃºt hÃ nh Ä‘á»™ng === */}
      <div className="col-12 text-end mt-3">
        <button
          type="button"
          className="btn btn-secondary me-2"
          onClick={onCancel}
          disabled={loading}
        >
          {t("common.cancel") || "Há»§y"}
        </button>
        <button
          type="submit"
          className={`btn btn-${theme} text-white fw-semibold`}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              {t("common.saving") || "Äang lÆ°u..."}
            </>
          ) : (
            <>
              <i className="bi bi-save me-2"></i>
              {t("common.save") || "LÆ°u"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
