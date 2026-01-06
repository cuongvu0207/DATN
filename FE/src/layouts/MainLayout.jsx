import React, { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";  

export default function MainLayout({ children, theme, setTheme }) {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxContentWidth = 1500;

  const HEADER_HEIGHT = 64;
  const NAVBAR_HEIGHT = 56;
  const TOP_OFFSET = HEADER_HEIGHT + NAVBAR_HEIGHT;

  return (
    <div
      style={{
        minHeight: "100vh",                //  giúp footer luôn nằm cuối
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ===== HEADER FIXED ===== */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1030,
        }}
      >
        <Header theme={theme} setTheme={setTheme} />
        <Navbar theme={theme} />
      </div>

      {/* ===== CONTENT ===== */}
      <div
        className="w-100 d-flex justify-content-center"
        style={{
          marginTop: TOP_OFFSET,
          flex: 1,                         // ⭐ phần quan trọng để đẩy footer xuống
          padding: width >= 1400 ? "0 24px" : width >= 1000 ? "0 12px" : "0 6px",
          transition: "all .25s ease",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: `${maxContentWidth}px`,
          }}
        >
          {children}
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <Footer />                           
    </div>
  );
}
