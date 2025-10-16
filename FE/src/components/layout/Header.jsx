import React from "react";
import ThemeSwitcher from "../navigation/ThemeSwitcher";
import LanguageSwitcher from "../navigation/LanguageSwitcher";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  const handleAccount = () => {
    navigate("/account");
  };

  return (
    <header className="d-flex justify-content-end align-items-center p-2 bg-light border-bottom">
      <div className="d-flex gap-3 align-items-center">
        {/* Chủ đề */}
        <ThemeSwitcher />

        {/* Ngôn ngữ */}
        <LanguageSwitcher />

        {/* Nút cá nhân */}
        <div className="dropdown">
          <button
            className="btn rounded-4 d-flex align-items-center justify-content-center border-0"
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: `var(--bs-${theme}-bg-subtle)`
            }}
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className={`bi bi-person-fill text-${theme}`}></i>
          </button>

          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <button className="dropdown-item" onClick={handleAccount}>
                <i className="bi bi-person me-2"></i> {t("account.profile")}
              </button>
            </li>
            <li>
              <button className="dropdown-item text-danger" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2"></i> {t("account.logout")}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
