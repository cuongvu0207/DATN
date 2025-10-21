import React, { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import Navbar from "../components/layout/Navbar";

export default function MainLayout({ children, theme, setTheme }) {
  // Trạng thái kiểm tra xem có phải màn hình desktop không
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1200);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1200);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Header */}
      <Header theme={theme} setTheme={setTheme} />

      {/* Navbar */}
      <Navbar theme={theme} />

      {/* Nội dung chính */}
      <div
        className="container-fluid"
        style={{
          paddingLeft: isDesktop ? "40px" : "0px",
          paddingRight: isDesktop ? "40px" : "0px",
          transition: "all 0.3s ease",
        }}
      >
        <div className="row justify-content-center">
          {/* Căn giữa nội dung, full width khi mobile */}
          <div className="col-12 col-lg-10">{children}</div>
        </div>
      </div>
    </>
  );
}
