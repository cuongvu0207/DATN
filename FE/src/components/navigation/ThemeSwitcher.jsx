import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const colors = ["primary", "secondary", "success", "danger", "warning", "info", "dark"];

  const changeTheme = (color) => {
    setTheme(color);
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (open && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className={`dropdown ${open ? "show" : ""}`} ref={dropdownRef}>
      <button
        className="btn btn-light d-flex align-items-center text-black"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <i className="bi bi-palette me-1"></i> {t("theme.color")}
      </button>
      <ul className={`dropdown-menu p-2 ${open ? "show" : ""}`}>
        {colors.map((color, idx) => (
          <li key={idx} className="d-inline-block m-1">
            <button
              className={`btn btn-${color}`}
              style={{ width: "30px", height: "30px" }}
              onClick={() => changeTheme(color)}
            >
              {theme === color && <i className="bi bi-check text-white"></i>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
