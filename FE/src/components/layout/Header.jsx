import React, { useEffect, useRef, useState } from "react";
import ThemeSwitcher from "../navigation/ThemeSwitcher";
import LanguageSwitcher from "../navigation/LanguageSwitcher";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const accountRef = useRef(null);

  const handleLogout = async () => {
    try {
      // Nếu có API logout thì gọi:
      // await axios.post(`${API_BASE_URL}/auth/logout`, {
      //   refreshToken: localStorage.getItem("refreshToken")
      // });

    } catch (err) {
      console.warn("Logout API failed (ignored):", err);
    }

    // Xóa toàn bộ token / dữ liệu nhạy cảm
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    sessionStorage.clear();
    localStorage.clear(); // Dọn toàn bộ app

    // Điều hướng về login
    navigate("/login");

    // Reload đảm bảo mọi state bị reset sạch
    window.location.reload();
  };


  const handleAccount = () => {
    navigate("/account");
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (open && accountRef.current && !accountRef.current.contains(e.target)) {
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
    <header className="bg-light border-bottom py-2">
      <div
        className="container d-flex justify-content-between align-items-center"
        style={{ maxWidth: "83.33%" }}
      >
        <div
          className="d-flex align-items-center"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          <img
            src="/Logo.png"
            alt="VPOS Logo"
            width="75"
            height="30"
            className="me-2"
          />
        </div>

        <div className="d-flex gap-3 align-items-center">
          <ThemeSwitcher />
          <LanguageSwitcher />

          <div className={`dropdown ${open ? "show" : ""}`} ref={accountRef}>
            <button
              className="btn rounded-4 d-flex align-items-center justify-content-center border-0"
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: `var(--bs-${theme}-bg-subtle)`,
              }}
              aria-expanded={open}
              onClick={() => setOpen((prev) => !prev)}
              type="button"
            >
              <i className={`bi bi-person-fill text-${theme}`}></i>
            </button>

            <ul className={`dropdown-menu dropdown-menu-end ${open ? "show" : ""}`}>
              <li>
                <button className="dropdown-item" onClick={handleAccount}>
                  <i className="bi bi-person me-2"></i> {t("account.profile")}
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item text-danger"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>{" "}
                  {t("account.logout")}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
