import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function CashPopup({ open, total, onClose, onConfirm }) {
  const { t } = useTranslation();
  const [received, setReceived] = useState("");

  if (!open) return null;

  const changeReturn = Math.max(Number(received || 0) - total, 0);

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: "rgba(0,0,0,0.35)", zIndex: 9999 }}
    >
      <div className="bg-white p-4 rounded shadow-lg" style={{ width: 380 }}>
        <h5 className="fw-bold mb-3">
          {t("sales.cashTitle", { defaultValue: "Thanh toán tiền mặt" })}
        </h5>

        <p className="mb-2">
          {t("sales.totalAmount", { defaultValue: "Tổng tiền" })}:{" "}
          <strong>{total.toLocaleString()} đ</strong>
        </p>

        <label className="small text-muted">
          {t("sales.customerGiven", { defaultValue: "Số tiền khách đưa" })}
        </label>
        <input
          type="number"
          className="form-control mb-2"
          value={received}
          onChange={(e) => setReceived(e.target.value)}
          placeholder={t("sales.enterCustomerGiven", {
            defaultValue: "Nhập số tiền khách đưa",
          })}
        />

        <p className="mt-2">
          {t("sales.changeReturn", { defaultValue: "Tiền thừa" })}:{" "}
          <strong>{changeReturn.toLocaleString()} đ</strong>
        </p>

        <div className="d-flex justify-content-end gap-2 mt-3">
          <button className="btn btn-secondary" onClick={onClose}>
            {t("common.close", { defaultValue: "Đóng" })}
          </button>

          <button
            className="btn btn-success"
            disabled={!received || Number(received) < total}
            onClick={() => onConfirm(received)}
          >
            {t("common.confirm", { defaultValue: "Xác nhận" })}
          </button>
        </div>
      </div>
    </div>
  );
}
