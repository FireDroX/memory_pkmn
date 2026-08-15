import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./locales/fr.json";
import en from "./locales/en.json";
import { defaultLanguage, getLanguage } from "./utils/languages";

const storageKey = "pokeflip_language";
const savedLanguage = window.localStorage.getItem(storageKey);

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: ["fr", "en"].includes(savedLanguage) ? savedLanguage : defaultLanguage,
  fallbackLng: "fr",
  supportedLngs: ["fr", "en"],
  interpolation: { escapeValue: false },
});

const applyLanguage = (language) => {
  const resolvedLanguage = getLanguage(language).code;
  window.localStorage.setItem(storageKey, resolvedLanguage);
  document.documentElement.lang = resolvedLanguage;
  document.title = i18n.t("meta.title", { lng: resolvedLanguage });
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute(
      "content",
      i18n.t("meta.description", { lng: resolvedLanguage }),
    );
};

applyLanguage(i18n.resolvedLanguage);
i18n.on("languageChanged", applyLanguage);

export default i18n;
