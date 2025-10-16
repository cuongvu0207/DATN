import React from "react";
import ThemeSwitcher from "../navigation/ThemeSwitcher";
import LanguageSwitcher from "../navigation/LanguageSwitcher";
import { useTheme } from "../../context/ThemeContext";

export default function Header() {
  const { theme } = useTheme();

  return (
    <header className="d-flex justify-content-end align-items-center p-2 bg-light border-bottom">
      <div className="d-flex gap-3 align-items-center">
        {/* Chủ đề */}
        <ThemeSwitcher />

        {/* Ngôn ngữ */}
        <LanguageSwitcher />

        {/* Nút cá nhân */}
        <button
          className="btn rounded-4 d-flex align-items-center justify-content-center border-0"
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: `var(--bs-${theme}-bg-subtle)` 
          }}
        >
          <i className={`bi bi-person-fill text-${theme}`}></i>
        </button>
      </div>
    </header>
  );
}
