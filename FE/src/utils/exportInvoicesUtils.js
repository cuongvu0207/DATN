import * as XLSX from "xlsx";

export const exportInvoicesToExcel = (invoices, t) => {
  const data = invoices.map((inv) => ({
    [t("invoices.invoiceId") || "Mã hóa đơn"]: inv.id,
    [t("invoices.customer") || "Khách hàng"]: inv.customer,
    [t("invoices.phone") || "Số điện thoại"]: inv.phone,
    [t("invoices.total") || "Tổng tiền"]: inv.total,
    [t("invoices.discount") || "Giảm giá"]: inv.discount,
    [t("invoices.paymentMethod") || "Phương thức thanh toán"]: inv.paymentMethod,
    [t("invoices.status") || "Trạng thái"]: inv.status,
    [t("invoices.seller") || "Nhân viên bán"]: inv.seller,
    [t("invoices.createdAt") || "Ngày tạo"]: inv.createdAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
  XLSX.writeFile(workbook, "DanhSachHoaDon.xlsx");
};
