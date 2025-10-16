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

      {/* Nội dung */}
      <div className="container-fluid ">{children}</div>
    </>
  );
}
