import React from "react";
import MainLayout from "../layouts/MainLayout";

export default function ProductListPage({ theme, setTheme }) {
  return (
    <MainLayout theme={theme} setTheme={setTheme}>
      <div className="p-4">
        <h2 className={`fw-bold text-${theme}`}>Danh sách hàng hoá</h2>
        <p>Đây là trang tiếp nối từ Trang Tổng quan (Home).</p>
      </div>
    </MainLayout>
  );
}
