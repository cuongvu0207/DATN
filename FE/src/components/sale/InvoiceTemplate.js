
export function generateInvoiceHTML({
  t,
  selectedCustomer,
  customer,
  cartItems,
  totalAmount,
  invoiceDiscount,
  paymentMethod,
  invoiceCode, 
  user,        
  orderNote,
}) {
  const totalAfterDiscount = Math.max(totalAmount - (invoiceDiscount || 0), 0);
  const _t = (k, fb) => (typeof t === "function" ? t(k) : null) || fb;

  const rows = cartItems
    .map((it, i) => {
      const qty = Number(it.quantity || 0);
      const price = Number(it.price || 0);
      const mode = it.discountMode || "%";
      const percent = Number(it.discount || 0);
      const value = Number(it.discountValue || 0);


      let discountValue = 0;
      if (mode === "%") {
        discountValue = (price * percent) / 100;
      } else {
        discountValue = value / (qty || 1);
      }

      const unitAfter = price - discountValue;
      const discountText = `-${Number(discountValue || 0).toLocaleString("vi-VN")}`;
      const lineTotal =
        typeof it.total === "number" ? it.total : Math.max(unitAfter * qty, 0);

      return `
        <tr>
          <td class="text-center">${i + 1}</td>
          <td>
            <div>${it.name || ""}</div>
            ${
              it.note
                ? `<div class="text-muted fst-italic small">${it.note}</div>`
                : ""
            }
          </td>
          <td class="text-center">${qty}</td>
          <td class="text-end">${Number(price || 0).toLocaleString("vi-VN")}</td>
          <td class="text-end">${discountText}</td>
          <td class="text-end">${Number(lineTotal || 0).toLocaleString("vi-VN")}</td>
        </tr>`;
    })
    .join("");

  return `
  <div class="container py-4" style="width:210mm; font-family:Arial, sans-serif; color:#000;">
    <!-- Header -->
    <div class="text-center border-bottom pb-2 mb-3">
      <h3 class="fw-bold mb-1">VPOS STORE</h3>
      <div class="small">${_t("sales.address")}: 123 Nguyễn Trãi</div>
      <div class="small">Hotline: 0905 123 456</div>
    </div>

    <!-- Title -->
    <h4 class="text-center mb-3 fw-bold">${_t("sales.invoiceTitle")}</h4>

    <!-- Meta -->
    <div class="mb-3" style="font-size: 11pt;">
      <div><strong>${_t("sales.invoiceCode")}:</strong> ${
        invoiceCode || "INV-" + new Date().getTime()
      }</div>
      <div><strong>${_t("sales.date")}:</strong> ${new Date().toLocaleString("vi-VN")}</div>
      <div><strong>${_t("sales.customer")}:</strong> ${
        selectedCustomer?.fullName || customer || _t("sales.walkInCustomer", "KhÃ¡ch láº»")
      }</div>
      ${
        selectedCustomer?.phoneNumber
          ? `<div><strong>Phone:</strong> ${selectedCustomer.phoneNumber}</div>`
          : ""
      }
      <div><strong>${_t("sales.seller")}:</strong> ${
        user?.fullName || user?.username || "sales.staff"
      }</div>
      <div><strong>${_t("sales.paymentMethod")}:</strong> ${
        paymentMethod === "cash"
          ? _t("sales.cash", "Tiá»n máº·t")
          : paymentMethod === "bank"
          ? _t("sales.bank", "Chuyá»ƒn khoáº£n")
          : _t("sales.qr", "QuÃ©t mÃ£ QR")
      }</div>
    </div>

    <!-- Table -->
    <table class="table table-bordered align-middle" style="font-size:11pt;">
      <thead class="table-light text-center align-middle fw-bold" style="white-space: nowrap;">
        <tr>
          <th style="width:5%;">#</th>
          <th style="width:45%; white-space: nowrap;">${_t("sales.productName")}</th>
          <th style="width:10%; white-space: nowrap;">${_t("sales.qty")}</th>
          <th style="width:15%; white-space: nowrap;">${_t("sales.price")}</th>
          <th style="width:10%; white-space: nowrap;">${_t("sales.discount")}</th>
          <th style="width:15%; white-space: nowrap;">${_t("sales.total")}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    ${
      orderNote
        ? `<div class="mt-3">
             <div class="fst-italic">${orderNote}</div>
           </div>`
        : ""
    }

    <!-- Totals -->
    <div class="mt-4" style="font-size: 11pt;">
      <div class="d-flex justify-content-between mb-1">
        <span class="fw-semibold">${_t("sales.subtotal")}:</span>
        <span class="fw-semibold">${Number(totalAmount || 0).toLocaleString("vi-VN")}</span>
      </div>
      <div class="d-flex justify-content-between mb-1">
        <span class="fw-semibold">${_t("sales.discountTotal")}:</span>
        <span class="fw-semibold">-${Number(invoiceDiscount || 0).toLocaleString("vi-VN")}</span>
      </div>
      <div class="d-flex justify-content-between mt-2 border-top pt-2">
        <span class="fw-bold fs-6">${_t("sales.total")}:</span>
        <span class="fw-bold fs-6">${Number(totalAfterDiscount || 0).toLocaleString("vi-VN")}</span>
      </div>
      <div class="fst-italic mt-1">${_t("sales.vatIncluded")}</div>
    </div>

    <!-- Signatures -->
    <div class="row mt-5">
      <div class="col-6 text-center">
        <div class="fw-semibold">${_t("sales.seller")}</div>
        <div class="mt-4 small text-muted">(${_t("sales.signAndName")})</div>
      </div>
      <div class="col-6 text-center">
        <div class="fw-semibold">${_t("sales.buyer", "KhÃ¡ch hÃ ng")}</div>
        <div class="mt-4 small text-muted">(${_t("sales.signAndName")})</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center border-top pt-3 mt-4 fw-semibold">
      ${_t("sales.thankYou")}
    </div>
  </div>
  `;
}
