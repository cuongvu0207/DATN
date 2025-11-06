import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../utils/formatters";

export default function CartItem({
  item,
  index,
  changeQty,
  removeItem,
  toggleNote,
  setNote,
  setDiscount,
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [editingDiscount, setEditingDiscount] = useState(false);
  const [tempValue, setTempValue] = useState(item.discountValue ?? 0);
  const [mode, setMode] = useState(item.discountMode || "%");
  const popupRef = useRef(null);

  const total = item.price * item.quantity;

  // ===== Áp dụng giảm giá =====
  const applyDiscount = () => {
    let pct = 0;
    let money = 0;

    if (mode === "%") {
      pct = Math.min(Math.max(Number(tempValue) || 0, 0), 100);
      money = Math.round((total * pct) / 100);
    } else {
      money = Math.min(Math.max(Number(tempValue) || 0, 0), total);
      pct = total > 0 ? (money / total) * 100 : 0;
    }

    setDiscount(item.code, {
      discount: pct,
      discountValue: money,
      discountMode: mode,
    });
  };

  // ===== Click ngoài -> áp dụng + đóng popup =====
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        applyDiscount();
        setEditingDiscount(false);
      }
    };
    if (editingDiscount) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingDiscount, tempValue, mode]);

  // ===== Mở popup =====
  const openDiscountEditor = () => {
    const m = item.discountMode || "%";
    setMode(m);
    setTempValue(m === "%" ? item.discount ?? 0 : item.discountValue ?? 0);
    setEditingDiscount(true);
  };

  // ===== Tính toán hiển thị =====
  const discountAmount =
    item.discountMode === "%"
      ? Math.round((total * (item.discount ?? 0)) / 100)
      : item.discountValue ?? 0;

  const totalAfterDiscount = Math.max(total - discountAmount, 0);

  return (
    <div className={`bg-white rounded-4 border border-${theme} border-opacity-25 mb-2 p-2`}>
      <div className="d-flex align-items-center justify-content-between" style={{ minHeight: 50 }}>
        {/* BÊN TRÁI */}
        <div className="d-flex align-items-center flex-grow-1" style={{ gap: 10 }}>
          <span className="text-secondary small">{index + 1}</span>
          <button className="btn btn-sm p-0 text-danger border-0" onClick={() => removeItem(item.code)}>
            <i className="bi bi-trash" />
          </button>
          <strong>{item.code}</strong>
          <span>{item.name}</span>
        </div>

        {/* BÊN PHẢI */}
        <div className="d-flex align-items-center justify-content-end" style={{ gap: 25 }}>
          {/* SỐ LƯỢNG */}
          <div className="d-flex align-items-center" style={{ gap: 8 }}>
            <button className="btn btn-sm btn-light rounded-circle" onClick={() => changeQty(item.code, -1)}>−</button>
            <input
              type="text"
              value={item.quantity}
              readOnly
              className={`form-control form-control-sm text-center fw-semibold border-0 ${
                item.quantity > item.stock ? "text-danger" : "text-dark"
              }`}
              style={{ width: 50, background: "transparent", boxShadow: "none" }}
            />
            <button className="btn btn-sm btn-light rounded-circle" onClick={() => changeQty(item.code, 1)}>+</button>
          </div>

          {/* GIÁ */}
          <span style={{ width: 80, textAlign: "right" }}>{formatCurrency(item.price)}</span>

          {/* GIẢM GIÁ */}
          <div
            style={{ width: 120, textAlign: "right", position: "relative", cursor: "pointer" }}
            onClick={openDiscountEditor}
          >
            {editingDiscount ? (
              <div
                ref={popupRef}
                className="position-absolute bg-white shadow-sm p-3 rounded-3 border"
                style={{
                  right: 0,
                  top: "-120%",
                  zIndex: 100,
                  width: 210,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* === Tiêu đề i18n === */}
                <div className="text-center fw-semibold mb-2">
                  {t("sales.discount") || "Giảm giá"}
                </div>

                {/* === Nhập giá trị + đơn vị === */}
                <div className="d-flex align-items-center bg-light rounded-3 px-2 py-1">
                  <input
                    type="number"
                    min="0"
                    max={mode === "%" ? "100" : undefined}
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
                    style={{
                      width: 70,
                      flexShrink: 0,
                      appearance: "none",
                    }}
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                  >
                    <option value="%">%</option>
                    <option value="VND">VNĐ</option>
                  </select>
                </div>
              </div>
            ) : (
              <span className="fw-semibold text-secondary">
                {discountAmount > 0 ? `–${formatCurrency(discountAmount)}` : "–0"}
              </span>
            )}
          </div>

          {/* THÀNH TIỀN */}
          <strong style={{ width: 100, textAlign: "right" }}>
            {formatCurrency(totalAfterDiscount)}
          </strong>

          <button className={`btn btn-sm border-0 text-${theme}`} onClick={() => toggleNote(item.code)}>
            <i className="bi bi-three-dots-vertical" />
          </button>
        </div>
      </div>

      {item.showNote && (
        <div className="mt-2">
          <input
            type="text"
            className={`form-control form-control-sm border-${theme}`}
            placeholder={t("sales.note") || "Ghi chú sản phẩm..."}
            value={item.note}
            onChange={(e) => setNote(item.code, e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
