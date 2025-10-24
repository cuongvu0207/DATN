import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { printInvoice } from "./printInvoice";

export default function CustomerPanel({
  customer,
  setCustomer,
  filteredCustomers,
  handleSelectCustomer,
  totalAmount = 0,
  paymentMethod,
  setPaymentMethod,
  onAddCustomerClick,
  selectedCustomer,
  invoiceDiscount,
  setInvoiceDiscount,
  cartItems = [],
  onPay,
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [discountMode, setDiscountMode] = useState("%");
  const [tempValue, setTempValue] = useState(0);
  const popupRef = useRef(null);

  // ======= GỢI Ý KHÁCH HÀNG =======
  useEffect(() => {
    if (!selectedCustomer && customer.trim() !== "") setShowSuggestions(true);
    else setShowSuggestions(false);
  }, [customer, selectedCustomer]);

  // ======= ÁP DỤNG GIẢM GIÁ =======
  const applyDiscount = () => {
    let discountValue = 0;
    if (discountMode === "%") {
      const pct = Math.min(Math.max(Number(tempValue) || 0, 0), 100);
      discountValue = Math.round((totalAmount * pct) / 100);
    } else {
      discountValue = Math.min(Math.max(Number(tempValue) || 0, 0), totalAmount);
    }
    setInvoiceDiscount(discountValue);
  };

  // ======= CLICK RA NGOÀI POPUP =======
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        applyDiscount();
        setEditingDiscount(false);
      }
    };
    if (editingDiscount) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingDiscount, tempValue, discountMode]);

  const handleSelect = (c) => {
    handleSelectCustomer(c);
    setShowSuggestions(false);
  };

  const totalAfterDiscount = Math.max(totalAmount - invoiceDiscount, 0);

  return (
    <div
      className={`rounded-4 border border-${theme} border-opacity-25 bg-white p-3 flex-grow-1 shadow-sm d-flex flex-column justify-content-between`}
    >
      <div>
        {/* ======= KHÁCH HÀNG ======= */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="fw-semibold">{t("sales.customer") || "Khách hàng"}</span>
          <small className="text-muted">{new Date().toLocaleString("vi-VN")}</small>
        </div>

        {/* Ô tìm khách hàng */}
        <div className="position-relative mb-3">
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-light">
              <i className="bi bi-person" />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder={t("sales.enterCustomer") || "Nhập khách hàng..."}
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              disabled={!!selectedCustomer}
              onFocus={() => !selectedCustomer && setShowSuggestions(true)}
            />
            <button
              type="button"
              className={`btn btn-outline-${theme}`}
              onClick={onAddCustomerClick}
              disabled={!!selectedCustomer}
            >
              <i className="bi bi-plus-lg" />
            </button>
          </div>

          {!selectedCustomer && showSuggestions && filteredCustomers?.length > 0 && (
            <div
              className="position-absolute bg-white border rounded shadow-sm mt-1 w-100"
              style={{ zIndex: 20 }}
            >
              {filteredCustomers.map((c) => (
                <div
                  key={c.id}
                  className="p-2 hover-bg-light"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSelect(c)}
                >
                  <strong>{c.name}</strong>{" "}
                  <small className="text-muted">({c.phone})</small>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ======= TỔNG TIỀN ======= */}
        <div className="mt-2 small">
          <div className="d-flex justify-content-between mb-1">
            <span>{t("sales.subtotal") || "Tạm tính"}</span>
            <span>{totalAmount.toLocaleString("vi-VN")}</span>
          </div>

          {/* Giảm giá hóa đơn */}
          <div
            className="d-flex justify-content-between mb-1 position-relative"
            style={{ cursor: "pointer" }}
            onClick={() => setEditingDiscount(true)}
          >
            <span>{t("sales.discountTotal") || "Giảm giá hóa đơn"}</span>
            <span>-{invoiceDiscount.toLocaleString("vi-VN")}</span>

            {editingDiscount && (
              <div
                ref={popupRef}
                className="position-absolute bg-white shadow-sm p-3 rounded-3 border"
                style={{
                  right: 0,
                  top: "-130%",
                  zIndex: 100,
                  width: 210,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center fw-semibold mb-2">
                  {t("sales.discount") || "Giảm giá"}
                </div>

                <div className="d-flex align-items-center bg-light rounded-3 px-2 py-1">
                  <input
                    type="number"
                    min="0"
                    max={discountMode === "%" ? "100" : undefined}
                    className="form-control form-control-sm border-0 bg-transparent text-end shadow-none flex-grow-1"
                    style={{ outline: "none" }}
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        applyDiscount();
                        setEditingDiscount(false);
                      }
                      if (e.key === "Escape") setEditingDiscount(false);
                    }}
                    autoFocus
                  />
                  <select
                    className="form-select form-select-sm border-0 bg-transparent shadow-none text-secondary"
                    style={{ width: 70, flexShrink: 0 }}
                    value={discountMode}
                    onChange={(e) => setDiscountMode(e.target.value)}
                  >
                    <option value="%">%</option>
                    <option value="VND">VNĐ</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Tổng cộng */}
          <div className="d-flex justify-content-between fw-bold text-dark fs-6 mb-3">
            <span>{t("sales.total") || "Tổng cộng"}</span>
            <span>{totalAfterDiscount.toLocaleString("vi-VN")}</span>
          </div>
        </div>

        {/* ======= PHƯƠNG THỨC THANH TOÁN ======= */}
        <div className="mt-2 mb-3">
          <label className="form-label fw-semibold">
            {t("sales.paymentMethod") || "Phương thức thanh toán"}
          </label>
          <div className="d-flex flex-column gap-1 mt-1">
            {[
              { value: "cash", label: t("sales.cash") || "Tiền mặt" },
              { value: "bank", label: t("sales.bank") || "Chuyển khoản" },
              { value: "qr", label: t("sales.qr") || "Quét mã QR" },
            ].map((m) => (
              <label key={m.value} className="form-check d-flex align-items-center gap-2">
                <input
                  type="radio"
                  className="form-check-input"
                  name="paymentMethod"
                  value={m.value}
                  checked={paymentMethod === m.value}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>{m.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ======= NÚT HÀNH ĐỘNG ======= */}
      <div className="mt-3 d-flex align-items-stretch gap-2">
        <button
          type="button"
          className={`btn btn-outline-${theme} fw-semibold d-flex align-items-center justify-content-center`}
          style={{ flex: "1" }}
          onClick={() =>
            printInvoice({
              t,
              selectedCustomer,
              customer,
              cartItems,
              totalAmount,
              invoiceDiscount,
              paymentMethod,
            })
          }
        >
          <i className="bi bi-printer me-1" />
          {t("sales.print") || "In"}
        </button>

        <button
          type="button"
          className={`btn btn-${theme} fw-bold d-flex align-items-center justify-content-center`}
          style={{ flex: "3" }}
          onClick={onPay}
        >
          {t("sales.payNow") || "THANH TOÁN"}
        </button>
      </div>
    </div>
  );
}
