import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

export default function PaymentConfirmModal({ show, data, onCancel, onConfirm }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const safeData = data || {};

  const isBank =
    safeData.paymentMethod === "BANK" || safeData.paymentMethod === "TRANSFER";
  const isCash = safeData.paymentMethod === "CASH";

  const isImageURL = /^https?:\/\//i.test(safeData.qrCodeUrl || "");

  const [receivedMoney, setReceivedMoney] = useState("");
  const [changeMoney, setChangeMoney] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // Format tiền
  const formatAmount = (num) => {
    if (!num) return "0";
    return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // ⭐ RESET STATE KHI DATA ĐỔI (SỬA LỖI CASH → BANK KHÔNG HIỆN QR)
  useEffect(() => {
    if (!show || !data) return;

    setReceivedMoney("");
    setChangeMoney(0);
    setErrorMessage("");
  }, [data, show]);

  // ⭐ Khi mở popup → auto set tiền khách đưa nếu là tiền mặt
  useEffect(() => {
    if (show) {
      if (isCash && safeData.totalPrice) {
        setReceivedMoney(formatAmount(String(safeData.totalPrice)));
        setErrorMessage("");
        setChangeMoney(0);
      }
    }
  }, [
    show,
    isCash,
    safeData.totalPrice,
    safeData.qrCodeUrl,        // ⭐ thêm dòng này
    safeData.paymentMethod     // ⭐ thêm dòng này
  ]);

  // Nhập tiền khách đưa
  const handleReceivedChange = (e) => {
    let value = e.target.value;

    value = value.replace(/,/g, ".");
    if (!/^[0-9.]*$/.test(value)) return;

    const digitsOnly = value.replace(/\./g, "");
    setReceivedMoney(formatAmount(digitsOnly));
  };

  // Tính tiền thừa
  useEffect(() => {
    if (!isCash) return;

    const raw = receivedMoney.replace(/\./g, "");
    const given = Number(raw || 0);
    const total = Number(safeData.totalPrice || 0);

    if (given < total) {
      setErrorMessage(t("payment.notEnoughMoney"));
      setChangeMoney(0);
    } else {
      setErrorMessage("");
      setChangeMoney(given - total);
    }
  }, [receivedMoney, safeData.totalPrice, isCash, t]);

  if (!show || !data) return null;

  const rawReceived = Number(receivedMoney.replace(/\./g, "") || 0);
  const totalAmount = Number(safeData.totalPrice || 0);
  const canConfirm = rawReceived >= totalAmount;

  // Nút theo theme
  const confirmVariant = theme === "dark" ? "outline-light" : "primary";
  const cancelVariant = "secondary";

  return (
    <Modal show={show} onHide={() => onCancel("CANCEL")} centered backdrop="static" size="md">
      <Modal.Body>
        {/* ===================== BANK ===================== */}
        {isBank && (
          <>
            <p className="text-dark fw-bold">
              {t("payment.amount")}: {formatAmount(safeData.totalPrice)} đ
            </p>

            {isImageURL && (
              <div className="text-center mt-3">
                <img
                  src={safeData.qrCodeUrl}
                  alt="QR Payment"
                  style={{
                    maxWidth: "260px",
                    height: "auto",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* ===================== CASH ===================== */}
        {isCash && (
          <div className="mt-2">

            <div className="mb-3 p-2 border rounded bg-light">
              <label className="fw-semibold">{t("payment.amount")}</label>
              <div className="fs-5 fw-bold text-dark">
                {formatAmount(safeData.totalPrice)} đ
              </div>
            </div>

            <div className="mb-2 p-2 border rounded bg-light">
              <label className="fw-semibold">{t("payment.enterReceived")}</label>
              <Form.Control
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={receivedMoney}
                onChange={handleReceivedChange}
                isInvalid={!!errorMessage}
              />
              {errorMessage && (
                <div className="text-danger small mt-1">{errorMessage}</div>
              )}
            </div>

            <div className="mb-3 p-2 border rounded bg-light">
              <label className="fw-semibold">{t("payment.changeMoney")}</label>
              <div className="fs-5 fw-bold text-dark">
                {formatAmount(changeMoney)} đ
              </div>
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <div className="d-flex justify-content-between align-items-center w-100">

          {/* Tổng tiền bên trái */}
          <div className="fw-bold fs-5 text-dark">
            {/* {t("payment.amount")}: {formatAmount(safeData.totalPrice)} đ */}
          </div>

          {/* Nút bên phải */}
          <div className="d-flex gap-2">
            <Button variant={cancelVariant} onClick={() => onCancel("CANCEL")}>
              {t("payment.cancel")}
            </Button>

            {isCash && (
              <Button
                className={`btn btn-${theme}`}
                variant={confirmVariant}
                disabled={!canConfirm}
                onClick={() =>
                  onConfirm({
                    status: "COMPLETE",
                    paidAmount: receivedMoney.replace(/\./g, ""),
                  })
                }
              >
                {t("payment.confirm")}
              </Button>
            )}
          </div>

        </div>
      </Modal.Footer>
    </Modal>
  );
}
