import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language === "vi" ? t("i18n.vietnamese") : t("i18n.english");
  const flagSrc = i18n.language === "vi" ? "/vn.png" : "/us.png";

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("appLang", lng);
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
        className="btn btn-light d-flex align-items-center text-black dropdown-toggle"
        type="button"
        id="languageDropdown"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <img
          src={flagSrc}
          alt="flag"
          width="24"
          height="16"
          className="me-2"
          style={{ borderRadius: 0 }}
        />
        {currentLang}
      </button>

      <ul
        className={`dropdown-menu dropdown-menu-end shadow-sm ${open ? "show" : ""}`}
        aria-labelledby="languageDropdown"
      >
        <li>
          <button
            className="dropdown-item d-flex align-items-center"
            onClick={() => changeLanguage("vi")}
          >
            <img
              src="/vn.png"
              alt="Vietnam flag"
              width="24"
              height="16"
              className="me-2"
              style={{ borderRadius: 0 }}
            />
            {t("i18n.vietnamese")}
          </button>
        </li>
        <li>
          <button
            className="dropdown-item d-flex align-items-center"
            onClick={() => changeLanguage("en")}
          >
            <img
              src="/us.png"
              alt="US flag"
              width="24"
              height="16"
              className="me-2"
              style={{ borderRadius: 0 }}
            />
            {t("i18n.english")}
          </button>
        </li>
      </ul>
    </div>
  );
}
