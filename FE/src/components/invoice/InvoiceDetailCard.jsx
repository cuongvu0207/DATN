import React, { useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

export default function InvoiceDetailCard({ invoice, formatCurrency, fmtDate }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const printRef = useRef(null);

  if (!invoice) return null;

  const invoiceId = invoice.orderId || invoice.id || "-";
  const seller = invoice.seller || invoice.cashierId || "-";
  const total = Number(invoice.totalPrice || invoice.total || 0);
  const paymentMethod = invoice.paymentMethod || "";
  const createdAt = invoice.createdAt;

  const customer =
    invoice.customer ||
    (invoice.customerId === "default_customer_id"
      ? t("invoices.walkInCustomer", "Khách vãng lai")
      : `${t("invoices.customer", "Khách")} ${String(invoice.customerId || "").slice(0, 6)}`);

  const getPaymentMethodText = useCallback(
    (method) => {
      const m = String(method || "").toLowerCase();

      if (!m) return t("paymentMethod.unknown", "Không xác định");
      if (m.includes("cash")) return t("paymentMethod.cash", "Tiền mặt");
      if (m.includes("bank") || m.includes("transfer")) return t("paymentMethod.bank", "Chuyển khoản");
      if (m.includes("card") || m.includes("credit")) return t("paymentMethod.card", "Thẻ thanh toán");
      if (m.includes("momo") || m.includes("zalopay") || m.includes("vnpay")) return t("paymentMethod.eWallet", "Ví điện tử");

      return method || t("paymentMethod.unknown", "Không xác định");
    },
    [t]
  );

  const items = useMemo(() => {
    const raw = invoice.orderItemDTOs || invoice.items || [];
    return raw.map((it) => ({
      name: it.productName || it.name || t("common.product"),
      quantity: Number(it.quantity ?? 1),
      price: Number(it.price ?? 0),
      subTotal:
        it.subTotal != null
          ? Number(it.subTotal)
          : Number(it.price ?? 0) * Number(it.quantity ?? 1),
      barcode: it.barcode,
    }));
  }, [invoice, t]);

  const handlePrint = () => {
    if (!printRef.current) return;

    const w = window.open("", "_blank");
    if (!w) return;

    w.document.write(`
      <html>
        <head>
          <title>${invoiceId}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; color: #111; }
            .title { font-size: 18px; font-weight: 700; margin: 0 0 8px; }
            .line { font-size: 13px; margin: 6px 0; }
            .label { color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
            th { background: #f2f2f2; text-align: left; }
            .text-end { text-align: right; }
            .text-center { text-align: center; }
            .barcode { color: #666; font-size: 12px; margin-top: 2px; }
            .total { margin-top: 10px; font-weight: 700; text-align: right; }
            @media print { @page { margin: 10mm; } }
          </style>
        </head>
        <body>
          ${printRef.current.innerHTML}
          <script>
            window.onload = function () {
              window.print();
              window.onafterprint = function () { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <div className="rounded p-3 mb-3">
      <div ref={printRef}>
        <div className="mb-3">
          <h5 className="fw-bold mb-1">
            {t("invoice.detail.title")}: {invoiceId}
          </h5>
        </div>

        <div className="small mb-3">
          <div className="mb-2">
            <span className="text-muted">{t("invoice.detail.saleDate")}: </span>
            <span className="fw-semibold">{createdAt ? fmtDate(createdAt) : "-"}</span>
          </div>

          <div className="mb-2">
            <span className="text-muted">{t("invoice.detail.customer")}: </span>
            <span className="fw-semibold">{customer}</span>
          </div>

          <div className="mb-2">
            <span className="text-muted">{t("invoice.detail.seller")}: </span>
            <span className="fw-semibold">{seller}</span>
          </div>

          <div className="mb-0">
            <span className="text-muted">{t("invoice.detail.paymentMethod")}: </span>
            <span className="fw-semibold">{getPaymentMethodText(paymentMethod)}</span>
          </div>
        </div>

        <div className="table-responsive mb-3">
          <table className={`table table-sm ${theme === "dark" ? "table-dark" : ""}`}>
            <thead>
              <tr>
                <th>{t("invoice.detail.productName")}</th>
                <th className="text-center">{t("invoice.detail.quantity")}</th>
                <th className="text-end">{t("invoice.detail.unitPrice")}</th>
                <th className="text-end">{t("invoice.detail.subtotal")}</th>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((it, i) => (
                  <tr key={i}>
                    <td>
                      <div className="fw-semibold">{it.name}</div>
                      {it.barcode ? <div className="text-muted small">{it.barcode}</div> : null}
                    </td>
                    <td className="text-center">{it.quantity}</td>
                    <td className="text-end">{formatCurrency(it.price)}</td>
                    <td className="text-end">{formatCurrency(it.subTotal)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-2">
                    {t("invoice.detail.noProducts")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="text-end fw-bold">
          {t("invoice.detail.total")}: <span className="text-primary">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="d-flex justify-content-end mt-3">
        <button
          onClick={handlePrint}
          className={`btn btn-${theme} text-white d-flex align-items-center gap-1`}
          type="button"
        >
          <i className="bi bi-printer"></i>
          <span>{t("invoice.actions.print")}</span>
        </button>
      </div>
    </div>
  );
}
