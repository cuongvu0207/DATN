import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { API_BASE_URL } from "../../services/api";

export default function SupplierAddCard({ onSave, initialData = null }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const token = localStorage.getItem("accessToken");

  // ✅ edit mode nếu có supplierId
  const isEditMode = useMemo(() => !!initialData?.supplierId, [initialData]);

  const [form, setForm] = useState({
    supplierName: "",
    address: "",
    email: "",
    phone: "",
    note: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // ✅ Đổ dữ liệu khi mở modal Edit
  useEffect(() => {
    if (initialData) {
      setForm({
        supplierName: initialData.supplierName || "",
        address: initialData.address || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        note: initialData.note || "",
      });
    } else {
      // add mode -> reset
      setForm({
        supplierName: "",
        address: "",
        email: "",
        phone: "",
        note: "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // basic validate
    if (!String(form.supplierName || "").trim()) {
      alert(t("supplier.nameRequired") || "Vui lòng nhập tên nhà cung cấp!");
      return;
    }

    setSubmitting(true);
    try {
      let res;

      if (isEditMode) {
        // ✅ UPDATE (PUT)
        res = await axios.put(
          `${API_BASE_URL}/inventory/supplier/${initialData.supplierId}`,
          {
            ...form,
            supplierName: String(form.supplierName || "").trim(),
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // ✅ ADD (POST)
        res = await axios.post(
          `${API_BASE_URL}/inventory/supplier`,
          {
            ...form,
            supplierName: String(form.supplierName || "").trim(),
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      const savedSupplier = res.data;

      // ✅ báo thành công (nếu bạn muốn bỏ alert thì bỏ 2 dòng này)
      alert(
        isEditMode
          ? t("supplier.updateSuccess") || "Cập nhật nhà cung cấp thành công!"
          : t("supplier.addSuccess") || "Thêm nhà cung cấp thành công!"
      );

      onSave?.(savedSupplier);

      // ✅ chỉ reset khi ADD, còn EDIT thì giữ nguyên (hoặc reset tuỳ bạn)
      if (!isEditMode) {
        setForm({
          supplierName: "",
          address: "",
          email: "",
          phone: "",
          note: "",
        });
      }
    } catch (err) {
      console.error("❌", err);
      alert(
        isEditMode
          ? t("supplier.updateFail") || "Không thể cập nhật nhà cung cấp!"
          : t("supplier.addFail") || "Không thể thêm nhà cung cấp!"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="row g-3">
      {/* Tên nhà cung cấp */}
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
          placeholder={t("supplier.placeholder.name") || "Nhập tên nhà cung cấp..."}
          required
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
          placeholder={t("supplier.placeholder.phone") || "Nhập số điện thoại..."}
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
          placeholder={t("supplier.placeholder.email") || "Nhập email liên hệ..."}
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
          placeholder={t("supplier.placeholder.address") || "Nhập địa chỉ..."}
        />
      </div>

      {/* Ghi chú */}
      <div className="col-12">
        <label className="form-label fw-medium">
          {t("supplier.note") || "Ghi chú"}
        </label>
        <textarea
          name="note"
          value={form.note}
          onChange={handleChange}
          className="form-control"
          rows="2"
          placeholder={t("supplier.placeholder.note") || "Nhập ghi chú..."}
        ></textarea>
      </div>

      {/* Nút lưu */}
      <div className="col-12 text-end mt-3">
        <button
          type="submit"
          className={`btn btn-${theme} text-white fw-semibold`}
          disabled={submitting}
        >
          <i className="bi bi-save me-2"></i>
          {submitting
            ? t("common.loading") || "Đang xử lý..."
            : t("common.save") || "Lưu"}
        </button>
      </div>
    </form>
  );
}
