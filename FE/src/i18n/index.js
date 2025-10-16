import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import vi from "./locales/vi.json";

// ✅ Lấy ngôn ngữ đã lưu, nếu chưa có thì mặc định "vi"
const savedLang = localStorage.getItem("appLang") || "vi";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    lng: savedLang,        // ✅ dùng ngôn ngữ đã lưu
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,  // React đã xử lý XSS
    },
  });

export default i18n;
