import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function CustomerModal({ show, onClose, newCustomer, setNewCustomer, handleAddCustomer }) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
         style={{ background: "rgba(0,0,0,0.4)", zIndex: 9999 }}>
      <div className="bg-white rounded-4 shadow p-4" style={{ width: 400 }}>
        <h6 className="fw-semibold mb-3">
          <i className="bi bi-person-plus me-2" />
          {t("sales.addCustomer")}
        </h6>

        <div className="mb-2">
          <label className="form-label small">{t("sales.customerName")}</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={newCustomer.name}
            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label small">{t("sales.customerPhone")}</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={newCustomer.phone}
            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
          />
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button className={`btn btn-${theme} btn-sm`} onClick={handleAddCustomer}>
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
