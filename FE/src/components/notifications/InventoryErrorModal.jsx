import React from "react";
import { Modal, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export default function InventoryErrorModal({ show, onClose, errors }) {
  const { t } = useTranslation();

  if (!errors || errors.length === 0) return null;

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton className="bg-danger text-white">
        <Modal.Title>{t("inventory.header")}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p className="mb-3 fw-semibold">{t("inventory.description")}</p>

        <ul className="list-group">
          {errors.map((item) => {
            const shortage = item.requestedQuantity - item.availableQuantity;

            return (
              <li key={item.barcode} className="list-group-item">
                <strong className="d-block mb-1">{item.productName}</strong>

                <div className="d-flex justify-content-between">
                  <span className="text-danger fw-bold">
                    {t("inventory.labelRequired")}:{" "}
                    <span className="fs-5">{item.requestedQuantity}</span>
                  </span>

                  <span
                    className={`fw-bold ${
                      item.availableQuantity > 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {t("inventory.labelAvailable")}:{" "}
                    <span className="fs-5">{item.availableQuantity}</span>
                  </span>
                </div>

              </li>
            );
          })}
        </ul>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          {t("inventory.btnClose")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
