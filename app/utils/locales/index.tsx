import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";

const resources = { en };

i18n.use(initReactI18next).init({
  compatibilityJSON: "v3",
  fallbackLng: "en",
  resources,
});

export default i18n;
