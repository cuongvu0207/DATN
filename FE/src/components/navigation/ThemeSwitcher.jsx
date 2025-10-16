import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme(); 
  const { t } = useTranslation(); // 👈 thêm hook dịch

  const colors = ["primary", "secondary", "success", "danger", "warning", "info", "dark"];

  const changeTheme = (color) => {
    setTheme(color); 
  };

  return (
    <div className="dropdown">
      <button
        className={`btn btn-light d-flex align-items-center text-black`}
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <i className="bi bi-palette me-1"></i> {t("theme.color")} {/* dùng i18n */}
      </button>
      <ul className="dropdown-menu p-2">
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
