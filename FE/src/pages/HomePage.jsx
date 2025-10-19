import React from "react";
import MainLayout from "../layouts/MainLayout";

export default function HomePage({ theme, setTheme }) {
  return (
    <MainLayout theme={theme} setTheme={setTheme}>
      <div className={`p-4 border rounded bg-${theme} bg-opacity-25`}>
        <h2 className={`text-${theme}`}>Tổng quan</h2>
        <p>Nội dung trang tổng quan </p>
        <button className={`btn btn-${theme}`}>Nội dung</button>
      </div>
    </MainLayout>
  );
}
