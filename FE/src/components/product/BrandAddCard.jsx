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

  // ðŸ”¹ Xá»­ lÃ½ thay Ä‘á»•i input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ðŸ”¹ Gá»­i dá»¯ liá»‡u lÃªn API
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.brandName.trim()) {
      alert(t("brand.enterName") || "Vui lÃ²ng nháº­p tÃªn thÆ°Æ¡ng hiá»‡u!");
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

      const newBrand = { brandId: res.data?.brandId ?? res.data?.id, brandName: res.data?.brandName ?? res.data?.name ?? form.brandName };

      alert(t("brand.addSuccess") || "âœ… ThÃªm thÆ°Æ¡ng hiá»‡u thÃ nh cÃ´ng!");
      if (onSave) onSave(newBrand);

      // Reset form
      setForm({ brandName: "", description: "" });
    } catch (err) {
      console.error("âŒ Lá»—i thÃªm thÆ°Æ¡ng hiá»‡u:", err);
      alert(t("brand.addFail") || "âŒ KhÃ´ng thá»ƒ thÃªm thÆ°Æ¡ng hiá»‡u. Vui lÃ²ng thá»­ láº¡i!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="row g-3">
      {/* === TÃªn thÆ°Æ¡ng hiá»‡u === */}
      <div className="col-md-12">
        <label className="form-label fw-semibold">
          {t("brand.brandName") || "TÃªn thÆ°Æ¡ng hiá»‡u"}
        </label>
        <input
          type="text"
          name="brandName"
          value={form.brandName}
          onChange={handleChange}
          className="form-control shadow-sm"
          placeholder={t("brand.placeholder.name") || "Nháº­p tÃªn thÆ°Æ¡ng hiá»‡u"}
          required
        />
      </div>

      {/* === MÃ´ táº£ === */}
      <div className="col-md-12">
        <label className="form-label fw-semibold">
          {t("brand.description") || "MÃ´ táº£"}
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="form-control shadow-sm"
          rows="3"
          placeholder={t("brand.placeholder.description") || "Nháº­p mÃ´ táº£ thÆ°Æ¡ng hiá»‡u"}
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
