// ✅ Mẫu HTML hóa đơn A4 – Thêm Mã hóa đơn & Người bán (lấy từ người đăng nhập)
export function generateInvoiceHTML({
  t,
  selectedCustomer,
  customer,
  cartItems,
  totalAmount,
  invoiceDiscount,
  paymentMethod,
  invoiceCode, // 🧾 mã hóa đơn
  user,        // 👤 thông tin người đăng nhập (seller)
}) {
  const totalAfterDiscount = Math.max(totalAmount - (invoiceDiscount || 0), 0);
  const _t = (k, fb) => (typeof t === "function" ? t(k) : null) || fb;

  // map sản phẩm
  const rows = cartItems
    .map((it, i) => {
      const qty = Number(it.quantity || 0);
      const price = Number(it.price || 0);
      const mode = it.discountMode || "%";
      const percent = Number(it.discount || 0);
      const value = Number(it.discountValue || 0);

      // ✅ Giảm giá tính theo tiền, không hiển thị %
      let discountValue = 0;
      if (mode === "%") {
        discountValue = (price * percent) / 100;
      } else {
        discountValue = value / (qty || 1);
      }

      const unitAfter = price - discountValue;
      const discountText = `-${discountValue.toLocaleString("vi-VN")}`;
      const lineTotal =
        typeof it.total === "number" ? it.total : Math.max(unitAfter * qty, 0);

      return `
        <tr>
          <td class="text-center">${i + 1}</td>
          <td>${it.name || ""}</td>
          <td class="text-center">${qty}</td>
          <td class="text-end">${price.toLocaleString("vi-VN")}</td>
          <td class="text-end">${discountText}</td>
          <td class="text-end">${lineTotal.toLocaleString("vi-VN")}</td>
        </tr>`;
    })
    .join("");

  return `
  <div class="container py-4" style="width:210mm; font-family:Arial, sans-serif; color:#000;">
    <!-- Header -->
    <div class="text-center border-bottom pb-2 mb-3">
      <h3 class="fw-bold mb-1">VPOS STORE</h3>
      <div class="small">${_t("sales.address", "Địa chỉ")}: 123 Nguyễn Trãi, Hà Nội</div>
      <div class="small">Hotline: 0905 123 456</div>
    </div>

    <!-- Title -->
    <h4 class="text-center mb-3 fw-bold">${_t("sales.invoiceTitle", "HÓA ĐƠN BÁN HÀNG")}</h4>

    <!-- Meta -->
    <div class="mb-3" style="font-size: 11pt;">
      <div><strong>${_t("sales.invoiceCode", "Mã hóa đơn")}:</strong> ${
        invoiceCode || "INV-" + new Date().getTime()
      }</div>
      <div><strong>${_t("sales.date", "Ngày")}:</strong> ${new Date().toLocaleString("vi-VN")}</div>
      <div><strong>${_t("sales.customer", "Khách hàng")}:</strong> ${
        selectedCustomer?.name || customer || _t("sales.walkInCustomer", "Khách lẻ")
      }</div>
      <div><strong>${_t("sales.seller", "Người bán")}:</strong> ${
        user?.fullName || user?.username || "sales.staff"
      }</div>
      <div><strong>${_t("sales.paymentMethod", "Phương thức thanh toán")}:</strong> ${
        paymentMethod === "cash"
          ? _t("sales.cash", "Tiền mặt")
          : paymentMethod === "bank"
          ? _t("sales.bank", "Chuyển khoản")
          : _t("sales.qr", "Quét mã QR")
      }</div>
    </div>

    <!-- Table -->
    <table class="table table-bordered align-middle" style="font-size:11pt;">
      <thead class="table-light text-center align-middle fw-bold">
        <tr>
          <th style="width:5%;">#</th>
          <th style="width:45%;">${_t("sales.productName", "Tên sản phẩm")}</th>
          <th style="width:10%;">${_t("sales.qty", "Số lượng")}</th>
          <th style="width:15%;">${_t("sales.price", "Đơn giá")}</th>
          <th style="width:10%;">${_t("sales.discount", "Giảm giá")}</th>
          <th style="width:15%;">${_t("sales.total", "Thành tiền")}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <!-- Totals -->
    <div class="mt-4" style="font-size: 11pt;">
      <div class="d-flex justify-content-between mb-1">
        <span class="fw-semibold">${_t("sales.subtotal", "Tạm tính")}:</span>
        <span class="fw-semibold">${Number(totalAmount || 0).toLocaleString("vi-VN")} VNĐ</span>
      </div>
      <div class="d-flex justify-content-between mb-1">
        <span class="fw-semibold">${_t("sales.discountTotal", "Giảm giá hóa đơn")}:</span>
        <span class="fw-semibold">-${Number(invoiceDiscount || 0).toLocaleString("vi-VN")} VNĐ</span>
      </div>
      <div class="d-flex justify-content-between mt-2 border-top pt-2">
        <span class="fw-bold fs-6">${_t("sales.total", "Thành tiền")}:</span>
        <span class="fw-bold fs-6">${totalAfterDiscount.toLocaleString("vi-VN")} VNĐ</span>
      </div>
      <div class="fst-italic mt-1">${_t("sales.vatIncluded", "Đã bao gồm thuế VAT")}</div>
    </div>

    <!-- Signatures -->
    <div class="row mt-5">
      <div class="col-6 text-center">
        <div class="fw-semibold">${_t("sales.seller", "Người lập hóa đơn")}</div>
        <div class="mt-4 small text-muted">(${_t("sales.signAndName", "Ký và ghi rõ họ tên")})</div>
      </div>
      <div class="col-6 text-center">
        <div class="fw-semibold">${_t("sales.buyer", "Khách hàng")}</div>
        <div class="mt-4 small text-muted">(${_t("sales.signAndName", "Ký và ghi rõ họ tên")})</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center border-top pt-3 mt-4 fw-semibold">
      ${_t("sales.thankYou", "Cảm ơn quý khách và hẹn gặp lại!")}
    </div>
  </div>
  `;
}
