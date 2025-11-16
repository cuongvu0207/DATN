import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function CustomerModal({
  show,
  onClose,
  newCustomer,
  setNewCustomer,
  handleAddCustomer,
  saving = false,
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  if (!show) return null;

  const handleChange = (field) => (e) =>
    setNewCustomer((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: "rgba(0,0,0,0.4)", zIndex: 9999 }}
    >
      <div className="bg-white rounded-4 shadow p-4" style={{ width: 420 }}>
        <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
          <i className="bi bi-person-plus" />
          {t("customer.add") || t("sales.addCustomer")}
        </h6>

        <div className="mb-3">
          <label className="form-label small">
            {t("customer.fullName") || t("sales.customerName")}
          </label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={newCustomer.fullName}
            onChange={handleChange("fullName")}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label small">
            {t("customer.phoneNumber") || t("sales.customerPhone")}
          </label>
          <input
            type="tel"
            className="form-control form-control-sm"
            value={newCustomer.phoneNumber}
            onChange={handleChange("phoneNumber")}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label small">
            {t("customer.email") || "Email"}
          </label>
          <input
            type="email"
            className="form-control form-control-sm"
            value={newCustomer.email}
            onChange={handleChange("email")}
          />
        </div>

        <div className="mb-3">
          <label className="form-label small">
            {t("customer.address") || "Địa chỉ"}
          </label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={newCustomer.address}
            onChange={handleChange("address")}
          />
        </div>

        <div className="mb-4">
          <label className="form-label small">
            {t("customer.gender") || "Giới tính"}
          </label>
          <select
            className="form-select form-select-sm"
            value={newCustomer.gender}
            onChange={handleChange("gender")}
          >
            <option value="male">
              {t("customer.genderMale") || "Nam"}
            </option>
            <option value="female">
              {t("customer.genderFemale") || "Nữ"}
            </option>
          </select>
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button
            className={`btn btn-${theme} btn-sm d-flex align-items-center gap-2`}
            onClick={handleAddCustomer}
            disabled={saving}
          >
            {saving && (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              />
            )}
            <span>{t("common.save")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
