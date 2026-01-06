import React from "react";
import { useTheme } from "../../context/ThemeContext";  // 🔥 import context

export default function Footer() {
  const { theme } = useTheme();           // lấy theme hiện tại
  const isDark = theme === "dark";

  return (
    <footer
      className={`text-center py-2 mt-auto ${
        isDark ? "bg-dark text-light" : "bg-light text-dark"
      }`}
      style={{
        borderTop: isDark ? "1px solid #333" : "1px solid #ddd",
      }}
    >
      <div className="container">
        <small style={{ fontSize: "13px", opacity: isDark ? 0.85 : 0.7 }}>
          © 2025 VPos - Hệ thống quản lý bán hàng | Developed by Vteam
        </small>
      </div>
    </footer>
  );
}