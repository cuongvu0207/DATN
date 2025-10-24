import html2pdf from "html2pdf.js";
import { generateInvoiceHTML } from "./InvoiceTemplate";

// ✅ Hàm xuất hóa đơn ra PDF và mở hộp thoại in (chuẩn A4)
export const printInvoice = ({
  t,
  selectedCustomer,
  customer,
  cartItems,
  totalAmount,
  invoiceDiscount,
  paymentMethod,
}) => {
  try {
    // 🧩 Kiểm tra dữ liệu
    if (!cartItems || cartItems.length === 0) {
      alert(t("sales.noItems") || "🛒 Chưa có sản phẩm để in!");
      return;
    }

    // 🧾 Tạo nội dung HTML hóa đơn
    const html = generateInvoiceHTML({
      t,
      selectedCustomer,
      customer,
      cartItems,
      totalAmount,
      invoiceDiscount,
      paymentMethod,
    });

    // 🧱 Tạo khối in ảo trong DOM
    const printArea = document.createElement("div");
    printArea.innerHTML = html;
    document.body.appendChild(printArea);

    // 🖨️ Cấu hình html2pdf (chuẩn khổ A4, không bị lệch)
    const opt = {
      margin: 0,
      filename: `HoaDon_${Date.now()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2, // tăng độ nét
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
      },
      jsPDF: {
        unit: "mm",
        format: "a4", // ✅ KHỔ A4 thật
        orientation: "portrait",
      },
    };

    // 📄 Xuất hóa đơn ra PDF và mở hộp thoại in trực tiếp
    html2pdf()
      .set(opt)
      .from(printArea)
      .outputPdf("dataurlnewwindow"); // ✅ mở tab xem + in trực tiếp

    // 🧹 Xóa DOM tạm sau khi in
    setTimeout(() => printArea.remove(), 1000);
  } catch (error) {
    console.error("❌ Lỗi khi in hóa đơn:", error);
    alert("Đã xảy ra lỗi khi tạo hóa đơn. Vui lòng thử lại!");
  }
};
