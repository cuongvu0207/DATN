import React from "react";
import Header from "../components/layout/Header";
import Navbar from "../components/layout/Navbar";

export default function MainLayout({ children, theme, setTheme }) {
  return (
    <>
      {/* Header */}
      <Header theme={theme} setTheme={setTheme} />

      {/* Navbar */}
      <Navbar theme={theme} />

      {/* Nội dung chính */}
      <div className="container-fluid">
        <div className="row justify-content-center">
          {/* Chiếm 10/12 chiều ngang (cách đều mỗi bên 1/12) */}
          <div className="col-10">{children}</div>
        </div>
      </div>
    </>
  );
}
