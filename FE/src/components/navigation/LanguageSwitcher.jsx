import React from "react";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const {t} = useTranslation();
  const currentLang = i18n.language === "vi" ? t("i18n.vietnamese") :  t("i18n.english");

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("appLang", lng); // lưu ngôn ngữ vào localStorage
  };

  const flagSrc = i18n.language === "vi" ? "/vn.png" : "/us.png";

  return (
    <div className="dropdown">
      <button
        className="btn btn-light d-flex align-items-center text-black dropdown-toggle"
        type="button"
        id="languageDropdown"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <img
          src={flagSrc}
          alt="flag"
          width="24"
          height="16"
          className="me-2"
          style={{ borderRadius: 0 }} // ✅ bỏ bo góc quốc kỳ
        />
        {currentLang}
      </button>

      <ul
        className="dropdown-menu dropdown-menu-end shadow-sm"
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
