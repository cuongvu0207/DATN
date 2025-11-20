import React, { useState, useEffect, useRef } from "react";

import { useTheme } from "../../context/ThemeContext";

import { useTranslation } from "react-i18next";

import { printInvoice } from "./printInvoice";

import { formatCurrency } from "../../utils/formatters";



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

  onClearCustomer,

  invoiceDiscount,

  setInvoiceDiscount,

  cartItems = [],

  orderNote = "",

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



  const controlRadius = 18;



  return (

    <div

      className={`rounded-4 border border-${theme} border-opacity-25 bg-white p-3 flex-grow-1 shadow-sm d-flex flex-column justify-content-between`}

      style={{ fontSize: "0.98rem", lineHeight: 1.45 }}

    >

      <div>

        {/* ======= KHÁCH HÀNG ======= */}

        <div className="d-flex justify-content-between align-items-center mb-2">

          <span className="fw-semibold text-dark">{t("sales.customer") || "Khách hàng"}</span>

          <span className="text-muted">{new Date().toLocaleString("vi-VN")}</span>

        </div>



        {/* Ô tìm khách hàng */}

        <div className="mb-3">

          <div className="d-flex align-items-center gap-2">

            <div className="position-relative flex-grow-1">

              <div

                className={`d-flex align-items-center gap-3 rounded-4 border border-${theme} border-opacity-25 bg-white px-3 py-2 shadow-sm`}

                style={{ borderRadius: controlRadius }}

              >

                <span

                  className={`d-inline-flex align-items-center justify-content-center rounded-circle bg-${theme} bg-opacity-10 text-${theme}`}

                  style={{ width: 32, height: 32 }}

                >

                  <i className="bi bi-person" />

                </span>

                <input

                  type="text"

                  className="form-control border-0 bg-transparent shadow-none p-0"

                  placeholder={

                    t("sales.enterCustomer") ||

                    t("customer.searchPlaceholder") ||

                    "Nhập khách hàng..."

                  }

                  value={customer}

                  onChange={(e) => setCustomer(e.target.value)}

                  disabled={!!selectedCustomer}

                  onFocus={() => !selectedCustomer && setShowSuggestions(true)}

                />

              </div>



              {!selectedCustomer &&

                showSuggestions &&

                filteredCustomers?.length > 0 && (

                  <div

                    className={`position-absolute start-0 end-0 bg-white border border-${theme} border-opacity-10 rounded-4 shadow-lg mt-2`}

                    style={{ zIndex: 20 }}

                  >

                    {filteredCustomers.map((c) => (

                      <div

                        key={c.id || c.phoneNumber || c.fullName}

                        className="p-2 hover-bg-light rounded-3"

                        style={{ cursor: "pointer" }}

                        onClick={() => handleSelect(c)}

                      >

                        <strong>{c.fullName}</strong>{" "}

                        <span className="text-muted">({c.phoneNumber})</span>

                      </div>

                    ))}

                  </div>

                )}

            </div>

            <button

              type="button"

              className={`btn btn-${theme} text-white rounded-4 px-3 py-2 d-flex align-items-center justify-content-center shadow-sm`}

              onClick={onAddCustomerClick}

              style={{ borderRadius: controlRadius, width: 48, height: 48 }}

              title={t("customer.add") || "Thêm khách hàng"}

            >

              <i className="bi bi-plus-lg fs-4" />

            </button>

          </div>

        </div>



        {selectedCustomer && (

          <div

            className={`bg-light border border-${theme} border-opacity-25 rounded-4 px-3 py-2 mb-3`}

          >

            <div className="d-flex justify-content-between align-items-start gap-3">

              <div>

                <div className="fw-semibold">{selectedCustomer.fullName}</div>

                <div className="text-muted">

                  {selectedCustomer.phoneNumber}

                  {selectedCustomer.email ? ` • ${selectedCustomer.email}` : ""}

                </div>

                {selectedCustomer.address && (

                  <div className="text-muted">{selectedCustomer.address}</div>

                )}

                <span className="badge bg-white border text-secondary mt-2">

                  {selectedCustomer.gender === "female"

                    ? t("customer.genderFemale") || "Nữ"

                    : t("customer.genderMale") || "Nam"}

                </span>

              </div>

              {onClearCustomer && (

                <button

                  type="button"

                  className="btn btn-link text-decoration-none text-muted p-0"

                  onClick={onClearCustomer}

                  title={t("common.clear") || "Bỏ chọn"}

                >

                  <i className="bi bi-x-circle fs-5" />

                </button>

              )}

            </div>

          </div>

        )}







        {/* ======= TỔNG TIỀN ======= */}

        <div className="mt-2" style={{ fontSize: "0.95rem" }}>

          <div className="d-flex justify-content-between mb-1">

            <span className="text-muted">{t("sales.subtotal") || "T?m t�nh"}</span>

            <span className="fw-semibold text-dark">{formatCurrency(totalAmount)}</span>

          </div>



          {/* Giảm giá hóa đơn */}

          <div

            className="d-flex justify-content-between mb-1 position-relative"

            style={{ cursor: "pointer" }}

            onClick={() => setEditingDiscount(true)}

          >

            <span className="text-muted">{t("sales.discountTotal") || "Gi?m gi� h�a don"}</span>

            <span

              style={{

                textDecoration: "underline",

                textDecorationColor: "rgba(0,0,0,0.3)",

                textDecorationThickness: 1,

                textUnderlineOffset: 3,

              }}

            >

              -{formatCurrency(invoiceDiscount)}

            </span>



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

                  {t("sales.discount") || "Gi?m gi�"}

                </div>



                <div className="d-flex align-items-center bg-light rounded-3 px-2 py-1">

                  <input

                    type="number"

                    min="0"

                    max={discountMode === "%" ? "100" : undefined}

                    className="form-control form-control-sm border-0 bg-transparent text-end shadow-none flex-grow-1"

                    style={{

                      outline: "none",

                      borderBottom: "1px solid rgba(0,0,0,0.15)",

                      borderRadius: 0,

                    }}

                    value={tempValue}

                    onChange={(e) => setTempValue(e.target.value)}

                    onKeyDown={(e) => {

                      if (e.key === "Enter") {

                        applyDiscount()

                        setEditingDiscount(false)

                      }

                      if (e.key === "Escape") setEditingDiscount(false)

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



          {/* Thành tiền */}

          <div className="d-flex justify-content-between fw-bold text-dark fs-6 mb-3">

            <span>{t("sales.total") || "Th�nh ti?n"}</span>

            <span>{formatCurrency(totalAfterDiscount)}</span>

          </div>

        </div>



        {/* ======= PHƯƠNG THỨC THANH TOÁN ======= */}

        <div className="mt-2 mb-3">
          <label className="form-label fw-semibold mb-2 text-dark">
            {t("sales.paymentMethod") || "Phương thức thanh toán"}
          </label>
          <div className="d-flex flex-column gap-1 mt-1">
            {[
              { value: "cash", label: t("sales.cash") || "Tiền mặt" },
              { value: "bank", label: t("sales.bank") || "Chuyển khoản" },
              { value: "wallet", label: t("sales.wallet") || "Ví điện tử" },
            ].map((m) => (
              <label key={m.value} className="form-check d-flex align-items-center gap-2 text-dark">
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

              orderNote,

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

