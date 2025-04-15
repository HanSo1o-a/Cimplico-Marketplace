import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// 导入翻译文件
import enTranslation from "./translations/en.json";
import zhTranslation from "./translations/zh.json";

// 初始化 i18next
i18n
  .use(LanguageDetector)  // 自动检测用户语言
  .use(initReactI18next)  // 传递 i18n 实例给 react-i18next
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      zh: {
        translation: zhTranslation
      }
    },
    fallbackLng: "zh",    // 默认语言
    interpolation: {
      escapeValue: false  // React 已经安全地转义变量
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"]
    }
  });

export default i18n;
