import React, { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import Navbar from "../components/layout/Navbar";

export default function MainLayout({ children, theme, setTheme }) {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // max width cho desktop (giống dashboard chuyên nghiệp)
  const maxContentWidth = 1500; // bạn có thể chỉnh 1400/1600 tùy UI

  return (
    <>
      <Header theme={theme} setTheme={setTheme} />

      <Navbar theme={theme} />

      <div
        className="w-100 d-flex justify-content-center"
        style={{
          padding: width >= 1400 ? "0 24px" : width >= 1000 ? "0 12px" : "0 6px",
          transition: "all .25s ease",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: `${maxContentWidth}px`,
            transition: "all .25s ease",
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
