import React, { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";

export default function HomePage({ theme, setTheme }) {
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    // Lấy accessToken từ localStorage
    const token = localStorage.getItem("accessToken");
    setAccessToken(token || "Chưa có token");
  }, []);

  return (
    <MainLayout theme={theme} setTheme={setTheme}>
      <div className={`p-4 border rounded bg-${theme} bg-opacity-25`}>
        <h2 className={`text-${theme}`}>Tổng quan</h2>
        <p>Nội dung trang tổng quan</p>

        {/* Hiển thị token */}
        <h5>Access Token:</h5>
        <p
          className="text-break text-muted border rounded p-2 bg-light"
          style={{ wordBreak: "break-all" }}
        >
          {accessToken}
        </p>

        <button className={`btn btn-${theme}`}>Nội dung</button>
      </div>
    </MainLayout>
  );
}
