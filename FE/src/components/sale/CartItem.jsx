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

  const themeColorMap = {
    primary: "#0d6efd",
    success: "#198754",
    warning: "#ffc107",
    danger: "#dc3545",
    info: "#0dcaf0",
    secondary: "#6c757d",
    dark: "#212529",
  };

  const hexToRgba = (hex, alpha = 0.3) => {
    if (typeof hex !== "string" || !hex.startsWith("#")) return hex;
    let value = hex.slice(1);
    if (value.length === 3) {
      value = value.split("").map((c) => c + c).join("");
    }
    const intVal = Number.parseInt(value, 16);
    if (Number.isNaN(intVal)) return hex;
    const r = (intVal >> 16) & 255;
    const g = (intVal >> 8) & 255;
    const b = intVal & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const themeBorderColor = themeColorMap[theme] || "#0d6efd";
  const themeBorderSoftColor = hexToRgba(themeBorderColor, 0.35);

  // ====== GIẢM GIÁ CHỈ DÙNG % ======
  const popupRef = useRef(null);
  const [editingDiscount, setEditingDiscount] = useState(false);

  // tempValue KHÔNG dùng item.discountValue nữa, chỉ dùng discount %
  const [tempValue, setTempValue] = useState(item.discount ?? 0);

  const [qtyInput, setQtyInput] = useState(String(item.quantity ?? 0));
  const noteRef = useRef(null);

  const total = item.price * item.quantity;

  /* Sync qty input */
  useEffect(() => {
    setQtyInput(String(item.quantity ?? 0));
  }, [item.quantity]);

  useEffect(() => {
    if (noteRef.current) {
      noteRef.current.style.height = "auto";
      noteRef.current.style.height = `${noteRef.current.scrollHeight}px`;
    }
  }, [item.note, item.showNote]);

  // ===== Áp dụng giảm giá =====
  const applyDiscount = () => {
    const pct = Math.min(Math.max(Number(tempValue) || 0, 0), 100);
    const money = Math.round((total * pct) / 100);

    setDiscount(item.code, {
      discount: pct,
      discountValue: money,
      discountMode: "%",
    });
  };

  // ===== Click ngoài => đóng popup =====
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        applyDiscount();
        setEditingDiscount(false);
      }
    };
    if (editingDiscount) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingDiscount, tempValue]);

  // ===== Mở popup sửa giảm giá =====
  const openDiscountEditor = () => {
    setTempValue(item.discount ?? 0); // luôn lấy % từ item
    setEditingDiscount(true);
  };

  // ===== Tính giảm giá theo % hiện hành =====
  const currentPct = item.discount ?? 0;
  const discountAmount = Math.round((total * currentPct) / 100);
  const totalAfterDiscount = Math.max(total - discountAmount, 0);

  return (
    <div className={`bg-white rounded-4 border border-${theme} border-opacity-25 mb-2 p-2`}>
      <div className="d-flex align-items-center justify-content-between" style={{ minHeight: 50 }}>
        
        {/* LEFT */}
        <div className="flex-grow-1">
          <div className="d-flex align-items-center" style={{ gap: 10 }}>
            <span className="text-secondary small">{index + 1}</span>
            <button className="btn btn-sm p-0 text-danger border-0" onClick={() => removeItem(item.code)}>
              <i className="bi bi-trash" />
            </button>
            <strong>{item.code}</strong>
            <span>{item.name}</span>
          </div>

          {item.note && !item.showNote && (
            <div className="text-secondary small fst-italic mt-1 ps-5">
              {item.note}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="d-flex align-items-center justify-content-end" style={{ gap: 25 }}>
          
          {/* QTY */}
          <div className="d-flex align-items-center" style={{ gap: 8 }}>
            <button className="btn btn-sm btn-light rounded-circle" onClick={() => changeQty(item.code, -1)}>
              −
            </button>

            <input
              type="text"
              inputMode="numeric"
              value={qtyInput}
              className={`form-control form-control-sm text-center fw-semibold border-0 border-bottom border-2 ${
                item.quantity > item.stock ? "text-danger" : "text-dark"
              }`}
              style={{
                width: 50,
                background: "transparent",
                boxShadow: "none",
                borderRadius: 0,
                borderBottomColor: themeBorderColor,
                paddingBottom: 2,
              }}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d+$/.test(val)) setQtyInput(val);
              }}
              onBlur={() => {
                const parsed = Math.max(0, Number(qtyInput) || 0);
                const delta = parsed - (Number(item.quantity) || 0);
                if (delta !== 0) changeQty(item.code, delta);
                setQtyInput(String(parsed));
              }}
            />

            <button className="btn btn-sm btn-light rounded-circle" onClick={() => changeQty(item.code, 1)}>
              +
            </button>
          </div>

          {/* PRICE */}
          <span style={{ width: 80, textAlign: "right" }}>
            {formatCurrency(item.price)}
          </span>

          {/* DISCOUNT */}
          <div
            style={{ width: 120, textAlign: "right", position: "relative", cursor: "pointer" }}
            onClick={openDiscountEditor}
          >
            {editingDiscount ? (
              <div
                ref={popupRef}
                className="position-absolute bg-white shadow-sm p-3 rounded-3 border"
                style={{ right: 0, top: "-120%", zIndex: 100, width: 210 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center fw-semibold mb-2">
                  {t("sales.discount")}
                </div>

                <div className="d-flex align-items-center bg-light rounded-3 px-2 py-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-control form-control-sm text-end border-0 border-bottom border-2 bg-transparent shadow-none flex-grow-1"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                  />
                  <span className="ms-2 text-secondary">%</span>
                </div>
              </div>
            ) : (
              <span
                className="fw-semibold text-secondary d-inline-block border-bottom border-2"
                style={{ borderBottomColor: themeBorderColor, paddingBottom: 2 }}
              >
                - {currentPct > 0 ? `${currentPct}%` : "0%"}
              </span>
            )}
          </div>

          {/* TOTAL */}
          <strong style={{ width: 100, textAlign: "right" }}>
            {formatCurrency(totalAfterDiscount)}
          </strong>

          <button
            className={`btn btn-sm border-0 text-${theme}`}
            onClick={() => toggleNote(item.code)}
          >
            <i className="bi bi-pencil-square" />
          </button>
        </div>
      </div>

      {item.showNote && (
        <div className="mt-2">
          <textarea
            ref={noteRef}
            rows={2}
            className="form-control form-control-sm"
            placeholder={t("sales.note")}
            value={item.note}
            onChange={(e) => setNote(item.code, e.target.value)}
            style={{
              resize: "none",
              overflow: "hidden",
              borderColor: themeBorderSoftColor,
              boxShadow: `0 0 0 1px ${themeBorderSoftColor}`,
            }}
          />
        </div>
      )}
    </div>
  );
}
