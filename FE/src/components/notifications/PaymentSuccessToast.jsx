import React, { useEffect } from "react";
import { Modal } from "react-bootstrap";
import { useTheme } from "../../context/ThemeContext";

export function PaymentSuccessToast({ show, data, onClose }) {
  const { theme } = useTheme();

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!show || !data) return null;

  const items = data.items || [];
  const totalPrice = data.totalPrice || 0;

  // format tiền
  const formatMoney = (n) =>
    Number(n || 0).toLocaleString("vi-VN");

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      size="sm"
      backdrop="static"
      className="fade show"
    >
      <Modal.Body className="text-center">

        {/* Title */}
        <h5 className={`fw-bold text-${theme}`}>
          🎉 Thanh toán thành công!
        </h5>

        {/* Danh sách sản phẩm */}
        <div
          className="mt-3 text-start"
          style={{ maxHeight: "250px", overflowY: "auto" }}
        >
          {items.length > 0 ? (
            items.map((it, idx) => (
              <div
                key={idx}
                className="d-flex justify-content-between border-bottom py-1"
              >
                <span>
                  {it.productName} x {it.quantity}
                </span>
                <span className="fw-semibold text-dark">
                  {formatMoney(it.total)} đ
                </span>
              </div>
            ))
          ) : (
            <p className="text-muted">Không có sản phẩm</p>
          )}
        </div>

        {/* Tổng tiền */}
        <div className="mt-3 fw-bold fs-5 text-dark">
          Tổng: {formatMoney(totalPrice)} đ
        </div>

      </Modal.Body>
    </Modal>
  );
}
