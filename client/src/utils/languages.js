export const defaultLanguage = "fr";

export const languages = Object.freeze({
  fr: {
    code: "fr",
    alternate: "en",
    dateLocale: "fr-FR",
    switchKey: "language.switchToEnglish",
  },
  en: {
    code: "en",
    alternate: "fr",
    dateLocale: "en-GB",
    switchKey: "language.switchToFrench",
  },
});

export const getLanguage = (language) =>
  languages[language?.startsWith("en") ? "en" : defaultLanguage];
