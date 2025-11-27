import React, { useRef } from "react";
import { Modal } from "react-bootstrap";

export function PaymentSuccessToast({ show, data, onClose }) {
  if (!data) return null;

  const printAreaRef = useRef(null);

  const formatMoney = (n) =>
    Number(n || 0).toLocaleString("vi-VN") + " đ";

  const items = data.orderItemDTOs || [];

  const handlePrint = () => {
    if (!printAreaRef.current) return;

    const original = document.body.innerHTML;                // lưu nội dung gốc
    const contentToPrint = printAreaRef.current.innerHTML;   // lấy nội dung cần in

    // thay toàn bộ body = nội dung hóa đơn để in
    document.body.innerHTML = `
    <div style="padding:20px; font-family:Arial;">
      ${contentToPrint}
    </div>
  `;

    window.print();                                          // gọi in

    // khôi phục lại giao diện React
    document.body.innerHTML = original;
    window.location.reload();
  };

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <div className="p-4">

        {/* HEADER */}
        <h4 className="text-success fw-bold text-center">
          🎉 Thanh toán thành công!
        </h4>

        <p className="text-center text-muted mb-2">
          Mã hóa đơn: <strong>{data.orderId}</strong>
        </p>

        <hr />

        {/* PRINT AREA */}
        <div ref={printAreaRef}>

          {/* GENERAL INFO */}
          <div className="mb-2">
            <strong>Thời gian:</strong>{" "}
            {new Date(data.createdAt).toLocaleString("vi-VN")}
          </div>

          <div className="mb-2">
            <strong>Thu ngân:</strong> {data.cashierId}
          </div>

          <div className="mb-2">
            <strong>Khách hàng ID:</strong> {data.customerId}
          </div>

          <div className="mb-2">
            <strong>Phương thức:</strong>{" "}
            {data.paymentMethod === "CASH" ? "Tiền mặt" : data.paymentMethod}
          </div>

          <hr />

          {/* LIST */}
          <h6 className="fw-bold mb-3">Danh sách sản phẩm</h6>

          {items.map((item, index) => (
            <div key={index} className="row-item">

              {/* STT + NAME + BARCODE */}
              <div>
                <strong>{index + 1}. {item.productName}</strong>

              </div>

              {/* QTY x PRICE */}
              <div className="d-flex justify-content-between mt-1">
                <span className="text-muted">
                  {item.quantity} × {formatMoney(item.price)}
                </span>
                <span className="fw-bold">{formatMoney(item.subTotal)}</span>
              </div>

            </div>
          ))}

          <hr />

          {/* TOTAL */}
          <div className="d-flex justify-content-between total">
            <span>Tổng tiền</span>
            <span>{formatMoney(data.totalPrice)}</span>
          </div>

        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-4 d-flex justify-content-between">
          <button className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>

          <button className="btn btn-primary" onClick={handlePrint}>
            🖨 In hóa đơn
          </button>
        </div>

      </div>
    </Modal>
  );
}
