import React from "react";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language === "vi" ? "Tiếng Việt" : "English";

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("appLang", lng); // lưu ngôn ngữ vào localStorage
  };

  return (
    <div className="dropdown">
      <button
        className={`btn btn-light d-flex align-items-center text-black dropdown-toggle`}
        type="button"
        id="languageDropdown"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        {currentLang}
      </button>
      <ul
        className="dropdown-menu dropdown-menu-end"
        aria-labelledby="languageDropdown"
      >
        <li>
          <button
            className="dropdown-item"
            onClick={() => changeLanguage("vi")}
          >
            🇻🇳 Tiếng Việt
          </button>
        </li>
        <li>
          <button
            className="dropdown-item"
            onClick={() => changeLanguage("en")}
          >
            🇬🇧 English
          </button>
        </li>
      </ul>
    </div>
  );
}
