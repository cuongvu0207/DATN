import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function exportProductsToExcel(products, t) {
  console.log("Exporting products:", products);

  if (!products || products.length === 0) {
    alert(t?.("products.noDataToExport") ?? "");
    return;
  }

  // 🔥 Header mới — KHÔNG có nhà cung cấp
  const worksheetData = [
    [
      t?.("products.productId") || "Mã hàng",
      t?.("products.productName") || "Tên hàng",
      t?.("products.brand") || "Thương hiệu",
      t?.("products.category") || "Danh mục",
      t?.("products.costOfCapital") || "Giá vốn",
      t?.("products.sellingPrice") || "Giá bán",
      t?.("products.quantityInStock") || "Tồn kho",
      t?.("products.createdAt") || "Ngày tạo",
    ],

    // 🔥 Data — Mã hàng = barcode, bỏ supplier
    ...products.map((p) => [
      p.barcode || p.id, // <-- sửa tại đây
      p.name,
      p.brand,
      p.category,
      p.cost,
      p.price,
      p.stock,
      p.createdAt,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");

  const dateStr = new Date().toLocaleDateString("vi-VN").replace(/\//g, "_");
  const fileName = `Danh_sach_san_pham_${dateStr}.xlsx`;

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, fileName);
}
